<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Sol;
use App\Models\Feedback;
use App\Models\JournalAudit;
use App\Models\DemandeAutorisation;
use App\Models\AppNotification;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminController extends Controller
{
    private const ACTIONS_RESTREINTES = [
        'export_utilisateurs',
        'export_avis',
        'export_journal',
        'reinitialiser_base',
    ];

    private function verifierAdmin(Request $request): void
    {
        if (!$request->user()?->is_admin) {
            abort(403, 'Accès réservé aux administrateurs.');
        }
    }

    /**
     * Autorise l'accès direct si l'utilisateur est administrateur
     * principal. Sinon, cherche une autorisation approuvée et non
     * encore utilisée pour cette action précise ; si elle existe, la
     * consomme (usage unique) et laisse passer. Sinon, bloque avec un
     * message clair.
     */
    private function verifierAutorisationOuBloquer(Request $request, string $action): void
    {
        $user = $request->user();

        if ($user->admin_niveau === 'principal') {
            return;
        }

        $autorisation = DemandeAutorisation::where('demandeur_id', $user->id)
            ->where('action', $action)
            ->where('statut', 'approuvee')
            ->first();

        if (!$autorisation) {
            abort(403, "Cette action nécessite l'autorisation de l'administrateur principal. Envoyez une demande depuis la page Admin.");
        }

        $autorisation->update(['statut' => 'utilisee']);
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

        $nombreAdminsActuels = User::where('is_admin', true)->count();
        if ($nombreAdminsActuels >= 3) {
            return response()->json([
                'message' => "Le nombre maximum d'administrateurs (3) est déjà atteint. Seul l'administrateur principal peut révoquer un admin pour libérer une place.",
            ], 422);
        }

        $existeUnPrincipal = User::where('is_admin', true)->where('admin_niveau', 'principal')->exists();
        $niveau = $existeUnPrincipal ? 'secondaire' : 'principal';

        $user->is_admin = true;
        $user->admin_niveau = $niveau;
        $user->save();

        JournalAudit::enregistrer($user, 'promotion_admin', 'User', $user->id, ['niveau' => $niveau]);

        return response()->json([
            'message' => 'Compte promu administrateur.',
            'user' => $user->fresh(),
        ]);
    }

    // DELETE /api/admin/revoquer/{utilisateur}
    public function revoquer(Request $request, User $utilisateur)
    {
        $this->verifierAdmin($request);

        $acteur = $request->user();

        if ($acteur->admin_niveau !== 'principal') {
            return response()->json([
                'message' => "Seul l'administrateur principal peut révoquer un autre administrateur.",
            ], 403);
        }

        if ($utilisateur->id === $acteur->id) {
            return response()->json([
                'message' => 'Vous ne pouvez pas révoquer vos propres droits administrateur.',
            ], 422);
        }

        if (!$utilisateur->is_admin) {
            return response()->json(['message' => "Ce compte n'est pas administrateur."], 422);
        }

        $utilisateur->is_admin = false;
        $utilisateur->admin_niveau = null;
        $utilisateur->save();

        JournalAudit::enregistrer($acteur, 'revocation_admin', 'User', $utilisateur->id, [
            'email_revoque' => $utilisateur->email,
        ]);

        return response()->json(['message' => 'Statut administrateur révoqué.']);
    }

    // GET /api/admin/administrateurs
    public function listeAdmins(Request $request)
    {
        $this->verifierAdmin($request);

        return User::select('id', 'name', 'email', 'admin_niveau')
            ->where('is_admin', true)
            ->orderByRaw("CASE WHEN admin_niveau = 'principal' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get();
    }

    // ===== Demandes d'autorisation (admins secondaires) =====

    // POST /api/admin/demandes
    public function creerDemande(Request $request)
    {
        $this->verifierAdmin($request);

        $validated = $request->validate([
            'action' => 'required|in:' . implode(',', self::ACTIONS_RESTREINTES),
        ]);

        $user = $request->user();

        if ($user->admin_niveau === 'principal') {
            return response()->json(['message' => "L'administrateur principal n'a pas besoin d'autorisation."], 422);
        }

        $dejaEnAttente = DemandeAutorisation::where('demandeur_id', $user->id)
            ->where('action', $validated['action'])
            ->where('statut', 'en_attente')
            ->exists();

        if ($dejaEnAttente) {
            return response()->json(['message' => 'Une demande pour cette action est déjà en attente.'], 422);
        }

        $demande = DemandeAutorisation::create([
            'demandeur_id' => $user->id,
            'action' => $validated['action'],
        ]);

        // Notifie tous les principaux (normalement un seul).
        User::where('is_admin', true)->where('admin_niveau', 'principal')
            ->get()
            ->each(function ($principal) use ($user, $validated) {
                AppNotification::create([
                    'user_id' => $principal->id,
                    'titre' => "Demande d'autorisation admin",
                    'message' => "{$user->name} demande l'autorisation de : " . self::libelleAction($validated['action']),
                ]);
            });

        return response()->json($demande, 201);
    }

    // GET /api/admin/demandes
    public function listeDemandes(Request $request)
    {
        $this->verifierAdmin($request);

        if ($request->user()->admin_niveau === 'principal') {
            // Le principal voit toutes les demandes en attente, de tous les secondaires.
            return DemandeAutorisation::with('demandeur:id,name,email')
                ->where('statut', 'en_attente')
                ->orderByDesc('created_at')
                ->get();
        }

        // Un secondaire ne voit que ses propres demandes.
        return DemandeAutorisation::where('demandeur_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();
    }

    // POST /api/admin/demandes/{demande}/approuver
    public function approuverDemande(Request $request, DemandeAutorisation $demande)
    {
        $this->verifierAdmin($request);

        if ($request->user()->admin_niveau !== 'principal') {
            return response()->json(['message' => "Seul l'administrateur principal peut approuver une demande."], 403);
        }

        $demande->update(['statut' => 'approuvee', 'traite_par_id' => $request->user()->id]);

        AppNotification::create([
            'user_id' => $demande->demandeur_id,
            'titre' => 'Demande approuvée',
            'message' => "Votre demande a été approuvée : " . self::libelleAction($demande->action) . ". Vous pouvez réessayer maintenant.",
        ]);

        JournalAudit::enregistrer($request->user(), 'approbation_demande_admin', 'DemandeAutorisation', $demande->id);

        return response()->json($demande->fresh());
    }

    // POST /api/admin/demandes/{demande}/refuser
    public function refuserDemande(Request $request, DemandeAutorisation $demande)
    {
        $this->verifierAdmin($request);

        if ($request->user()->admin_niveau !== 'principal') {
            return response()->json(['message' => "Seul l'administrateur principal peut refuser une demande."], 403);
        }

        $demande->update(['statut' => 'refusee', 'traite_par_id' => $request->user()->id]);

        AppNotification::create([
            'user_id' => $demande->demandeur_id,
            'titre' => 'Demande refusée',
            'message' => "Votre demande a été refusée : " . self::libelleAction($demande->action),
        ]);

        JournalAudit::enregistrer($request->user(), 'refus_demande_admin', 'DemandeAutorisation', $demande->id);

        return response()->json($demande->fresh());
    }

    private static function libelleAction(string $action): string
    {
        return match ($action) {
            'export_utilisateurs' => 'Exporter la liste des utilisateurs',
            'export_avis' => 'Exporter les avis',
            'export_journal' => "Exporter le journal d'audit",
            'reinitialiser_base' => 'Réinitialiser la base de données',
            default => $action,
        };
    }

    // GET /api/admin/statistiques
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

    // GET /api/admin/journal/recents
    public function recentsJournal(Request $request)
    {
        $this->verifierAdmin($request);

        return JournalAudit::with('user:id,name,email')
            ->orderByDesc('created_at')
            ->limit(3)
            ->get();
    }

    // GET /api/admin/utilisateurs/export
    public function exportUtilisateursCsv(Request $request): StreamedResponse
    {
        $this->verifierAdmin($request);
        $this->verifierAutorisationOuBloquer($request, 'export_utilisateurs');

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
                            $u->id, $u->name, $u->email, $u->sols_count,
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
        $this->verifierAutorisationOuBloquer($request, 'export_avis');

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

    // GET /api/admin/journal/export
    public function exportJournalCsv(Request $request): StreamedResponse
    {
        $this->verifierAdmin($request);
        $this->verifierAutorisationOuBloquer($request, 'export_journal');

        $nomFichier = 'journal_audit_' . now()->format('Y-m-d_His') . '.csv';

        return new StreamedResponse(function () {
            $flux = fopen('php://output', 'w');
            fwrite($flux, "\xEF\xBB\xBF");
            fputcsv($flux, ['ID', 'Date', 'Utilisateur', 'Email', 'Action', 'Entité', 'ID entité']);

            JournalAudit::with('user:id,name,email')
                ->orderBy('id')
                ->chunk(1000, function ($entrees) use ($flux) {
                    foreach ($entrees as $e) {
                        fputcsv($flux, [
                            $e->id,
                            $e->created_at?->format('d/m/Y H:i'),
                            $e->user?->name ?? 'Système / inconnu',
                            $e->user?->email ?? '',
                            $e->action,
                            $e->entite,
                            $e->entite_id,
                        ]);
                    }
                });

            fclose($flux);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$nomFichier}\"",
        ]);
    }

    // DELETE /api/admin/reinitialiser
    public function reinitialiserBaseDeDonnees(Request $request)
    {
        $this->verifierAdmin($request);
        $this->verifierAutorisationOuBloquer($request, 'reinitialiser_base');

        $validated = $request->validate([
            'confirmation' => 'required|string',
        ]);

        if ($validated['confirmation'] !== 'SUPPRIMER TOUT') {
            abort(422, 'Phrase de confirmation incorrecte.');
        }

        JournalAudit::enregistrer($request->user(), 'reinitialisation_base', 'Systeme', null);

        \Illuminate\Support\Facades\DB::statement(
            'TRUNCATE TABLE cotisations, tours, membres, sols, feedbacks, personal_access_tokens, users, demandes_autorisation, notifications RESTART IDENTITY CASCADE;'
        );

        return response()->json(['message' => 'Base de données réinitialisée.']);
    }
}