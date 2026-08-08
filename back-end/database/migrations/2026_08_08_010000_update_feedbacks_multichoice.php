<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->dropColumn(['aime', 'meilleure_page', 'page_a_ameliorer', 'recommande']);
        });

        Schema::table('feedbacks', function (Blueprint $table) {
            // Toutes les questions deviennent optionnelles : on
            // n'oblige plus l'utilisateur à répondre à tout.
            $table->boolean('aime')->nullable();
            // Choix multiples possibles désormais, stockés en JSON.
            $table->json('meilleures_pages')->nullable();
            $table->json('pages_a_ameliorer')->nullable();
            $table->boolean('recommande')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->dropColumn(['aime', 'meilleures_pages', 'pages_a_ameliorer', 'recommande']);
        });

        Schema::table('feedbacks', function (Blueprint $table) {
            $table->boolean('aime');
            $table->string('meilleure_page');
            $table->string('page_a_ameliorer');
            $table->boolean('recommande');
        });
    }
};