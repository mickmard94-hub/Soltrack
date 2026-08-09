<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Feedback;
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
        $user->is_admin = true;
        $user->save();

        return response()->json([
            'message' => 'Compte promu administrateur.',
            'user' => $user->fresh(),
        ]);
    }

    // GET /api/admin/utilisateurs?page=1
    // Paginé côté serveur : même avec des millions d'utilisateurs, on
    // ne charge jamais que 25 lignes à la fois, ni en base ni en mémoire.
    public function utilisateurs(Request $request)
    {
        $this->verifierAdmin($request);

        return User::select('id', 'name', 'email', 'created_at')
            ->withCount('sols')
            ->orderByDesc('created_at')
            ->paginate(25);
    }

    // GET /api/admin/avis?page=1
    public function avis(Request $request)
    {
        $this->verifierAdmin($request);

        return Feedback::with('user:id,name,email')
            ->orderByDesc('created_at')
            ->paginate(25);
    }

    // GET /api/admin/utilisateurs/export
    // Génère un CSV en flux continu (streaming), lu par lots de 1000
    // lignes depuis la base (cursor), sans jamais tout charger en
    // mémoire d'un coup — indispensable si la table contient des
    // millions de lignes.
    public function exportUtilisateursCsv(Request $request): StreamedResponse
    {
        $this->verifierAdmin($request);

        $nomFichier = 'utilisateurs_' . now()->format('Y-m-d_His') . '.csv';

        return new StreamedResponse(function () {
            $flux = fopen('php://output', 'w');

            // BOM UTF-8 : indispensable pour qu'Excel affiche correctement
            // les accents français/créoles à l'ouverture du fichier.
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

        \Illuminate\Support\Facades\DB::statement(
            'TRUNCATE TABLE cotisations, tours, membres, sols, feedbacks, personal_access_tokens, users RESTART IDENTITY CASCADE;'
        );

        return response()->json(['message' => 'Base de données réinitialisée.']);
    }
}