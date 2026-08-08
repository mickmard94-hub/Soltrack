<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cotisation;
use App\Models\Tour;
use App\Models\Sol;
use App\Models\Membre;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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
        ]);

        $sol = Sol::findOrFail($validated['sol_id']);
        $membre = Membre::findOrFail($validated['membre_id']);

        if ($sol->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $datePaiement = Carbon::today()->toDateString();

        if ($sol->statut === 'cloture') {
            return response()->json([
                'message' => "Ce sol est clôturé, aucune nouvelle cotisation ne peut y être enregistrée.",
            ], 422);
        }

        if ($datePaiement < $sol->date_debut) {
            return response()->json([
                'message' => "Ce sol commence le {$sol->date_debut} : impossible d'enregistrer une cotisation avant cette date.",
            ], 422);
        }

        if ($membre->sol_id !== $sol->id) {
            return response()->json([
                'message' => "Ce membre n'appartient pas à ce sol.",
            ], 422);
        }

        $nombreMembresActuel = $sol->membres()->count();
        if ($nombreMembresActuel !== $sol->nombre_tours) {
            return response()->json([
                'message' => "Ce sol nécessite exactement {$sol->nombre_tours} membre(s) avant de pouvoir enregistrer des cotisations (actuellement : {$nombreMembresActuel}).",
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

        $tour = Tour::where('sol_id', $sol->id)
            ->where('numero_tour', $validated['tour_numero'])
            ->first();

        if (!$tour) {
            return response()->json([
                'message' => "Ce tour n'a pas encore de bénéficiaire assigné (ajoutez d'abord le membre correspondant).",
            ], 422);
        }

        try {
            $cotisation = DB::transaction(function () use ($sol, $membre, $validated, $datePaiement, $tour) {
                Tour::where('id', $tour->id)->lockForUpdate()->first();

                $dejaPaye = Cotisation::where('sol_id', $sol->id)
                    ->where('membre_id', $membre->id)
                    ->where('tour_numero', $validated['tour_numero'])
                    ->exists();

                if ($dejaPaye) {
                    abort(422, "Une cotisation a déjà été enregistrée pour ce membre sur ce tour.");
                }

                $cotisation = Cotisation::create([
                    'sol_id' => $sol->id,
                    'membre_id' => $membre->id,
                    'tour_numero' => $validated['tour_numero'],
                    'montant' => $validated['montant'],
                    'date_paiement' => $datePaiement,
                    'statut' => 'paye',
                ]);

                $nombreMembres = $sol->membres()->count();
                $nombreCotisationsPourCeTour = Cotisation::where('sol_id', $sol->id)
                    ->where('tour_numero', $validated['tour_numero'])
                    ->count();

                if ($nombreCotisationsPourCeTour >= $nombreMembres) {
                    $tour->update([
                        'statut' => 'verse',
                        'date_versement' => $datePaiement,
                    ]);
                }

                return $cotisation;
            });
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($cotisation, 201);
    }

    // DELETE /api/cotisations/{cotisation}
    public function destroy(Request $request, Cotisation $cotisation)
    {
        $sol = $cotisation->sol;

        if ($sol->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        DB::transaction(function () use ($cotisation, $sol) {
            $tour = Tour::where('sol_id', $sol->id)
                ->where('numero_tour', $cotisation->tour_numero)
                ->first();

            $cotisation->delete();

            if ($tour && $tour->statut === 'verse') {
                $tour->update(['statut' => 'a_venir', 'date_versement' => null]);
            }
        });

        return response()->json(null, 204);
    }
}