<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cotisation;
use App\Models\Tour;
use App\Models\Sol;
use App\Models\Membre;
use Illuminate\Http\Request;

class CotisationController extends Controller
{
    // POST /api/cotisations
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sol_id' => 'required|exists:sols,id',
            'membre_id' => 'required|exists:membres,id',
            'tour_numero' => 'required|integer|min:1',
            'montant' => 'required|numeric|min:0',
            'date_paiement' => 'required|date',
        ]);

        $sol = Sol::findOrFail($validated['sol_id']);
        $membre = Membre::findOrFail($validated['membre_id']);

        if ($membre->sol_id !== $sol->id) {
            return response()->json([
                'message' => "Ce membre n'appartient pas à ce sol.",
            ], 422);
        }

        if ($validated['tour_numero'] > $sol->nombre_tours) {
            return response()->json([
                'message' => "Le numéro de tour doit être compris entre 1 et {$sol->nombre_tours}.",
            ], 422);
        }

        if (bccomp((string) $validated['montant'], (string) $sol->montant_cotisation, 2) !== 0) {
            return response()->json([
                'message' => "Le montant doit être égal à la cotisation fixée pour ce sol ({$sol->montant_cotisation} HTG).",
            ], 422);
        }

        if ($validated['date_paiement'] < $sol->date_debut) {
            return response()->json([
                'message' => "La date de paiement ne peut pas être antérieure à la date de début du sol.",
            ], 422);
        }

        $dejaPaye = Cotisation::where('sol_id', $sol->id)
            ->where('membre_id', $membre->id)
            ->where('tour_numero', $validated['tour_numero'])
            ->exists();

        if ($dejaPaye) {
            return response()->json([
                'message' => "Une cotisation a déjà été enregistrée pour ce membre sur ce tour.",
            ], 422);
        }

        $validated['statut'] = 'paye';
        $cotisation = Cotisation::create($validated);

        Tour::where('sol_id', $sol->id)
            ->where('numero_tour', $validated['tour_numero'])
            ->update([
                'statut' => 'verse',
                'date_versement' => $validated['date_paiement'],
            ]);

        return response()->json($cotisation, 201);
    }
}