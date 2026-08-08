<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        $token = $user->createToken('soltrack')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    // POST /api/logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

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

        // Supprime explicitement les sols (et par cascade membres/tours/
        // cotisations) avant de supprimer le compte, pour garantir qu'aucune
        // donnée orpheline ne reste, indépendamment de la configuration
        // de cascade en base.
        $user->sols()->each(function ($sol) {
            $sol->delete();
        });

        $user->tokens()->delete();
        $user->delete();

        return response()->json(null, 204);
    }
}