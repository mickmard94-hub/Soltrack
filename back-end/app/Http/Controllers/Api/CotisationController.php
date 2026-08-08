<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cotisation;
use App\Models\Tour;
use App\Models\Sol;
use App\Models\Membre;
use App\Models\Penalite;
use App\Models\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CotisationController extends Controller
{
    /**
     * Calcule le montant de la pénalité applicable pour un retard donné,
     * selon la configuration (verrouillée ou non) du sol. Retourne
     * [montant, palier] ou [0, null] si aucune pénalité ne s'applique.
     */
    private function calculerPenalite(Sol $sol, int $joursRetard): array
    {
        if (!$sol->penalites_actives || $joursRetard <= 0 || !$sol->penalite_montant_base) {
            return [0, null];
        }

        $base = (float) $sol->penalite_montant_base;

        if ($joursRetard >= 30 && $sol->penalite_palier30_actif) {
            if ($sol->penalite_palier30_mode === 'doubler') {
                // "Tripler" par rapport au montant de base, tel que défini.
                return [$base * 3, '30j'];
            }

            $montant = $base;
            if ($joursRetard >= 10 && $sol->penalite_palier10_actif && $sol->penalite_palier10_mode === 'ajouter') {
                $montant += (float) $sol->penalite_palier10_montant;
            }
            $montant += (float) $sol->penalite_palier30_montant;
            return [$montant, '30j'];
        }

        if ($joursRetard >= 10 && $sol->penalite_palier10_actif) {
            if ($sol->penalite_palier10_mode === 'doubler') {
                return [$base * 2, '10j'];
            }
            return [$base + (float) $sol->penalite_palier10_montant, '10j'];
        }

        return [$base, 'base'];
    }

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

        // RÈGLE D'ORDRE : ce membre précis doit avoir déjà réglé tous les
        // tours précédents avant de pouvoir payer celui-ci. Impossible de
        // "sauter" un tour, même en avance sur le calendrier.
        if ($validated['tour_numero'] > 1) {
            $tourManquant = null;
            for ($n = 1; $n < $validated['tour_numero']; $n++) {
                $dejaPaye = Cotisation::where('sol_id', $sol->id)
                    ->where('membre_id', $membre->id)
                    ->where('tour_numero', $n)
                    ->exists();
                if (!$dejaPaye) {
                    $tourManquant = $n;
                    break;
                }
            }

            if ($tourManquant !== null) {
                return response()->json([
                    'message' => "Ce membre doit d'abord payer le tour {$tourManquant} avant de pouvoir payer le tour {$validated['tour_numero']}.",
                ], 422);
            }
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
            $resultat = DB::transaction(function () use ($sol, $membre, $validated, $datePaiement, $tour) {
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

                // PÉNALITÉ : calculée et figée au moment précis où ce
                // paiement en retard est enregistré, jamais recalculée
                // après coup.
                $penalite = null;
                if ($tour->date_fin_prevue && $datePaiement > $tour->date_fin_prevue) {
                    $joursRetard = Carbon::parse($tour->date_fin_prevue)->diffInDays(Carbon::parse($datePaiement));
                    [$montantPenalite, $palier] = $this->calculerPenalite($sol, $joursRetard);

                    if ($montantPenalite > 0) {
                        $penalite = Penalite::create([
                            'sol_id' => $sol->id,
                            'membre_id' => $membre->id,
                            'tour_numero' => $validated['tour_numero'],
                            'montant' => $montantPenalite,
                            'jours_retard' => $joursRetard,
                            'palier' => $palier,
                        ]);

                        // Dès qu'une pénalité est réellement appliquée,
                        // toute la configuration du sol est figée pour
                        // toujours.
                        if (!$sol->penalites_verrouillees) {
                            $sol->update(['penalites_verrouillees' => true]);
                        }

                        AppNotification::create([
                            'user_id' => $sol->user_id,
                            'titre' => 'Pénalité de retard appliquée',
                            'message' => "{$membre->nom} a payé le tour {$validated['tour_numero']} du sol \"{$sol->nom}\" avec {$joursRetard} jour(s) de retard. Pénalité : {$montantPenalite} HTG.",
                        ]);
                    }
                }

                return ['cotisation' => $cotisation, 'penalite' => $penalite];
            });
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            ...$resultat['cotisation']->toArray(),
            'penalite' => $resultat['penalite'],
        ], 201);
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