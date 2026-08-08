<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_utilisateur_peut_sinscrire(): void
    {
        $reponse = $this->postJson('/api/register', [
            'name' => 'Marie Joseph',
            'email' => 'marie@example.com',
            'password' => 'motdepasse123',
            'password_confirmation' => 'motdepasse123',
        ]);

        $reponse->assertStatus(201);
        $reponse->assertJsonStructure(['user', 'token']);
        $this->assertDatabaseHas('users', ['email' => 'marie@example.com']);
    }

    public function test_inscription_echoue_avec_un_email_deja_utilise(): void
    {
        User::factory()->create(['email' => 'marie@example.com']);

        $reponse = $this->postJson('/api/register', [
            'name' => 'Marie Joseph',
            'email' => 'marie@example.com',
            'password' => 'motdepasse123',
            'password_confirmation' => 'motdepasse123',
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors(['email']);
    }

    public function test_inscription_echoue_si_les_mots_de_passe_ne_correspondent_pas(): void
    {
        $reponse = $this->postJson('/api/register', [
            'name' => 'Marie Joseph',
            'email' => 'marie@example.com',
            'password' => 'motdepasse123',
            'password_confirmation' => 'autrechose',
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors(['password']);
    }

    public function test_un_utilisateur_peut_se_connecter(): void
    {
        $user = User::factory()->create([
            'email' => 'marie@example.com',
            'password' => bcrypt('motdepasse123'),
        ]);

        $reponse = $this->postJson('/api/login', [
            'email' => 'marie@example.com',
            'password' => 'motdepasse123',
        ]);

        $reponse->assertStatus(200);
        $reponse->assertJsonStructure(['user', 'token']);
    }

    public function test_connexion_echoue_avec_un_mauvais_mot_de_passe(): void
    {
        User::factory()->create([
            'email' => 'marie@example.com',
            'password' => bcrypt('motdepasse123'),
        ]);

        $reponse = $this->postJson('/api/login', [
            'email' => 'marie@example.com',
            'password' => 'mauvais',
        ]);

        $reponse->assertStatus(422);
        $reponse->assertJsonValidationErrors(['email']);
    }

    public function test_connexion_echoue_avec_un_email_inexistant(): void
    {
        $reponse = $this->postJson('/api/login', [
            'email' => 'inconnu@example.com',
            'password' => 'motdepasse123',
        ]);

        $reponse->assertStatus(422);
    }

    public function test_un_utilisateur_connecte_peut_voir_son_profil(): void
    {
        $user = User::factory()->create();

        $reponse = $this->actingAs($user, 'sanctum')->getJson('/api/user');

        $reponse->assertStatus(200);
        $reponse->assertJsonFragment(['email' => $user->email]);
    }

    public function test_un_utilisateur_non_connecte_ne_peut_pas_voir_de_profil(): void
    {
        $reponse = $this->getJson('/api/user');

        $reponse->assertStatus(401);
    }

    public function test_un_utilisateur_peut_se_deconnecter(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('soltrack')->plainTextToken;

        $reponse = $this->postJson('/api/logout', [], [
            'Authorization' => "Bearer {$token}",
        ]);

        $reponse->assertStatus(204);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}