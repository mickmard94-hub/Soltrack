<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    // Pages valides : on restreint aux valeurs connues pour garder des
    // données propres et exploitables, plutôt que du texte libre.
    private const PAGES_VALIDES = ['accueil', 'mes_sols', 'detail_sol', 'cotisations', 'parametres'];

    // POST /api/feedback
    public function store(Request $request)
    {
        $validated = $request->validate([
            'aime' => 'required|boolean',
            'meilleure_page' => 'required|in:' . implode(',', self::PAGES_VALIDES),
            'page_a_ameliorer' => 'required|in:' . implode(',', self::PAGES_VALIDES),
            'recommande' => 'required|boolean',
        ]);

        $feedback = Feedback::create([
            ...$validated,
            'user_id' => $request->user()?->id,
        ]);

        return response()->json($feedback, 201);
    }
}