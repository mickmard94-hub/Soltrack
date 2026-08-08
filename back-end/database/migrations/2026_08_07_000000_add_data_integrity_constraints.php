<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membres', function (Blueprint $table) {
            $table->unique(['sol_id', 'ordre_reception']);
        });

        Schema::table('tours', function (Blueprint $table) {
            $table->unique(['sol_id', 'numero_tour']);
        });

        Schema::table('cotisations', function (Blueprint $table) {
            $table->unique(['sol_id', 'membre_id', 'tour_numero'], 'cotisations_uniques_par_tour');
            $table->index(['sol_id', 'tour_numero']);
        });
    }

    public function down(): void
    {
        Schema::table('membres', function (Blueprint $table) {
            $table->dropUnique(['sol_id', 'ordre_reception']);
        });

        Schema::table('tours', function (Blueprint $table) {
            $table->dropUnique(['sol_id', 'numero_tour']);
        });

        Schema::table('cotisations', function (Blueprint $table) {
            $table->dropUnique('cotisations_uniques_par_tour');
            $table->dropIndex(['sol_id', 'tour_numero']);
        });
    }
};