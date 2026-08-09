<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JournalAudit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // POST /api/register
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $token = $user->createToken('soltrack')->plainTextToken;

        JournalAudit::enregistrer($user, 'inscription', 'User', $user->id);

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    // POST /api/login
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email ou mot de passe incorrect.'],
            ]);
        }

        // Compte protégé par 2FA : on ne délivre pas de jeton final tout
        // de suite. On enregistre une attente temporaire (5 min) et on
        // demande le code de l'application d'authentification.
        if ($user->two_factor_enabled) {
            $jetonTemporaire = Str::random(40);
            Cache::put("2fa_attente:{$jetonTemporaire}", $user->id, now()->addMinutes(5));

            return response()->json([
                'deux_facteurs_requis' => true,
                'jeton_temporaire' => $jetonTemporaire,
            ]);
        }

        $token = $user->createToken('soltrack')->plainTextToken;

        JournalAudit::enregistrer($user, 'connexion', 'User', $user->id);

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    // POST /api/logout
    public function logout(Request $request)
    {
        $user = $request->user();
        $user->currentAccessToken()?->delete();

        JournalAudit::enregistrer($user, 'deconnexion', 'User', $user->id);

        return response()->json(null, 204);
    }

    // GET /api/user
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // PUT /api/user/profil
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
        ]);

        $user->update($validated);

        JournalAudit::enregistrer($user, 'modification_profil', 'User', $user->id, $validated);

        return response()->json($user);
    }

    // PUT /api/user/mot-de-passe
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $user->update(['password' => Hash::make($validated['password'])]);

        JournalAudit::enregistrer($user, 'changement_mot_de_passe', 'User', $user->id);

        return response()->json(['message' => 'Mot de passe mis à jour.']);
    }

    // DELETE /api/user
    public function destroyAccount(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'password' => 'required|string',
        ]);

        if (! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Mot de passe incorrect.'],
            ]);
        }

        JournalAudit::enregistrer($user, 'suppression_compte', 'User', $user->id, ['email' => $user->email]);

        $user->sols()->each(function ($sol) {
            $sol->delete();
        });

        $user->tokens()->delete();
        $user->delete();

        return response()->json(null, 204);
    }
}