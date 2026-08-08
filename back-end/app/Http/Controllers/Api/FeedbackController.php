<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    private const PAGES_VALIDES = ['accueil', 'mes_sols', 'detail_sol', 'cotisations', 'parametres'];

    // POST /api/feedback
    // Toutes les questions sont facultatives (on ne force personne à
    // tout remplir), mais on refuse un avis entièrement vide, qui
    // n'aurait aucune valeur exploitable.
    public function store(Request $request)
    {
        $validated = $request->validate([
            'aime' => 'nullable|boolean',
            'meilleures_pages' => 'nullable|array',
            'meilleures_pages.*' => 'in:' . implode(',', self::PAGES_VALIDES),
            'pages_a_ameliorer' => 'nullable|array',
            'pages_a_ameliorer.*' => 'in:' . implode(',', self::PAGES_VALIDES),
            'recommande' => 'nullable|boolean',
        ]);

        $auMoinsUneReponse = $request->filled('aime')
            || !empty($validated['meilleures_pages'])
            || !empty($validated['pages_a_ameliorer'])
            || $request->filled('recommande');

        if (!$auMoinsUneReponse) {
            return response()->json([
                'message' => 'Répondez à au moins une question avant d\'envoyer votre avis.',
            ], 422);
        }

        $feedback = Feedback::create([
            ...$validated,
            'user_id' => $request->user()?->id,
        ]);

        return response()->json($feedback, 201);
    }
}