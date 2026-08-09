<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Sol;
use App\Models\Feedback;
use App\Models\JournalAudit;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminController extends Controller
{
    private function verifierAdmin(Request $request): void
    {
        if (!$request->user()?->is_admin) {
            abort(403, 'Accès réservé aux administrateurs.');
        }
    }

    // POST /api/admin/promouvoir
    public function promouvoir(Request $request)
    {
        $validated = $request->validate([
            'secret' => 'required|string',
        ]);

        $secretAttendu = env('ADMIN_SECRET');

        if (!$secretAttendu || !hash_equals($secretAttendu, $validated['secret'])) {
            abort(403, 'Secret invalide.');
        }

        $user = $request->user();

        if ($user->is_admin) {
            return response()->json(['message' => 'Ce compte est déjà administrateur.', 'user' => $user], 200);
        }

        // Limite volontaire à 3 administrateurs maximum, pour éviter
        // qu'un secret partagé par erreur ne transforme un nombre
        // incontrôlé de comptes en administrateurs.
        $nombreAdminsActuels = User::where('is_admin', true)->count();
        if ($nombreAdminsActuels >= 3) {
            return response()->json([
                'message' => "Le nombre maximum d'administrateurs (3) est déjà atteint. Un administrateur existant doit d'abord être révoqué.",
            ], 422);
        }

        $user->is_admin = true;
        $user->save();

        JournalAudit::enregistrer($user, 'promotion_admin', 'User', $user->id);

        return response()->json([
            'message' => 'Compte promu administrateur.',
            'user' => $user->fresh(),
        ]);
    }

    // DELETE /api/admin/revoquer/{utilisateur}
    // Retire le statut administrateur d'un compte, pour libérer une
    // place dans la limite des 3 admins maximum. Un admin ne peut pas
    // se révoquer lui-même (évite de se retrouver bloqué sans admin
    // du tout si c'est le seul).
    public function revoquer(Request $request, User $utilisateur)
    {
        $this->verifierAdmin($request);

        if ($utilisateur->id === $request->user()->id) {
            return response()->json([
                'message' => 'Vous ne pouvez pas révoquer vos propres droits administrateur.',
            ], 422);
        }

        if (!$utilisateur->is_admin) {
            return response()->json(['message' => 'Ce compte n\'est pas administrateur.'], 422);
        }

        $utilisateur->is_admin = false;
        $utilisateur->save();

        JournalAudit::enregistrer($request->user(), 'revocation_admin', 'User', $utilisateur->id, [
            'email_revoque' => $utilisateur->email,
        ]);

        return response()->json(['message' => 'Statut administrateur révoqué.']);
    }

    // GET /api/admin/administrateurs
    public function listeAdmins(Request $request)
    {
        $this->verifierAdmin($request);

        return User::select('id', 'name', 'email')
            ->where('is_admin', true)
            ->orderBy('name')
            ->get();
    }

    // GET /api/admin/statistiques
    // Vue d'ensemble agrégée uniquement : aucune ligne individuelle
    // n'est chargée, ce qui reste rapide même avec des millions
    // d'enregistrements.
    public function statistiques(Request $request)
    {
        $this->verifierAdmin($request);

        $nombreUtilisateurs = User::count();
        $nombreSols = Sol::count();
        $premiereInscription = User::min('created_at');
        $derniereInscription = User::max('created_at');

        $totalAvis = Feedback::count();

        $repondentAime = Feedback::whereNotNull('aime')->count();
        $repondentRecommande = Feedback::whereNotNull('recommande')->count();
        $repondentMeilleures = Feedback::whereNotNull('meilleures_pages')
            ->whereRaw("json_array_length(meilleures_pages::json) > 0")
            ->count();
        $repondentAmeliorer = Feedback::whereNotNull('pages_a_ameliorer')
            ->whereRaw("json_array_length(pages_a_ameliorer::json) > 0")
            ->count();

        $tauxPourcentage = fn ($repondent) => $totalAvis > 0
            ? round(($repondent / $totalAvis) * 100, 1)
            : 0;

        return response()->json([
            'nombre_utilisateurs' => $nombreUtilisateurs,
            'nombre_sols' => $nombreSols,
            'premiere_inscription' => $premiereInscription,
            'derniere_inscription' => $derniereInscription,
            'nombre_avis' => $totalAvis,
            'taux_reponse' => [
                'aime' => $tauxPourcentage($repondentAime),
                'meilleures_pages' => $tauxPourcentage($repondentMeilleures),
                'pages_a_ameliorer' => $tauxPourcentage($repondentAmeliorer),
                'recommande' => $tauxPourcentage($repondentRecommande),
            ],
        ]);
    }

    // GET /api/admin/utilisateurs/recents
    public function recentsUtilisateurs(Request $request)
    {
        $this->verifierAdmin($request);

        return User::select('id', 'name', 'email', 'created_at', 'is_admin')
            ->withCount('sols')
            ->orderByDesc('created_at')
            ->limit(3)
            ->get();
    }

    // GET /api/admin/avis/recents
    public function recentsAvis(Request $request)
    {
        $this->verifierAdmin($request);

        return Feedback::with('user:id,name,email')
            ->orderByDesc('created_at')
            ->limit(3)
            ->get();
    }

    // GET /api/admin/utilisateurs/export
    // Génère un CSV en flux continu (streaming), lu par lots de 1000
    // lignes depuis la base (chunk), sans jamais tout charger en
    // mémoire d'un coup — indispensable si la table contient des
    // millions de lignes.
    public function exportUtilisateursCsv(Request $request): StreamedResponse
    {
        $this->verifierAdmin($request);

        $nomFichier = 'utilisateurs_' . now()->format('Y-m-d_His') . '.csv';

        return new StreamedResponse(function () {
            $flux = fopen('php://output', 'w');

            fwrite($flux, "\xEF\xBB\xBF");

            fputcsv($flux, ['ID', 'Nom', 'Email', 'Sols créés', 'Inscrit le']);

            User::select('id', 'name', 'email', 'created_at')
                ->withCount('sols')
                ->orderBy('id')
                ->chunk(1000, function ($utilisateurs) use ($flux) {
                    foreach ($utilisateurs as $u) {
                        fputcsv($flux, [
                            $u->id,
                            $u->name,
                            $u->email,
                            $u->sols_count,
                            $u->created_at?->format('d/m/Y H:i'),
                        ]);
                    }
                });

            fclose($flux);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$nomFichier}\"",
        ]);
    }

    // GET /api/admin/avis/export
    public function exportAvisCsv(Request $request): StreamedResponse
    {
        $this->verifierAdmin($request);

        $nomFichier = 'avis_' . now()->format('Y-m-d_His') . '.csv';

        return new StreamedResponse(function () {
            $flux = fopen('php://output', 'w');
            fwrite($flux, "\xEF\xBB\xBF");

            fputcsv($flux, ['ID', 'Aimé', 'Recommande', 'Meilleures pages', 'À améliorer', 'Utilisateur', 'Email', 'Date']);

            Feedback::with('user:id,name,email')
                ->orderBy('id')
                ->chunk(1000, function ($avisLot) use ($flux) {
                    foreach ($avisLot as $a) {
                        fputcsv($flux, [
                            $a->id,
                            $a->aime === null ? '' : ($a->aime ? 'Oui' : 'Non'),
                            $a->recommande === null ? '' : ($a->recommande ? 'Oui' : 'Non'),
                            implode(', ', $a->meilleures_pages ?? []),
                            implode(', ', $a->pages_a_ameliorer ?? []),
                            $a->user?->name ?? 'Anonyme',
                            $a->user?->email ?? '',
                            $a->created_at?->format('d/m/Y H:i'),
                        ]);
                    }
                });

            fclose($flux);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$nomFichier}\"",
        ]);
    }

    // GET /api/admin/journal?page=1
    public function journalAudit(Request $request)
    {
        $this->verifierAdmin($request);

        return JournalAudit::with('user:id,name,email')
            ->orderByDesc('created_at')
            ->paginate(30);
    }

    // DELETE /api/admin/reinitialiser
    public function reinitialiserBaseDeDonnees(Request $request)
    {
        $this->verifierAdmin($request);

        $validated = $request->validate([
            'confirmation' => 'required|string',
        ]);

        if ($validated['confirmation'] !== 'SUPPRIMER TOUT') {
            abort(422, 'Phrase de confirmation incorrecte.');
        }

        JournalAudit::enregistrer($request->user(), 'reinitialisation_base', 'Systeme', null);

        \Illuminate\Support\Facades\DB::statement(
            'TRUNCATE TABLE cotisations, tours, membres, sols, feedbacks, personal_access_tokens, users RESTART IDENTITY CASCADE;'
        );

        return response()->json(['message' => 'Base de données réinitialisée.']);
    }
}