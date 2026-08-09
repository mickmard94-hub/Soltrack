<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Feedback;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Vérifie que l'utilisateur connecté est bien administrateur.
     * Centralisé ici pour ne jamais l'oublier sur une nouvelle route.
     */
    private function verifierAdmin(Request $request): void
    {
        if (!$request->user()?->is_admin) {
            abort(403, 'Accès réservé aux administrateurs.');
        }
    }

    // POST /api/admin/promouvoir
    // Transforme le compte connecté en administrateur, mais uniquement
    // si le bon secret (défini côté serveur, jamais dans le code) est
    // fourni. Ce secret n'existe que dans les variables d'environnement
    // Render — personne d'autre que vous ne peut l'utiliser.
    public function promouvoir(Request $request)
    {
        $validated = $request->validate([
            'secret' => 'required|string',
        ]);

        $secretAttendu = env('ADMIN_SECRET');

        if (!$secretAttendu || !hash_equals($secretAttendu, $validated['secret'])) {
            abort(403, 'Secret invalide.');
        }

        // Affectation directe + save() plutôt que ->update([...]) :
        // is_admin est volontairement absent de $fillable pour empêcher
        // toute auto-promotion via un autre formulaire (comme la mise à
        // jour du profil). Ici, c'est le seul chemin légitime et protégé
        // par secret, donc on contourne cette protection explicitement,
        // sans jamais passer par le mass assignment.
        $user = $request->user();
        $user->is_admin = true;
        $user->save();

        return response()->json([
            'message' => 'Compte promu administrateur.',
            'user' => $user->fresh(),
        ]);
    }

    // GET /api/admin/utilisateurs
    public function utilisateurs(Request $request)
    {
        $this->verifierAdmin($request);

        return User::select('id', 'name', 'email', 'created_at')
            ->withCount('sols')
            ->orderByDesc('created_at')
            ->get();
    }

    // GET /api/admin/avis
    public function avis(Request $request)
    {
        $this->verifierAdmin($request);

        return Feedback::with('user:id,name,email')
            ->orderByDesc('created_at')
            ->get();
    }

    // DELETE /api/admin/reinitialiser
    // Vide toutes les tables de données (utilisateurs, sols, membres,
    // tours, cotisations, avis) tout en gardant la structure de la
    // base intacte. Protégé par le statut admin ET une phrase de
    // confirmation tapée exactement, pour éviter tout clic accidentel
    // sur une action aussi destructrice et irréversible.
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