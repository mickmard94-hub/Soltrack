<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JournalAudit;
use App\Models\User;
use App\Services\TotpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class TwoFactorController extends Controller
{
    // POST /api/2fa/activer
    // Génère un secret et l'URI à scanner, mais n'active RIEN tant que
    // l'utilisateur n'a pas prouvé qu'il a bien configuré son
    // application (via /confirmer) — évite de se verrouiller son
    // propre compte par erreur.
    public function activer(Request $request)
    {
        $user = $request->user();

        if ($user->two_factor_enabled) {
            return response()->json(['message' => 'La double authentification est déjà activée.'], 422);
        }

        $secret = TotpService::genererSecret();
        $user->two_factor_secret = $secret;
        $user->save();

        return response()->json([
            'secret' => $secret,
            'uri' => TotpService::genererUri($secret, $user->email),
        ]);
    }

    // POST /api/2fa/confirmer
    public function confirmer(Request $request)
    {
        $validated = $request->validate(['code' => 'required|string']);
        $user = $request->user();

        if (!$user->two_factor_secret) {
            return response()->json(['message' => "Activez d'abord la double authentification."], 422);
        }

        if (!TotpService::verifier($user->two_factor_secret, $validated['code'])) {
            return response()->json(['message' => 'Code invalide.'], 422);
        }

        $user->two_factor_enabled = true;
        $user->save();

        JournalAudit::enregistrer($user, 'activation_2fa', 'User', $user->id);

        return response()->json(['message' => 'Double authentification activée.']);
    }

    // POST /api/2fa/desactiver
    public function desactiver(Request $request)
    {
        $validated = $request->validate(['password' => 'required|string']);
        $user = $request->user();

        if (!Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Mot de passe incorrect.'], 422);
        }

        $user->two_factor_enabled = false;
        $user->two_factor_secret = null;
        $user->save();

        JournalAudit::enregistrer($user, 'desactivation_2fa', 'User', $user->id);

        return response()->json(['message' => 'Double authentification désactivée.']);
    }

    // POST /api/2fa/verifier-connexion
    // Deuxième étape de la connexion pour un compte avec 2FA activée.
    public function verifierConnexion(Request $request)
    {
        $validated = $request->validate([
            'jeton_temporaire' => 'required|string',
            'code' => 'required|string',
        ]);

        $userId = Cache::get("2fa_attente:{$validated['jeton_temporaire']}");

        if (!$userId) {
            return response()->json(['message' => 'Session expirée, reconnectez-vous.'], 422);
        }

        $user = User::find($userId);

        if (!$user || !TotpService::verifier($user->two_factor_secret, $validated['code'])) {
            return response()->json(['message' => 'Code invalide.'], 422);
        }

        Cache::forget("2fa_attente:{$validated['jeton_temporaire']}");

        $token = $user->createToken('soltrack')->plainTextToken;

        JournalAudit::enregistrer($user, 'connexion', 'User', $user->id);

        return response()->json(['user' => $user, 'token' => $token]);
    }
}