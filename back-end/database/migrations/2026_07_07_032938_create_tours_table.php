<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sol_id')->constrained('sols')->onDelete('cascade');
            $table->integer('numero_tour');
            $table->foreignId('membre_beneficiaire_id')->constrained('membres')->onDelete('cascade');
            $table->date('date_prevue');
            $table->date('date_versement')->nullable();
            $table->enum('statut', ['a_venir', 'verse'])->default('a_venir');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tours');
    }
};