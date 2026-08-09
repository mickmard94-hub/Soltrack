<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Vérifie le moteur de pénalités de retard et la règle d'ordre de
 * paiement. Comme les pénalités dépendent du temps écoulé (10 jours,
 * 30 jours), ces tests "voyagent dans le temps" avec Carbon::setTestNow()
 * plutôt que d'attendre réellement des semaines.
 */
class PenalitesReglesMetierTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow(); // remet l'horloge réelle après chaque test
        parent::tearDown();
    }

    /**
     * Crée un sol hebdomadaire avec 2 membres et leurs tours, prêt à
     * recevoir des cotisations. Le tour 1 a une date de fin prévisible
     * (2026-01-07), ce qui permet de calculer précisément des jours
     * de retard contrôlés dans chaque test.
     */
    private function creerSolAvecDeuxMembres(User $user, array $configPenalites = []): array
    {
        $sol = $user->sols()->create(array_merge([
            'nom' => 'Sol test pénalités',
            'montant_cotisation' => 1000,
            'frequence' => 'hebdomadaire',
            'nombre_tours' => 2,
            'date_debut' => '2026-01-01',
        ], $configPenalites));

        $membre1 = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres",
            ['nom' => 'Marie', 'ordre_reception' => 1]
        )->json('id');

        $membre2 = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres",
            ['nom' => 'Joseph', 'ordre_reception' => 2]
        )->json('id');

        return [$sol->fresh(), $membre1, $membre2];
    }

    public function test_impossible_de_payer_un_tour_sans_avoir_paye_les_precedents(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1] = $this->creerSolAvecDeuxMembres($user);

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre1,
            'tour_numero' => 2,
            'montant' => 1000,
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonFragment([
            'message' => "Ce membre doit d'abord payer le tour 1 avant de pouvoir payer le tour 2.",
        ]);
    }

    public function test_peut_payer_en_avance_si_les_tours_precedents_sont_payes(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1] = $this->creerSolAvecDeuxMembres($user);

        $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre1,
            'tour_numero' => 1,
            'montant' => 1000,
        ])->assertStatus(201);

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre1,
            'tour_numero' => 2,
            'montant' => 1000,
        ]);

        $reponse->assertStatus(201);
    }

    public function test_aucune_penalite_si_paye_a_temps(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1] = $this->creerSolAvecDeuxMembres($user, [
            'penalites_actives' => true,
            'penalite_montant_base' => 100,
        ]);

        Carbon::setTestNow('2026-01-05'); // avant la date limite du tour 1 (01-07)

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre1,
            'tour_numero' => 1,
            'montant' => 1000,
        ]);

        $reponse->assertStatus(201);
        $reponse->assertJsonFragment(['penalite' => null]);
        $this->assertDatabaseCount('penalites', 0);
    }

    public function test_penalite_de_base_appliquee_le_lendemain_de_la_date_limite(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1] = $this->creerSolAvecDeuxMembres($user, [
            'penalites_actives' => true,
            'penalite_montant_base' => 100,
        ]);

        Carbon::setTestNow('2026-01-08'); // 1 jour après la date limite (01-07)

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre1,
            'tour_numero' => 1,
            'montant' => 1000,
        ]);

        $reponse->assertStatus(201);
        $this->assertDatabaseHas('penalites', [
            'sol_id' => $sol->id,
            'membre_id' => $membre1,
            'tour_numero' => 1,
            'montant' => 100,
            'palier' => 'base',
        ]);
    }

    public function test_penalite_palier_10_jours_double_le_montant(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1] = $this->creerSolAvecDeuxMembres($user, [
            'penalites_actives' => true,
            'penalite_montant_base' => 100,
            'penalite_palier10_actif' => true,
            'penalite_palier10_mode' => 'doubler',
        ]);

        Carbon::setTestNow('2026-01-17'); // exactement 10 jours après le 01-07

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre1,
            'tour_numero' => 1,
            'montant' => 1000,
        ]);

        $reponse->assertStatus(201);
        $this->assertDatabaseHas('penalites', [
            'sol_id' => $sol->id,
            'membre_id' => $membre1,
            'tour_numero' => 1,
            'montant' => 200,
            'palier' => '10j',
        ]);
    }

    public function test_penalite_palier_10_jours_ajoute_un_montant_au_lieu_de_doubler(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1] = $this->creerSolAvecDeuxMembres($user, [
            'penalites_actives' => true,
            'penalite_montant_base' => 100,
            'penalite_palier10_actif' => true,
            'penalite_palier10_mode' => 'ajouter',
            'penalite_palier10_montant' => 50,
        ]);

        Carbon::setTestNow('2026-01-17');

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre1,
            'tour_numero' => 1,
            'montant' => 1000,
        ]);

        $reponse->assertStatus(201);
        $this->assertDatabaseHas('penalites', [
            'montant' => 150, // 100 de base + 50 ajoutés
            'palier' => '10j',
        ]);
    }

    public function test_penalite_palier_30_jours_triple_le_montant(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1] = $this->creerSolAvecDeuxMembres($user, [
            'penalites_actives' => true,
            'penalite_montant_base' => 100,
            'penalite_palier30_actif' => true,
            'penalite_palier30_mode' => 'doubler', // "doubler" = tripler pour le palier 30j, selon la règle définie
        ]);

        Carbon::setTestNow('2026-02-06'); // 30 jours après le 01-07

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre1,
            'tour_numero' => 1,
            'montant' => 1000,
        ]);

        $reponse->assertStatus(201);
        $this->assertDatabaseHas('penalites', [
            'montant' => 300, // 100 x 3
            'palier' => '30j',
        ]);
    }

    public function test_aucune_penalite_si_desactivee_sur_le_sol(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1] = $this->creerSolAvecDeuxMembres($user, [
            'penalites_actives' => false,
        ]);

        Carbon::setTestNow('2026-02-06'); // très en retard, mais pénalités désactivées

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre1,
            'tour_numero' => 1,
            'montant' => 1000,
        ]);

        $reponse->assertStatus(201);
        $this->assertDatabaseCount('penalites', 0);
    }

    public function test_configuration_se_verrouille_apres_premiere_penalite_appliquee(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1] = $this->creerSolAvecDeuxMembres($user, [
            'penalites_actives' => true,
            'penalite_montant_base' => 100,
        ]);

        $this->assertFalse($sol->penalites_verrouillees);

        Carbon::setTestNow('2026-01-08');

        $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre1,
            'tour_numero' => 1,
            'montant' => 1000,
        ])->assertStatus(201);

        $sol->refresh();
        $this->assertTrue($sol->penalites_verrouillees);

        // Toute tentative de modifier la config des pénalités échoue désormais.
        $reponse = $this->actingAs($user, 'sanctum')->putJson("/api/sols/{$sol->id}", [
            'penalite_montant_base' => 500,
        ]);

        $reponse->assertStatus(422);
    }

    public function test_une_notification_est_creee_pour_le_proprietaire_lors_dune_penalite(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1] = $this->creerSolAvecDeuxMembres($user, [
            'penalites_actives' => true,
            'penalite_montant_base' => 100,
        ]);

        Carbon::setTestNow('2026-01-08');

        $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre1,
            'tour_numero' => 1,
            'montant' => 1000,
        ])->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'lue' => false,
        ]);
    }
}