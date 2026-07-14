<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

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

    protected $appends = ['date_fin_prevue'];

    public function sol()
    {
        return $this->belongsTo(Sol::class);
    }

    public function membreBeneficiaire()
    {
        return $this->belongsTo(Membre::class, 'membre_beneficiaire_id');
    }

    /**
     * Date de fin réelle de la période de collecte de ce tour, calculée à
     * partir de la fréquence du sol. Un tour "se termine" à la veille du
     * début du tour suivant (règle des dates liées à la réalité) : la
     * cagnotte n'est donc considérée due qu'à la fin de cette période,
     * jamais à son commencement.
     */
    public function getDateFinPrevueAttribute()
    {
        if (!$this->date_prevue || !$this->sol) {
            return null;
        }

        $intervalleJours = $this->sol->frequence === 'hebdomadaire' ? 7 : 30;

        return Carbon::parse($this->date_prevue)
            ->addDays($intervalleJours)
            ->subDay()
            ->toDateString();
    }
}
