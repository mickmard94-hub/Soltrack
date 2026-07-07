<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sols', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->decimal('montant_cotisation', 10, 2);
            $table->enum('frequence',['hebdomadaire','mensuelle']);
            $table->integer('nombre_tours');
            $table->date('date_debut');
            $table->enum('statut',['actif','cloture'])->default('actif');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sols');
    }
};
