<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('penalites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sol_id')->constrained()->onDelete('cascade');
            $table->foreignId('membre_id')->constrained('membres')->onDelete('cascade');
            $table->unsignedInteger('tour_numero');
            $table->decimal('montant', 10, 2);
            $table->unsignedInteger('jours_retard');
            $table->string('palier'); // 'base', '10j', ou '30j'
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penalites');
    }
};