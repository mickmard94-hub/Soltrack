<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sol;
use Illuminate\Http\Request;

class SolController extends Controller
{
    // GET /api/sols
    public function index(Request $request)
    {
        return $request->user()->sols()->paginate(10);
    }

    // POST /api/sols
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'montant_cotisation' => 'required|numeric|min:0',
            'frequence' => 'required|in:hebdomadaire,mensuelle',
            'nombre_tours' => 'required|integer|min:1',
            'date_debut' => 'required|date',
        ]);

        $sol = $request->user()->sols()->create($validated);

        return response()->json($sol, 201);
    }

    // GET /api/sols/{sol}
    public function show(Request $request, Sol $sol)
    {
        if ($sol->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        return $sol->load('membres', 'tours.membreBeneficiaire');
    }

    // PUT /api/sols/{sol}
    public function update(Request $request, Sol $sol)
    {
        if ($sol->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'montant_cotisation' => 'sometimes|required|numeric|min:0',
            'frequence' => 'sometimes|required|in:hebdomadaire,mensuelle',
            'nombre_tours' => 'sometimes|required|integer|min:1',
            'date_debut' => 'sometimes|required|date',
            'statut' => 'sometimes|required|in:actif,cloture',
        ]);

        $sol->update($validated);

        return response()->json($sol);
    }

    // DELETE /api/sols/{sol}
    public function destroy(Request $request, Sol $sol)
    {
        if ($sol->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $sol->delete();

        return response()->json(null, 204);
    }

    // GET /api/sols/{sol}/tableau-de-bord
    public function tableauDeBord(Request $request, Sol $sol)
    {
        if ($sol->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $totalCollecte = $sol->cotisations()->sum('montant');

        $prochainTour = $sol->tours()
            ->where('statut', 'a_venir')
            ->orderBy('numero_tour')
            ->first();

        $cotisationsEnAttente = 0;
        if ($prochainTour) {
            $nombreMembres = $sol->membres()->count();
            $nombreDejaPayes = $sol->cotisations()
                ->where('tour_numero', $prochainTour->numero_tour)
                ->count();
            $cotisationsEnAttente = max(0, $nombreMembres - $nombreDejaPayes);
        }

        $cotisationsEnRetard = $sol->tours()
            ->where('statut', 'a_venir')
            ->where('date_prevue', '<', now())
            ->count();

        return response()->json([
            'total_collecte' => $totalCollecte,
            'prochain_beneficiaire' => $prochainTour?->membreBeneficiaire?->nom,
            'prochaine_date' => $prochainTour?->date_prevue,
            'cotisations_en_attente' => $cotisationsEnAttente,
            'cotisations_en_retard' => $cotisationsEnRetard,
        ]);
    }

    // GET /api/sols/{sol}/cotisations-manquantes
    public function cotisationsManquantes(Request $request, Sol $sol)
    {
        if ($sol->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $prochainTour = $sol->tours()
            ->where('statut', 'a_venir')
            ->orderBy('numero_tour')
            ->first();

        if (!$prochainTour) {
            return response()->json([
                'tour_numero' => null,
                'membres_manquants' => [],
            ]);
        }

        $idsDejaPayes = $sol->cotisations()
            ->where('tour_numero', $prochainTour->numero_tour)
            ->pluck('membre_id');

        $membresManquants = $sol->membres()
            ->whereNotIn('id', $idsDejaPayes)
            ->get();

        return response()->json([
            'tour_numero' => $prochainTour->numero_tour,
            'membres_manquants' => $membresManquants,
        ]);
    }
}