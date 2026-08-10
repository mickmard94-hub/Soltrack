<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sol;
use App\Models\Membre;
use App\Models\Tour;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MembreController extends Controller
{
    private function verifierProprietaire(Request $request, Sol $sol): void
    {
        if ($sol->user_id !== $request->user()->id) {
            abort(403, 'Accès non autorisé.');
        }
    }

    // GET /api/sols/{sol}/membres
    public function index(Request $request, Sol $sol)
    {
        $this->verifierProprietaire($request, $sol);

        return $sol->membres;
    }

    private function calculerDatePrevue(Sol $sol, int $ordreReception)
    {
        $dateInterval = $sol->frequence_jours
            ?? ($sol->frequence === 'hebdomadaire' ? 7 : 30);

        return Carbon::parse($sol->date_debut)
            ->addDays($dateInterval * ($ordreReception - 1));
    }

    private function assignerTour(Sol $sol, int $ordreReception, ?int $membreId)
    {
        Tour::updateOrCreate(
            ['sol_id' => $sol->id, 'numero_tour' => $ordreReception],
            [
                'membre_beneficiaire_id' => $membreId,
                'date_prevue' => $this->calculerDatePrevue($sol, $ordreReception),
                'statut' => 'a_venir',
            ]
        );
    }

    private function plageContientTourVerse(Sol $sol, int $min, int $max): bool
    {
        return Tour::where('sol_id', $sol->id)
            ->whereBetween('numero_tour', [$min, $max])
            ->where('statut', 'verse')
            ->exists();
    }

    // POST /api/sols/{sol}/membres
    public function store(Request $request, Sol $sol)
    {
        $this->verifierProprietaire($request, $sol);

        if ($sol->statut === 'cloture') {
            return response()->json([
                'message' => "Ce sol est clôturé, aucun nouveau membre ne peut y être ajouté.",
            ], 422);
        }

        $nombreMembresActuel = $sol->membres()->count();

        if ($nombreMembresActuel >= $sol->nombre_tours) {
            return response()->json([
                'message' => "Ce sol est déjà complet ({$sol->nombre_tours} membre(s)).",
            ], 422);
        }

        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'telephone' => 'nullable|string|max:20',
            'ordre_reception' => 'required|integer|min:1|max:' . ($nombreMembresActuel + 1),
        ]);

        $position = $validated['ordre_reception'];

        if ($this->plageContientTourVerse($sol, $position, $nombreMembresActuel)) {
            return response()->json([
                'message' => "Impossible d'insérer un membre à cette position : un tour déjà versé se trouve dans la plage à décaler.",
            ], 422);
        }

        $membre = DB::transaction(function () use ($sol, $validated, $position) {
            Sol::where('id', $sol->id)->lockForUpdate()->first();

            $membresADecaler = $sol->membres()
                ->where('ordre_reception', '>=', $position)
                ->orderByDesc('ordre_reception')
                ->get();

            foreach ($membresADecaler as $autreMembre) {
                $nouvelOrdre = $autreMembre->ordre_reception + 1;
                $autreMembre->update(['ordre_reception' => $nouvelOrdre]);
                $this->assignerTour($sol, $nouvelOrdre, $autreMembre->id);
            }

            $nouveauMembre = $sol->membres()->create([
                'nom' => $validated['nom'],
                'telephone' => $validated['telephone'] ?? null,
                'ordre_reception' => $position,
            ]);

            $this->assignerTour($sol, $position, $nouveauMembre->id);

            return $nouveauMembre;
        });

        return response()->json($membre, 201);
    }

    // PUT /api/membres/{membre}
    public function update(Request $request, Membre $membre)
    {
        $sol = $membre->sol;
        $this->verifierProprietaire($request, $sol);

        $ancienOrdre = $membre->ordre_reception;
        $nombreMembresActuel = $sol->membres()->count();

        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'telephone' => 'nullable|string|max:20',
            'ordre_reception' => 'sometimes|required|integer|min:1|max:' . $nombreMembresActuel,
        ]);

        $nouvelOrdre = $validated['ordre_reception'] ?? $ancienOrdre;

        if ($nouvelOrdre !== $ancienOrdre) {
            $min = min($ancienOrdre, $nouvelOrdre);
            $max = max($ancienOrdre, $nouvelOrdre);

            if ($this->plageContientTourVerse($sol, $min, $max)) {
                return response()->json([
                    'message' => "Impossible de déplacer ce membre : un tour déjà versé se trouve entre les positions {$min} et {$max}.",
                ], 422);
            }

            $autresDansLaPlage = $sol->membres()
                ->where('id', '!=', $membre->id)
                ->whereBetween('ordre_reception', [$min, $max])
                ->get();

            if ($autresDansLaPlage->count() === 1) {
                $conflit = $autresDansLaPlage->first();

                return response()->json([
                    'message' => "La position {$nouvelOrdre} est déjà occupée par {$conflit->nom}. Utilisez l'échange de tour pour confirmer la permutation.",
                    'membre_id' => $conflit->id,
                    'nom' => $conflit->nom,
                    'ordre_reception' => $conflit->ordre_reception,
                ], 409);
            }

            DB::transaction(function () use ($sol, $membre, $ancienOrdre, $nouvelOrdre) {
                $membre->update(['ordre_reception' => -1]);

                if ($nouvelOrdre > $ancienOrdre) {
                    $aDecaler = $sol->membres()
                        ->whereBetween('ordre_reception', [$ancienOrdre + 1, $nouvelOrdre])
                        ->orderBy('ordre_reception')
                        ->get();

                    foreach ($aDecaler as $autreMembre) {
                        $nouvelOrdreAutre = $autreMembre->ordre_reception - 1;
                        $autreMembre->update(['ordre_reception' => $nouvelOrdreAutre]);
                        $this->assignerTour($sol, $nouvelOrdreAutre, $autreMembre->id);
                    }
                } else {
                    $aDecaler = $sol->membres()
                        ->whereBetween('ordre_reception', [$nouvelOrdre, $ancienOrdre - 1])
                        ->orderByDesc('ordre_reception')
                        ->get();

                    foreach ($aDecaler as $autreMembre) {
                        $nouvelOrdreAutre = $autreMembre->ordre_reception + 1;
                        $autreMembre->update(['ordre_reception' => $nouvelOrdreAutre]);
                        $this->assignerTour($sol, $nouvelOrdreAutre, $autreMembre->id);
                    }
                }

                $membre->update(['ordre_reception' => $nouvelOrdre]);
                $this->assignerTour($sol, $nouvelOrdre, $membre->id);
            });
        } else {
            $membre->update($validated);
        }

        return response()->json($membre->fresh());
    }

    // POST /api/sols/{sol}/membres/echanger-tour
    public function echangerTour(Request $request, Sol $sol)
    {
        $this->verifierProprietaire($request, $sol);

        if ($sol->statut === 'cloture') {
            return response()->json([
                'message' => "Ce sol est clôturé, aucun échange de tour n'est plus possible.",
            ], 422);
        }

        $validated = $request->validate([
            'membre_id_1' => 'required|integer|different:membre_id_2|exists:membres,id',
            'membre_id_2' => 'required|integer|exists:membres,id',
        ]);

        $membre1 = Membre::findOrFail($validated['membre_id_1']);
        $membre2 = Membre::findOrFail($validated['membre_id_2']);

        if ($membre1->sol_id !== $sol->id || $membre2->sol_id !== $sol->id) {
            return response()->json([
                'message' => "Les deux membres doivent appartenir à ce sol.",
            ], 422);
        }

        $ordre1 = $membre1->ordre_reception;
        $ordre2 = $membre2->ordre_reception;

        $tour1 = Tour::where('sol_id', $sol->id)->where('numero_tour', $ordre1)->first();
        $tour2 = Tour::where('sol_id', $sol->id)->where('numero_tour', $ordre2)->first();

        if (($tour1 && $tour1->statut === 'verse') || ($tour2 && $tour2->statut === 'verse')) {
            return response()->json([
                'message' => "Impossible d'échanger un tour déjà versé.",
            ], 422);
        }

        DB::transaction(function () use ($membre1, $membre2, $tour1, $tour2, $ordre1, $ordre2) {
            $membre1->update(['ordre_reception' => -1]);
            $membre2->update(['ordre_reception' => $ordre1]);
            $membre1->update(['ordre_reception' => $ordre2]);

            $tour1?->update(['membre_beneficiaire_id' => $membre2->id]);
            $tour2?->update(['membre_beneficiaire_id' => $membre1->id]);
        });

        return response()->json([
            'message' => "Les tours de {$membre1->nom} et {$membre2->nom} ont été échangés.",
        ]);
    }

    // DELETE /api/membres/{membre}
    public function destroy(Request $request, Membre $membre)
    {
        $sol = $membre->sol;
        $this->verifierProprietaire($request, $sol);

        $ordreRetire = $membre->ordre_reception;
        $nombreMembresActuel = $sol->membres()->count();

        if ($this->plageContientTourVerse($sol, $ordreRetire, $nombreMembresActuel)) {
            return response()->json([
                'message' => "Impossible de retirer ce membre : son tour (ou un tour suivant à décaler) a déjà été versé.",
            ], 422);
        }

        DB::transaction(function () use ($sol, $membre, $ordreRetire, $nombreMembresActuel) {
            $membre->delete();

            $suivants = $sol->membres()
                ->where('ordre_reception', '>', $ordreRetire)
                ->orderBy('ordre_reception')
                ->get();

            foreach ($suivants as $autreMembre) {
                $nouvelOrdre = $autreMembre->ordre_reception - 1;
                $autreMembre->update(['ordre_reception' => $nouvelOrdre]);
                $this->assignerTour($sol, $nouvelOrdre, $autreMembre->id);
            }

            Tour::where('sol_id', $sol->id)
                ->where('numero_tour', $nombreMembresActuel)
                ->delete();
        });

        return response()->json(null, 204);
    }
}