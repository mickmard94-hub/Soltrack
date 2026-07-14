<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cotisation;
use App\Models\Tour;
use App\Models\Sol;
use App\Models\Membre;
use Illuminate\Http\Request;
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

        // La date d'une cotisation n'est jamais saisie manuellement : elle
        // correspond toujours au jour réel de son enregistrement, ni avant
        // ni après. Le membre peut cotiser en avance ou en retard sur le
        // TOUR concerné (tour_numero), mais la date de la transaction
        // elle-même ne peut pas être falsifiée.
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

        // La règle du sol impose exactement autant de membres que de tours :
        // impossible d'enregistrer une cotisation tant que tous les tours
        // n'ont pas leur membre (chaque tour doit avoir un bénéficiaire
        // défini avant que la collecte n'ait un sens).
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

        // Une personne ne peut cotiser que le montant exact fixé pour ce sol,
        // ni plus (sur-cotisation), ni moins (cotisation partielle).
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

        $dejaPaye = Cotisation::where('sol_id', $sol->id)
            ->where('membre_id', $membre->id)
            ->where('tour_numero', $validated['tour_numero'])
            ->exists();

        if ($dejaPaye) {
            return response()->json([
                'message' => "Une cotisation a déjà été enregistrée pour ce membre sur ce tour.",
            ], 422);
        }

        $cotisation = Cotisation::create([
            'sol_id' => $sol->id,
            'membre_id' => $membre->id,
            'tour_numero' => $validated['tour_numero'],
            'montant' => $validated['montant'],
            'date_paiement' => $datePaiement,
            'statut' => 'paye',
        ]);

        // Un tour n'est marqué "versé" (la cagnotte remise au bénéficiaire)
        // que lorsque TOUS les membres du sol ont cotisé pour ce tour — jamais
        // au premier paiement reçu. Le versement se fait donc mécaniquement à
        // la fin de la collecte, jamais à son commencement.
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

        return response()->json($cotisation, 201);
    }
}
