<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cotisation extends Model
{
    protected $fillable = [
        'sol_id',
        'membre_id',
        'tour_numero',
        'montant',
        'date_paiement',
        'statut',
    ];

    public function sol()
    {
        return $this->belongsTo(Sol::class);
    }

    public function membre()
    {
        return $this->belongsTo(Membre::class);
    }
}