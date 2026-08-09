<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class CotisationReglesMetierTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-08-01');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function creerSolAvecDeuxMembres(User $user): array
    {
        $sol = $user->sols()->create([
            'nom' => 'Sol test',
            'montant_cotisation' => 2000,
            'frequence' => 'mensuelle',
            'nombre_tours' => 2,
            'date_debut' => '2026-08-01',
        ]);

        $reponseM1 = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres",
            ['nom' => 'Marie', 'ordre_reception' => 1]
        );
        $reponseM2 = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres",
            ['nom' => 'Joseph', 'ordre_reception' => 2]
        );

        return [$sol, $reponseM1->json('id'), $reponseM2->json('id')];
    }

    public function test_le_tour_reste_a_venir_tant_que_tous_nont_pas_cotise(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1, $membre2] = $this->creerSolAvecDeuxMembres($user);

        $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre1,
            'tour_numero' => 1,
            'montant' => 2000,
        ])->assertStatus(201);

        $this->assertDatabaseHas('tours', [
            'sol_id' => $sol->id,
            'numero_tour' => 1,
            'statut' => 'a_venir',
        ]);
    }

    public function test_le_tour_passe_a_verse_quand_tous_ont_cotise(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1, $membre2] = $this->creerSolAvecDeuxMembres($user);

        $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre1,
            'tour_numero' => 1,
            'montant' => 2000,
        ]);

        $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre2,
            'tour_numero' => 1,
            'montant' => 2000,
        ])->assertStatus(201);

        $this->assertDatabaseHas('tours', [
            'sol_id' => $sol->id,
            'numero_tour' => 1,
            'statut' => 'verse',
            'date_versement' => '2026-08-01',
        ]);
    }

    public function test_deux_membres_peuvent_echanger_leur_tour(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1, $membre2] = $this->creerSolAvecDeuxMembres($user);

        $reponse = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres/echanger-tour",
            ['membre_id_1' => $membre1, 'membre_id_2' => $membre2]
        );

        $reponse->assertStatus(200);

        $this->assertDatabaseHas('membres', ['id' => $membre1, 'ordre_reception' => 2]);
        $this->assertDatabaseHas('membres', ['id' => $membre2, 'ordre_reception' => 1]);
        $this->assertDatabaseHas('tours', ['sol_id' => $sol->id, 'numero_tour' => 1, 'membre_beneficiaire_id' => $membre2]);
        $this->assertDatabaseHas('tours', ['sol_id' => $sol->id, 'numero_tour' => 2, 'membre_beneficiaire_id' => $membre1]);
    }

    public function test_impossible_dechanger_un_tour_deja_verse(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1, $membre2] = $this->creerSolAvecDeuxMembres($user);

        $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id, 'membre_id' => $membre1, 'tour_numero' => 1,
            'montant' => 2000,
        ]);
        $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id, 'membre_id' => $membre2, 'tour_numero' => 1,
            'montant' => 2000,
        ]);

        $reponse = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres/echanger-tour",
            ['membre_id_1' => $membre1, 'membre_id_2' => $membre2]
        );

        $reponse->assertStatus(422);
        $reponse->assertJsonFragment([
            'message' => "Impossible d'échanger un tour déjà versé.",
        ]);
    }

    public function test_un_membre_peut_cotiser_en_avance_si_les_tours_precedents_sont_payes(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1, $membre2] = $this->creerSolAvecDeuxMembres($user);

        $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre2,
            'tour_numero' => 1,
            'montant' => 2000,
        ])->assertStatus(201);

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre2,
            'tour_numero' => 2,
            'montant' => 2000,
        ]);

        $reponse->assertStatus(201);
        $this->assertDatabaseHas('cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membre2,
            'tour_numero' => 2,
            'statut' => 'paye',
        ]);
    }

    public function test_impossible_de_cotiser_tant_que_tous_les_tours_nont_pas_leur_membre(): void
    {
        $user = User::factory()->create();

        $sol = $user->sols()->create([
            'nom' => 'Sol incomplet',
            'montant_cotisation' => 2000,
            'frequence' => 'mensuelle',
            'nombre_tours' => 3,
            'date_debut' => '2026-08-01',
        ]);

        $reponseMembre = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres",
            ['nom' => 'Marie', 'ordre_reception' => 1]
        );
        $membreId = $reponseMembre->json('id');

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membreId,
            'tour_numero' => 1,
            'montant' => 2000,
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonFragment([
            'message' => "Ce sol nécessite exactement 3 membre(s) avant de pouvoir enregistrer des cotisations (actuellement : 1).",
        ]);
    }

    public function test_ajouter_un_membre_au_milieu_decale_les_suivants(): void
    {
        $user = User::factory()->create();
        $sol = $user->sols()->create([
            'nom' => 'Sol test', 'montant_cotisation' => 2000,
            'frequence' => 'mensuelle', 'nombre_tours' => 3, 'date_debut' => '2026-08-01',
        ]);

        $m1 = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres", ['nom' => 'Marie', 'ordre_reception' => 1]
        )->json('id');
        $m2 = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres", ['nom' => 'Joseph', 'ordre_reception' => 2]
        )->json('id');

        $reponse = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres", ['nom' => 'Ketia', 'ordre_reception' => 1]
        );

        $reponse->assertStatus(201);
        $this->assertDatabaseHas('membres', ['id' => $m1, 'ordre_reception' => 2]);
        $this->assertDatabaseHas('membres', ['id' => $m2, 'ordre_reception' => 3]);
        $this->assertDatabaseHas('membres', ['nom' => 'Ketia', 'ordre_reception' => 1]);
        $this->assertDatabaseHas('tours', ['sol_id' => $sol->id, 'numero_tour' => 2, 'membre_beneficiaire_id' => $m1]);
        $this->assertDatabaseHas('tours', ['sol_id' => $sol->id, 'numero_tour' => 3, 'membre_beneficiaire_id' => $m2]);
    }

    public function test_modifier_ordre_decale_les_membres_intermediaires(): void
    {
        $user = User::factory()->create();
        $sol = $user->sols()->create([
            'nom' => 'Sol test', 'montant_cotisation' => 2000,
            'frequence' => 'mensuelle', 'nombre_tours' => 3, 'date_debut' => '2026-08-01',
        ]);

        $m1 = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres", ['nom' => 'Marie', 'ordre_reception' => 1]
        )->json('id');
        $m2 = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres", ['nom' => 'Joseph', 'ordre_reception' => 2]
        )->json('id');
        $m3 = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres", ['nom' => 'Ketia', 'ordre_reception' => 3]
        )->json('id');

        $reponse = $this->actingAs($user, 'sanctum')->putJson(
            "/api/membres/{$m1}", ['ordre_reception' => 3]
        );

        $reponse->assertStatus(200);
        $this->assertDatabaseHas('membres', ['id' => $m1, 'ordre_reception' => 3]);
        $this->assertDatabaseHas('membres', ['id' => $m2, 'ordre_reception' => 1]);
        $this->assertDatabaseHas('membres', ['id' => $m3, 'ordre_reception' => 2]);
    }

    public function test_supprimer_un_membre_referme_le_trou(): void
    {
        $user = User::factory()->create();
        $sol = $user->sols()->create([
            'nom' => 'Sol test', 'montant_cotisation' => 2000,
            'frequence' => 'mensuelle', 'nombre_tours' => 3, 'date_debut' => '2026-08-01',
        ]);

        $m1 = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres", ['nom' => 'Marie', 'ordre_reception' => 1]
        )->json('id');
        $m2 = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres", ['nom' => 'Joseph', 'ordre_reception' => 2]
        )->json('id');
        $m3 = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres", ['nom' => 'Ketia', 'ordre_reception' => 3]
        )->json('id');

        $this->actingAs($user, 'sanctum')->deleteJson("/api/membres/{$m1}")->assertStatus(204);

        $this->assertDatabaseHas('membres', ['id' => $m2, 'ordre_reception' => 1]);
        $this->assertDatabaseHas('membres', ['id' => $m3, 'ordre_reception' => 2]);
    }

    public function test_impossible_de_decaler_un_tour_deja_verse(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1, $membre2] = $this->creerSolAvecDeuxMembres($user);

        $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id, 'membre_id' => $membre1, 'tour_numero' => 1,
            'montant' => 2000,
        ]);
        $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id, 'membre_id' => $membre2, 'tour_numero' => 1,
            'montant' => 2000,
        ]);

        $reponse = $this->actingAs($user, 'sanctum')->putJson(
            "/api/membres/{$membre2}", ['ordre_reception' => 1]
        );

        $reponse->assertStatus(422);
    }
}