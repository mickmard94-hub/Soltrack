<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DernierMembreTest extends TestCase
{
    use RefreshDatabase;

    public function test_supprimer_le_dernier_membre_ne_plante_pas(): void
    {
        $user = User::factory()->create();
        $sol = $user->sols()->create([
            'nom' => 'Sol test',
            'montant_cotisation' => 2000,
            'frequence' => 'mensuelle',
            'nombre_tours' => 1,
            'date_debut' => '2026-08-01',
        ]);

        $membreId = $this->actingAs($user, 'sanctum')->postJson(
            "/api/sols/{$sol->id}/membres",
            ['nom' => 'Seul membre', 'ordre_reception' => 1]
        )->json('id');

        $reponse = $this->actingAs($user, 'sanctum')->deleteJson("/api/membres/{$membreId}");

        $reponse->assertStatus(204);
        $this->assertDatabaseMissing('membres', ['id' => $membreId]);
        $this->assertDatabaseMissing('tours', ['sol_id' => $sol->id, 'numero_tour' => 1]);
    }
}