<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tour extends Model
{
    protected $fillable = [
        'sol_id',
        'numero_tour',
        'membre_beneficiaire_id',
        'date_prevue',
        'date_versement',
        'statut',
    ];

    public function sol()
    {
        return $this->belongsTo(Sol::class);
    }

    public function membreBeneficiaire()
    {
        return $this->belongsTo(Membre::class, 'membre_beneficiaire_id');
    }
}