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
        'penalites_actives',
        'penalite_montant_base',
        'penalite_palier10_actif',
        'penalite_palier10_mode',
        'penalite_palier10_montant',
        'penalite_palier30_actif',
        'penalite_palier30_mode',
        'penalite_palier30_montant',
        'penalites_verrouillees',
    ];

    protected $casts = [
        'penalites_actives' => 'boolean',
        'penalite_palier10_actif' => 'boolean',
        'penalite_palier30_actif' => 'boolean',
        'penalites_verrouillees' => 'boolean',
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

    public function penalites()
    {
        return $this->hasMany(Penalite::class);
    }
}