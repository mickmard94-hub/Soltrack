<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    protected $table = 'feedbacks';

    protected $fillable = [
        'user_id',
        'aime',
        'meilleures_pages',
        'pages_a_ameliorer',
        'recommande',
    ];

    protected $casts = [
        'aime' => 'boolean',
        'recommande' => 'boolean',
        'meilleures_pages' => 'array',
        'pages_a_ameliorer' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}