<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sols', function (Blueprint $table) {
            // Nullable et indépendante de 'frequence' : si remplie, elle
            // prime sur l'ancien système hebdomadaire/mensuelle. Les sols
            // déjà créés gardent cette colonne à null et continuent de
            // fonctionner exactement comme avant.
            $table->unsignedInteger('frequence_jours')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('sols', function (Blueprint $table) {
            $table->dropColumn('frequence_jours');
        });
    }
};