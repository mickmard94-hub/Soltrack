<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sol;
use App\Models\Cotisation;
use Illuminate\Http\Request;
use Carbon\Carbon;

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

        // On ne peut pas réduire le nombre de tours en dessous d'un ordre de
        // réception déjà attribué à un membre existant : casserait la
        // cohérence des tours déjà créés.
        if (isset($validated['nombre_tours'])) {
            $ordreMax = $sol->membres()->max('ordre_reception');
            if ($ordreMax && $validated['nombre_tours'] < $ordreMax) {
                return response()->json([
                    'message' => "Impossible de réduire le nombre de tours à {$validated['nombre_tours']} : un membre a déjà l'ordre de réception {$ordreMax}.",
                ], 422);
            }
        }

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
        $nombreMembres = $sol->membres()->count();

        $prochainTourNonVerse = $sol->tours()
            ->where('statut', '!=', 'verse')
            ->orderBy('numero_tour')
            ->first();

        $toursNonVerses = $sol->tours()->where('statut', '!=', 'verse')->get();

        $cotisationsEnAttente = 0;
        $cotisationsEnRetard = 0;

        foreach ($toursNonVerses as $tour) {
            $aCommence = Carbon::parse($tour->date_prevue)->lte(now());
            if (!$aCommence) {
                // Le tour n'a pas encore commencé : on attend simplement,
                // aucune cotisation n'est comptée en attente ni en retard.
                continue;
            }

            $nombreDejaPayes = Cotisation::where('sol_id', $sol->id)
                ->where('tour_numero', $tour->numero_tour)
                ->count();
            $manquants = max(0, $nombreMembres - $nombreDejaPayes);

            if ($manquants === 0) {
                continue;
            }

            $periodeTerminee = $tour->date_fin_prevue && Carbon::parse($tour->date_fin_prevue)->lt(now());

            if ($periodeTerminee) {
                $cotisationsEnRetard += $manquants;
            } else {
                $cotisationsEnAttente += $manquants;
            }
        }

        return response()->json([
            'total_collecte' => $totalCollecte,
            'prochain_beneficiaire' => $prochainTourNonVerse?->membreBeneficiaire?->nom,
            'prochaine_date' => $prochainTourNonVerse?->date_prevue,
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

        $prochainTourNonVerse = $sol->tours()
            ->where('statut', '!=', 'verse')
            ->orderBy('numero_tour')
            ->first();

        if (!$prochainTourNonVerse) {
            return response()->json([
                'statut' => 'termine',
                'tour_numero' => null,
                'membres_manquants' => [],
            ]);
        }

        $aCommence = Carbon::parse($prochainTourNonVerse->date_prevue)->lte(now());

        if (!$aCommence) {
            return response()->json([
                'statut' => 'pas_commence',
                'tour_numero' => $prochainTourNonVerse->numero_tour,
                'date_debut_tour' => $prochainTourNonVerse->date_prevue,
                'membres_manquants' => [],
            ]);
        }

        $idsDejaPayes = $sol->cotisations()
            ->where('tour_numero', $prochainTourNonVerse->numero_tour)
            ->pluck('membre_id');

        $membresManquants = $sol->membres()
            ->whereNotIn('id', $idsDejaPayes)
            ->get();

        $periodeTerminee = $prochainTourNonVerse->date_fin_prevue
            && Carbon::parse($prochainTourNonVerse->date_fin_prevue)->lt(now());

        return response()->json([
            'statut' => $periodeTerminee ? 'en_retard' : 'en_cours',
            'tour_numero' => $prochainTourNonVerse->numero_tour,
            'membres_manquants' => $membresManquants,
        ]);
    }

    // GET /api/sols/{sol}/cotisations-par-tour
    public function cotisationsParTour(Request $request, Sol $sol)
    {
        if ($sol->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $membres = $sol->membres;

        $tours = $sol->tours()->with('membreBeneficiaire')->orderBy('numero_tour')->get();

        $cotisationsParTourEtMembre = $sol->cotisations()
            ->get()
            ->groupBy('tour_numero');

        $resultat = $tours->map(function ($tour) use ($membres, $cotisationsParTourEtMembre) {
            $cotisationsDuTour = $cotisationsParTourEtMembre->get($tour->numero_tour, collect());
            $idsPayes = $cotisationsDuTour->pluck('membre_id');

            $membresAvecStatut = $membres->map(function ($membre) use ($idsPayes, $cotisationsDuTour) {
                $cotisation = $cotisationsDuTour->firstWhere('membre_id', $membre->id);
                return [
                    'id' => $membre->id,
                    'nom' => $membre->nom,
                    'a_paye' => $idsPayes->contains($membre->id),
                    'date_paiement' => $cotisation?->date_paiement,
                ];
            });

            return [
                'numero_tour' => $tour->numero_tour,
                'beneficiaire' => $tour->membreBeneficiaire?->nom,
                'date_debut' => $tour->date_prevue,
                'date_fin' => $tour->date_fin_prevue,
                'statut' => $tour->statut,
                'membres' => $membresAvecStatut,
            ];
        });

        return response()->json($resultat);
    }
}
