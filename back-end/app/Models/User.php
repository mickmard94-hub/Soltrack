<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    // IMPORTANT : 'is_admin' n'est volontairement PAS dans $fillable.
    // Ça empêche un utilisateur normal de se transformer en admin en
    // envoyant simplement is_admin=true dans une requête PUT /user/profil
    // (comme celle qui met à jour le nom/email). Le seul chemin légitime
    // pour devenir admin passe par AdminController::promouvoir(), qui
    // fait un ->update(['is_admin' => true]) explicite et vérifié par
    // secret, jamais via un tableau de champs venant directement de
    // la requête de l'utilisateur.

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    /**
     * Les sols créés par cet utilisateur. Utilisé notamment dans
     * SolController (création/liste des sols) et dans
     * AuthController::destroyAccount (suppression en cascade).
     */
    public function sols()
    {
        return $this->hasMany(Sol::class);
    }
}