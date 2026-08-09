<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JournalAudit extends Model
{
    protected $table = 'journaux_audit';

    protected $fillable = ['user_id', 'action', 'entite', 'entite_id', 'details'];

    protected $casts = ['details' => 'array'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Point d'entrée unique pour enregistrer une action sensible.
     * $user peut être null (ex : tentative de connexion échouée).
     */
    public static function enregistrer($user, string $action, string $entite, $entiteId = null, array $details = []): void
    {
        static::create([
            'user_id' => $user?->id,
            'action' => $action,
            'entite' => $entite,
            'entite_id' => $entiteId,
            'details' => $details,
        ]);
    }
}