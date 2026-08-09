<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DemandeAutorisation extends Model
{
    protected $table = 'demandes_autorisation';

    protected $fillable = ['demandeur_id', 'traite_par_id', 'action', 'statut'];

    public function demandeur()
    {
        return $this->belongsTo(User::class, 'demandeur_id');
    }

    public function traitePar()
    {
        return $this->belongsTo(User::class, 'traite_par_id');
    }
}