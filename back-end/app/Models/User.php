<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    // 'is_admin', 'two_factor_secret' et 'two_factor_enabled' sont
    // volontairement absents de $fillable — ces champs ne doivent
    // jamais pouvoir être modifiés via un formulaire générique
    // (comme la mise à jour du profil). Ils ne passent que par des
    // méthodes dédiées et contrôlées (AdminController::promouvoir,
    // TwoFactorController).

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'two_factor_enabled' => 'boolean',
        ];
    }

    public function sols()
    {
        return $this->hasMany(Sol::class);
    }
}