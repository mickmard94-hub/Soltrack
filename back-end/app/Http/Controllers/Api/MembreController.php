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
    // GET /api/sols/{sol}/membres
    public function index(Sol $sol)
    {
        return $sol->membres;
    }

    /**
     * Calcule la date de début réelle d'un tour à partir de son ordre et
     * de la fréquence du sol (règle des dates liées à la réalité). Le
     * calendrier d'un emplacement (numéro de tour) est fixe : seul le
     * membre qui l'occupe peut changer.
     */
    private function calculerDatePrevue(Sol $sol, int $ordreReception)
    {
        $dateInterval = $sol->frequence === 'hebdomadaire' ? 7 : 30;

        return Carbon::parse($sol->date_debut)
            ->addDays($dateInterval * ($ordreReception - 1));
    }

    /**
     * Assigne (ou réassigne) le tour correspondant à un ordre de réception
     * donné à un membre précis, en conservant la date propre à cet
     * emplacement.
     */
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

    /**
     * Vérifie qu'aucun tour déjà versé ne se trouve dans la plage
     * d'emplacements [min, max] qui va être décalée : on ne réécrit jamais
     * l'histoire d'une cagnotte déjà remise.
     */
    private function plageContientTourVerse(Sol $sol, int $min, int $max): bool
    {
        return Tour::where('sol_id', $sol->id)
            ->whereBetween('numero_tour', [$min, $max])
            ->where('statut', 'verse')
            ->exists();
    }

    // POST /api/sols/{sol}/membres
    // L'ordre de réception choisi correspond à une position d'insertion :
    // toute la suite des membres à partir de cette position décale
    // automatiquement d'un cran, pour garantir une séquence 1..x continue,
    // sans jamais laisser de trou, quel que soit l'ordre d'ajout.
    public function store(Request $request, Sol $sol)
    {
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

        $membre = DB::transaction(function () use ($sol, $validated, $position, $nombreMembresActuel) {
            // Décale tous les membres à partir de la position choisie, en
            // partant du plus grand ordre pour ne jamais créer de doublon
            // transitoire.
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
    // Déplacer un membre vers une nouvelle position décale automatiquement
    // tous les membres compris entre l'ancienne et la nouvelle position,
    // comme on réordonnerait une liste — jamais de trou, jamais de conflit
    // à résoudre manuellement.
    public function update(Request $request, Membre $membre)
    {
        $sol = $membre->sol;
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

            DB::transaction(function () use ($sol, $membre, $ancienOrdre, $nouvelOrdre) {
                if ($nouvelOrdre > $ancienOrdre) {
                    // Le membre avance : tout le monde entre son ancienne et
                    // sa nouvelle position recule d'un cran.
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
                    // Le membre recule : tout le monde entre sa nouvelle et
                    // son ancienne position avance d'un cran.
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
    // Action distincte et volontaire : échange direct entre deux membres
    // précis, sans décaler qui que ce soit d'autre.
    public function echangerTour(Request $request, Sol $sol)
    {
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
            $membre1->update(['ordre_reception' => $ordre2]);
            $membre2->update(['ordre_reception' => $ordre1]);

            $tour1?->update(['membre_beneficiaire_id' => $membre2->id]);
            $tour2?->update(['membre_beneficiaire_id' => $membre1->id]);
        });

        return response()->json([
            'message' => "Les tours de {$membre1->nom} et {$membre2->nom} ont été échangés.",
        ]);
    }

    // DELETE /api/membres/{membre}
    // Retirer un membre laisse un trou dans la séquence : on referme
    // automatiquement la plage en décalant tous ceux qui suivent.
    public function destroy(Membre $membre)
    {
        $sol = $membre->sol;
        $ordreRetire = $membre->ordre_reception;
        $nombreMembresActuel = $sol->membres()->count();

        if ($this->plageContientTourVerse($sol, $ordreRetire, $nombreMembresActuel)) {
            return response()->json([
                'message' => "Impossible de retirer ce membre : son tour (ou un tour suivant à décaler) a déjà été versé.",
            ], 422);
        }

        DB::transaction(function () use ($sol, $membre, $ordreRetire) {
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

            // Le dernier emplacement (qui n'a plus personne) est libéré.
            Tour::where('sol_id', $sol->id)
                ->where('numero_tour', $sol->membres()->count() + 1)
                ->update(['membre_beneficiaire_id' => null]);
        });

        return response()->json(null, 204);
    }
}
