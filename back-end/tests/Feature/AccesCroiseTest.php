<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Ces tests vérifient qu'un utilisateur ne peut JAMAIS accéder aux
 * membres ou cotisations d'un sol qui ne lui appartient pas. C'est la
 * faille de sécurité (IDOR) la plus grave trouvée dans l'audit — ces
 * tests existent pour qu'elle ne puisse plus jamais revenir sans être
 * détectée immédiatement.
 */
class AccesCroiseTest extends TestCase
{
    use RefreshDatabase;

    private function creerSolAvecUnMembre(User $proprietaire): array
    {
        $sol = $proprietaire->sols()->create([
            'nom' => 'Sol privé',
            'montant_cotisation' => 2000,
            'frequence' => 'mensuelle',
            'nombre_tours' => 1,
            'date_debut' => '2026-08-01',
        ]);

        $reponseMembre = $this->actingAs($proprietaire, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres",
            ['nom' => 'Marie', 'ordre_reception' => 1]
        );

        return [$sol, $reponseMembre->json('id')];
    }

    public function test_un_utilisateur_ne_peut_pas_lister_les_membres_dun_autre(): void
    {
        $proprietaire = User::factory()->create();
        $intrus = User::factory()->create();
        [$sol] = $this->creerSolAvecUnMembre($proprietaire);

        $reponse = $this->actingAs($intrus, 'sanctum')->getJson("/api/sols/{$sol->id}/membres");

        $reponse->assertStatus(403);
    }

    public function test_un_utilisateur_ne_peut_pas_ajouter_un_membre_chez_un_autre(): void
    {
        $proprietaire = User::factory()->create();
        $intrus = User::factory()->create();
        [$sol] = $this->creerSolAvecUnMembre($proprietaire);

        $reponse = $this->actingAs($intrus, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres",
            ['nom' => 'Intrus', 'ordre_reception' => 1]
        );

        $reponse->assertStatus(403);
    }

    public function test_un_utilisateur_ne_peut_pas_modifier_le_membre_dun_autre(): void
    {
        $proprietaire = User::factory()->create();
        $intrus = User::factory()->create();
        [$sol, $membreId] = $this->creerSolAvecUnMembre($proprietaire);

        $reponse = $this->actingAs($intrus, 'sanctum')->putJson(
            "/api/membres/{$membreId}",
            ['nom' => 'Piraté']
        );

        $reponse->assertStatus(403);
        $this->assertDatabaseMissing('membres', ['id' => $membreId, 'nom' => 'Piraté']);
    }

    public function test_un_utilisateur_ne_peut_pas_supprimer_le_membre_dun_autre(): void
    {
        $proprietaire = User::factory()->create();
        $intrus = User::factory()->create();
        [$sol, $membreId] = $this->creerSolAvecUnMembre($proprietaire);

        $reponse = $this->actingAs($intrus, 'sanctum')->deleteJson("/api/membres/{$membreId}");

        $reponse->assertStatus(403);
        $this->assertDatabaseHas('membres', ['id' => $membreId]);
    }

    public function test_un_utilisateur_ne_peut_pas_echanger_les_tours_dun_autre_sol(): void
    {
        $proprietaire = User::factory()->create();
        $intrus = User::factory()->create();
        [$sol, $membre1] = $this->creerSolAvecUnMembre($proprietaire);

        $reponseMembre2 = $this->actingAs($proprietaire, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres",
            ['nom' => 'Joseph', 'ordre_reception' => 1]
        );

        $reponse = $this->actingAs($intrus, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres/echanger-tour",
            ['membre_id_1' => $membre1, 'membre_id_2' => $reponseMembre2->json('id')]
        );

        $reponse->assertStatus(403);
    }

    public function test_un_utilisateur_ne_peut_pas_enregistrer_une_cotisation_chez_un_autre(): void
    {
        $proprietaire = User::factory()->create();
        $intrus = User::factory()->create();
        [$sol, $membreId] = $this->creerSolAvecUnMembre($proprietaire);

        $reponse = $this->actingAs($intrus, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membreId,
            'tour_numero' => 1,
            'montant' => 2000,
        ]);

        $reponse->assertStatus(403);
        $this->assertDatabaseMissing('cotisations', ['sol_id' => $sol->id]);
    }

    public function test_un_utilisateur_ne_peut_pas_annuler_une_cotisation_dun_autre(): void
    {
        $proprietaire = User::factory()->create();
        $intrus = User::factory()->create();
        [$sol, $membreId] = $this->creerSolAvecUnMembre($proprietaire);

        $reponseCotisation = $this->actingAs($proprietaire, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membreId,
            'tour_numero' => 1,
            'montant' => 2000,
        ]);

        $reponse = $this->actingAs($intrus, 'sanctum')->deleteJson(
            "/api/cotisations/{$reponseCotisation->json('id')}"
        );

        $reponse->assertStatus(403);
        $this->assertDatabaseHas('cotisations', ['id' => $reponseCotisation->json('id')]);
    }

    public function test_un_utilisateur_ne_peut_pas_supprimer_le_sol_dun_autre(): void
    {
        $proprietaire = User::factory()->create();
        $intrus = User::factory()->create();
        [$sol] = $this->creerSolAvecUnMembre($proprietaire);

        $reponse = $this->actingAs($intrus, 'sanctum')->deleteJson("/api/sols/{$sol->id}");

        $reponse->assertStatus(403);
        $this->assertDatabaseHas('sols', ['id' => $sol->id]);
    }
}