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

        // On met à jour explicitement, jamais via un tableau validé
        // depuis la requête : évite tout risque d'escalade de
        // privilèges accidentelle via un autre formulaire.
        $request->user()->update(['is_admin' => true]);

        return response()->json(['message' => 'Compte promu administrateur.']);
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
}