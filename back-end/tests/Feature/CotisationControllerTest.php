<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CotisationControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Prépare un sol avec un membre, prêt à recevoir une cotisation.
     * Réutilisé par plusieurs tests pour éviter la répétition.
     */
    private function creerSolAvecMembre(User $user, int $ordreReception = 1): array
    {
        $sol = $user->sols()->create([
            'nom' => 'Sol test',
            'montant_cotisation' => 2000,
            'frequence' => 'mensuelle',
            'nombre_tours' => 5,
            'date_debut' => '2026-08-01',
        ]);

        $reponseMembre = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres",
            [
                'nom' => 'Marie Joseph',
                'telephone' => '3712 3456',
                'ordre_reception' => $ordreReception,
            ]
        );

        $membreId = $reponseMembre->json('id');

        return [$sol, $membreId];
    }

    /**
     * Test 1 : enregistrement valide d'une cotisation (cas nominal).
     */
    public function test_un_utilisateur_peut_enregistrer_une_cotisation(): void
    {
        $user = User::factory()->create();
        [$sol, $membreId] = $this->creerSolAvecMembre($user);

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membreId,
            'tour_numero' => 1,
            'montant' => 2000,
            'date_paiement' => '2026-08-01',
        ]);

        $reponse->assertStatus(201);
        $this->assertDatabaseHas('cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membreId,
            'statut' => 'paye',
        ]);
    }

    /**
     * Test 2 : le montant doit être strictement égal à la cotisation
     * fixée pour le sol (règle métier ajoutée après audit de sécurité).
     */
    public function test_le_montant_doit_correspondre_a_celui_du_sol(): void
    {
        $user = User::factory()->create();
        [$sol, $membreId] = $this->creerSolAvecMembre($user);

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membreId,
            'tour_numero' => 1,
            'montant' => 500, // différent des 2000 HTG fixés
            'date_paiement' => '2026-08-01',
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonFragment([
            'message' => "Le montant doit être égal à la cotisation fixée pour ce sol (2000 HTG).",
        ]);
    }

    /**
     * Test 3 : impossible d'enregistrer deux fois une cotisation pour
     * le même membre sur le même tour (protection contre le double paiement).
     */
    public function test_impossible_de_payer_deux_fois_le_meme_tour(): void
    {
        $user = User::factory()->create();
        [$sol, $membreId] = $this->creerSolAvecMembre($user);

        // Première cotisation : doit réussir
        $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membreId,
            'tour_numero' => 1,
            'montant' => 2000,
            'date_paiement' => '2026-08-01',
        ])->assertStatus(201);

        // Deuxième cotisation, même membre/tour : doit échouer
        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membreId,
            'tour_numero' => 1,
            'montant' => 2000,
            'date_paiement' => '2026-08-05',
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonFragment([
            'message' => "Une cotisation a déjà été enregistrée pour ce membre sur ce tour.",
        ]);
    }

    /**
     * Test 4 : un membre ne peut pas cotiser sur un sol auquel il
     * n'appartient pas (protection contre la corruption de données).
     */
    public function test_un_membre_ne_peut_pas_cotiser_sur_un_autre_sol(): void
    {
        $user = User::factory()->create();
        [$solA, $membreIdA] = $this->creerSolAvecMembre($user, 1);
        [$solB] = $this->creerSolAvecMembre($user, 1);

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $solB->id,
            'membre_id' => $membreIdA, // membre du sol A, pas du sol B
            'tour_numero' => 1,
            'montant' => 2000,
            'date_paiement' => '2026-08-01',
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonFragment([
            'message' => "Ce membre n'appartient pas à ce sol.",
        ]);
    }

    /**
     * Test 5 : après une cotisation, le tour correspondant passe bien
     * au statut "verse" (vérifie la logique métier de mise à jour automatique).
     */
    public function test_le_tour_passe_au_statut_verse_apres_cotisation(): void
    {
        $user = User::factory()->create();
        [$sol, $membreId] = $this->creerSolAvecMembre($user);

        $this->actingAs($user, 'sanctum')->postJson('/api/cotisations', [
            'sol_id' => $sol->id,
            'membre_id' => $membreId,
            'tour_numero' => 1,
            'montant' => 2000,
            'date_paiement' => '2026-08-01',
        ]);

        $this->assertDatabaseHas('tours', [
            'sol_id' => $sol->id,
            'numero_tour' => 1,
            'statut' => 'verse',
            'date_versement' => '2026-08-01',
        ]);
    }
}