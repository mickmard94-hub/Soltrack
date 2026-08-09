<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demandes_autorisation', function (Blueprint $table) {
            $table->id();
            $table->foreignId('demandeur_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('traite_par_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action'); // export_utilisateurs, export_avis, export_journal, reinitialiser_base
            $table->string('statut')->default('en_attente'); // en_attente, approuvee, refusee, utilisee
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demandes_autorisation');
    }
};