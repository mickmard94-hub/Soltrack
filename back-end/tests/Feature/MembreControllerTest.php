<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MembreControllerTest extends TestCase
{
    use RefreshDatabase;

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
     * Modifier l'ordre de réception d'un membre vers un ordre déjà pris
     * ne rejette pas sèchement : la réponse propose l'échange avec le
     * membre qui détient déjà ce tour.
     */
    public function test_modifier_vers_un_ordre_deja_pris_propose_lechange(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1, $membre2] = $this->creerSolAvecDeuxMembres($user);

        // Marie (ordre 1) essaie de prendre l'ordre 2, déjà détenu par Joseph.
        $reponse = $this->actingAs($user, 'sanctum')->putJson(
            "/api/membres/{$membre1}",
            ['ordre_reception' => 2]
        );

        $reponse->assertStatus(409);
        $reponse->assertJsonFragment([
            'membre_id' => $membre2,
            'nom' => 'Joseph',
            'ordre_reception' => 2,
        ]);
    }

    /**
     * Une fois le conflit détecté, l'échange proposé fonctionne bien et
     * aboutit au même résultat qu'un échange direct.
     */
    public function test_lechange_propose_apres_conflit_fonctionne(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1, $membre2] = $this->creerSolAvecDeuxMembres($user);

        $this->actingAs($user, 'sanctum')->putJson(
            "/api/membres/{$membre1}",
            ['ordre_reception' => 2]
        )->assertStatus(409);

        $reponse = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres/echanger-tour",
            ['membre_id_1' => $membre1, 'membre_id_2' => $membre2]
        );

        $reponse->assertStatus(200);
        $this->assertDatabaseHas('membres', ['id' => $membre1, 'ordre_reception' => 2]);
        $this->assertDatabaseHas('membres', ['id' => $membre2, 'ordre_reception' => 1]);
    }

    /**
     * L'ordre de réception ne peut pas dépasser le nombre de tours du sol.
     */
    public function test_ordre_de_reception_ne_peut_pas_depasser_le_nombre_de_tours(): void
    {
        $user = User::factory()->create();
        [$sol, $membre1] = $this->creerSolAvecDeuxMembres($user);

        $reponse = $this->actingAs($user, 'sanctum')->putJson(
            "/api/membres/{$membre1}",
            ['ordre_reception' => 5] // le sol n'a que 2 tours
        );

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors(['ordre_reception']);
    }

    /**
     * Impossible d'ajouter un membre à un sol clôturé.
     */
    public function test_impossible_dajouter_un_membre_a_un_sol_cloture(): void
    {
        $user = User::factory()->create();
        $sol = $user->sols()->create([
            'nom' => 'Sol clôturé',
            'montant_cotisation' => 2000,
            'frequence' => 'mensuelle',
            'nombre_tours' => 3,
            'date_debut' => '2026-08-01',
            'statut' => 'cloture',
        ]);

        $reponse = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres",
            ['nom' => 'Nouveau', 'ordre_reception' => 1]
        );

        $reponse->assertStatus(422);
        $reponse->assertJsonFragment([
            'message' => "Ce sol est clôturé, aucun nouveau membre ne peut y être ajouté.",
        ]);
    }
}
