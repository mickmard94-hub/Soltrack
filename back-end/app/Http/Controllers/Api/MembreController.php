<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sol;
use App\Models\Membre;
use App\Models\Tour;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class MembreController extends Controller
{
    // GET /api/sols/{sol}/membres
    public function index(Sol $sol)
    {
        return $sol->membres;
    }

    // POST /api/sols/{sol}/membres
    public function store(Request $request, Sol $sol)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'telephone' => 'nullable|string|max:20',
            'ordre_reception' => [
                'required',
                'integer',
                'min:1',
                'max:' . $sol->nombre_tours,
                Rule::unique('membres', 'ordre_reception')->where('sol_id', $sol->id),
            ],
        ]);

        $membre = $sol->membres()->create($validated);

        $dateInterval = $sol->frequence === 'hebdomadaire' ? 7 : 30;
        $datePrevue = Carbon::parse($sol->date_debut)
            ->addDays($dateInterval * ($validated['ordre_reception'] - 1));

        Tour::updateOrCreate(
            [
                'sol_id' => $sol->id,
                'numero_tour' => $validated['ordre_reception'],
            ],
            [
                'membre_beneficiaire_id' => $membre->id,
                'date_prevue' => $datePrevue,
                'statut' => 'a_venir',
            ]
        );

        return response()->json($membre, 201);
    }

    // PUT /api/membres/{membre}
    public function update(Request $request, Membre $membre)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'telephone' => 'nullable|string|max:20',
            'ordre_reception' => [
                'sometimes',
                'required',
                'integer',
                'min:1',
                Rule::unique('membres', 'ordre_reception')
                    ->where('sol_id', $membre->sol_id)
                    ->ignore($membre->id),
            ],
        ]);

        $membre->update($validated);

        return response()->json($membre);
    }

    // DELETE /api/membres/{membre}
    public function destroy(Membre $membre)
    {
        $membre->delete();

        return response()->json(null, 204);
    }
}