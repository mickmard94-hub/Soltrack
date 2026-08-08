<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Penalite extends Model
{
    protected $fillable = [
        'sol_id',
        'membre_id',
        'tour_numero',
        'montant',
        'jours_retard',
        'palier',
    ];

    public function membre()
    {
        return $this->belongsTo(Membre::class);
    }

    public function sol()
    {
        return $this->belongsTo(Sol::class);
    }
}