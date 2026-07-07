<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sol extends Model
{
    protected $fillable = [
        'user_id',
        'nom',
        'montant_cotisation',
        'frequence',
        'nombre_tours',
        'date_debut',
        'statut',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function membres()
    {
        return $this->hasMany(Membre::class);
    }

    public function tours()
    {
        return $this->hasMany(Tour::class);
    }

    public function cotisations()
    {
        return $this->hasMany(Cotisation::class);
    }
}