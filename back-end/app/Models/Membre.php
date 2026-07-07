<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Membre extends Model
{
    protected $fillable = [
        'sol_id',
        'nom',
        'telephone',
        'ordre_reception',
    ];

    public function sol()
    {
        return $this->belongsTo(Sol::class);
    }

    public function cotisations()
    {
        return $this->hasMany(Cotisation::class);
    }

    public function toursBeneficiaire()
    {
        return $this->hasMany(Tour::class, 'membre_beneficiaire_id');
    }
}