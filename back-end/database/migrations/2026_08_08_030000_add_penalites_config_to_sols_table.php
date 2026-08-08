<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sols', function (Blueprint $table) {
            $table->boolean('penalites_actives')->default(false);
            $table->decimal('penalite_montant_base', 10, 2)->nullable();

            $table->boolean('penalite_palier10_actif')->default(false);
            $table->string('penalite_palier10_mode')->nullable(); // 'doubler' ou 'ajouter'
            $table->decimal('penalite_palier10_montant', 10, 2)->nullable();

            $table->boolean('penalite_palier30_actif')->default(false);
            $table->string('penalite_palier30_mode')->nullable();
            $table->decimal('penalite_palier30_montant', 10, 2)->nullable();

            // Une fois qu'une pénalité a réellement été appliquée à un
            // membre de ce sol, toute la configuration ci-dessus devient
            // définitivement figée (plus aucune modification possible),
            // pour qu'un créateur ne puisse jamais ajuster les règles
            // après coup au détriment ou à l'avantage d'un membre précis.
            $table->boolean('penalites_verrouillees')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('sols', function (Blueprint $table) {
            $table->dropColumn([
                'penalites_actives',
                'penalite_montant_base',
                'penalite_palier10_actif',
                'penalite_palier10_mode',
                'penalite_palier10_montant',
                'penalite_palier30_actif',
                'penalite_palier30_mode',
                'penalite_palier30_montant',
                'penalites_verrouillees',
            ]);
        });
    }
};