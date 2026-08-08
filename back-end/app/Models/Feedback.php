<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    protected $fillable = [
        'user_id',
        'aime',
        'meilleure_page',
        'page_a_ameliorer',
        'recommande',
    ];

    protected $casts = [
        'aime' => 'boolean',
        'recommande' => 'boolean',
    ];
}