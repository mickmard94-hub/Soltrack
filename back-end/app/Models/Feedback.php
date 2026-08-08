<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    // Laravel déduit normalement "feedbacks" par pluralisation
    // automatique, mais "feedback" est invariable en anglais et le
    // pluriel automatique se trompe. On force explicitement le bon nom
    // de table (celui réellement créé par la migration).
    protected $table = 'feedbacks';

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