<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class CotisationReglesMetierTest extends TestCase
{
    use RefreshDatabase;

    /**
     * La date d'une cotisation est toujours "aujourd'hui" : on fige le
     * temps pour des assertions fiables, à une date postérieure au début
     * du sol de test (2026-08-01).
     */
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

    /**
     * Un tour ne doit PAS passer à "versé" tant que tous les membres n'ont
     * pas cotisé pour ce tour — même si un premier paiement a bien été reçu.
     */
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

    /**
     * Le tour passe bien à "versé" une fois que le DERNIER membre manquant
     * a cotisé — la cagnotte n'est réputée remise qu'à ce moment.
     */
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

    /**
     * Deux membres peuvent échanger leur tour librement.
     */
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

    /**
     * Un tour déjà versé ne peut plus être échangé (la cagnotte a déjà
     * été remise, on ne revient pas en arrière).
     */
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
        // Les deux ont cotisé pour le tour 1 : il est maintenant versé.

        $reponse = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres/echanger-tour",
            ['membre_id_1' => $membre1, 'membre_id_2' => $membre2]
        );

        $reponse->assertStatus(422);
        $reponse->assertJsonFragment([
            'message' => "Impossible d'échanger un tour déjà versé.",
        ]);
    }

    /**
     * Un membre peut cotiser en avance pour un tour dont la période n'a
     * pas encore commencé : les dates ne bloquent jamais un paiement, elles
     * servent uniquement à classer les cotisations en attente/retard dans
     * le tableau de bord.
     */
    public function test_un_membre_peut_cotiser_en_avance_pour_un_tour_futur(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1, $membre2] = $this->creerSolAvecDeuxMembres($user);
        // Le tour 2 ne commence que le 2026-08-31, mais on paie dès le 05/08.

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

    /**
     * Un sol doit avoir exactement autant de membres que de tours avant
     * de pouvoir enregistrer la moindre cotisation.
     */
    public function test_impossible_de_cotiser_tant_que_tous_les_tours_nont_pas_leur_membre(): void
    {
        $user = User::factory()->create();

        $sol = $user->sols()->create([
            'nom' => 'Sol incomplet',
            'montant_cotisation' => 2000,
            'frequence' => 'mensuelle',
            'nombre_tours' => 3, // 3 tours attendus...
            'date_debut' => '2026-08-01',
        ]);

        $reponseMembre = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres",
            ['nom' => 'Marie', 'ordre_reception' => 1]
        );
        $membreId = $reponseMembre->json('id');
        // ...mais un seul membre a été ajouté pour l'instant.

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

    /**
     * Insérer un nouveau membre à une position déjà occupée décale
     * automatiquement tous les membres suivants d'un cran — jamais de
     * conflit, jamais de trou.
     */
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

        // On insère Ketia à la position 1 : Marie et Joseph doivent reculer.
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

    /**
     * Déplacer un membre vers une nouvelle position décale automatiquement
     * les membres intermédiaires, sans jamais laisser de trou.
     */
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

        // Marie (position 1) passe en position 3 : Joseph et Ketia avancent.
        $reponse = $this->actingAs($user, 'sanctum')->putJson(
            "/api/membres/{$m1}", ['ordre_reception' => 3]
        );

        $reponse->assertStatus(200);
        $this->assertDatabaseHas('membres', ['id' => $m1, 'ordre_reception' => 3]);
        $this->assertDatabaseHas('membres', ['id' => $m2, 'ordre_reception' => 1]);
        $this->assertDatabaseHas('membres', ['id' => $m3, 'ordre_reception' => 2]);
    }

    /**
     * Retirer un membre referme automatiquement le trou laissé dans la
     * séquence : tous les membres suivants avancent d'un cran.
     */
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

    /**
     * Impossible de décaler un membre (insertion, déplacement ou
     * suppression) si un tour déjà versé se trouve dans la plage affectée.
     */
    public function test_impossible_de_decaler_un_tour_deja_verse(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1, $membre2] = $this->creerSolAvecDeuxMembres($user);

        // Le tour 1 est complètement versé (les 2 membres ont cotisé).
        $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id, 'membre_id' => $membre1, 'tour_numero' => 1,
            'montant' => 2000,
        ]);
        $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id, 'membre_id' => $membre2, 'tour_numero' => 1,
            'montant' => 2000,
        ]);

        // Tenter de déplacer membre2 (position 2) vers la position 1 (déjà versée).
        $reponse = $this->actingAs($user, 'sanctum')->putJson(
            "/api/membres/{$membre2}", ['ordre_reception' => 1]
        );

        $reponse->assertStatus(422);
    }
}
