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