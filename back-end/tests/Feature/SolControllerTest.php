<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SolControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test 1 : un utilisateur authentifié peut créer un sol avec des
     * données valides. C'est le test "cas nominal" attendu par le
     * Cahier des Charges (section 11).
     */
    public function test_un_utilisateur_peut_creer_un_sol(): void
    {
        $user = User::factory()->create();

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/sols', [
            'nom' => 'Sol des voisines',
            'montant_cotisation' => 2000,
            'frequence' => 'mensuelle',
            'nombre_tours' => 5,
            'date_debut' => '2026-08-01',
        ]);

        $reponse->assertStatus(201);
        $reponse->assertJsonFragment(['nom' => 'Sol des voisines']);

        $this->assertDatabaseHas('sols', [
            'nom' => 'Sol des voisines',
            'user_id' => $user->id,
        ]);
    }

    /**
     * Test 2 : la création échoue si des champs obligatoires manquent.
     * Vérifie que la validation stricte côté serveur fonctionne bien.
     */
    public function test_la_creation_dun_sol_echoue_sans_les_champs_obligatoires(): void
    {
        $user = User::factory()->create();

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/sols', [
            'nom' => '',
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors([
            'nom',
            'montant_cotisation',
            'frequence',
            'nombre_tours',
            'date_debut',
        ]);
    }

    /**
     * Test 3 : la création échoue si la fréquence n'est pas une valeur
     * autorisée (protection contre des données incohérentes).
     */
    public function test_la_creation_dun_sol_echoue_avec_une_frequence_invalide(): void
    {
        $user = User::factory()->create();

        $reponse = $this->actingAs($user, 'sanctum')->postJson('/api/sols', [
            'nom' => 'Sol test',
            'montant_cotisation' => 1000,
            'frequence' => 'quotidienne', // valeur non autorisée
            'nombre_tours' => 5,
            'date_debut' => '2026-08-01',
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors(['frequence']);
    }

    /**
     * Test 4 : un utilisateur non authentifié ne peut pas créer de sol.
     * Vérifie le middleware auth:sanctum.
     */
    public function test_un_utilisateur_non_authentifie_ne_peut_pas_creer_de_sol(): void
    {
        $reponse = $this->postJson('/api/sols', [
            'nom' => 'Sol test',
            'montant_cotisation' => 1000,
            'frequence' => 'mensuelle',
            'nombre_tours' => 5,
            'date_debut' => '2026-08-01',
        ]);

        $reponse->assertStatus(401);
    }

    /**
     * Test 5 : un utilisateur ne peut pas consulter le sol d'un autre
     * utilisateur. Vérifie le contrôle d'accès par propriétaire (IDOR).
     */
    public function test_un_utilisateur_ne_peut_pas_voir_le_sol_dun_autre(): void
    {
        $proprietaire = User::factory()->create();
        $autreUtilisateur = User::factory()->create();

        $sol = $proprietaire->sols()->create([
            'nom' => 'Sol privé',
            'montant_cotisation' => 1000,
            'frequence' => 'mensuelle',
            'nombre_tours' => 5,
            'date_debut' => '2026-08-01',
        ]);

        $reponse = $this->actingAs($autreUtilisateur, 'sanctum')
            ->getJson("/api/sols/{$sol->id}");

        $reponse->assertStatus(403);
    }
}