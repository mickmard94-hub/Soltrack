<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SolController;
use App\Http\Controllers\Api\MembreController;
use App\Http\Controllers\Api\CotisationController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TwoFactorController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:6,1')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('2fa/verifier-connexion', [TwoFactorController::class, 'verifierConnexion']);
});

Route::middleware('throttle:10,1')->group(function () {
    Route::post('feedback', [FeedbackController::class, 'store']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'me']);
    Route::put('user/profil', [AuthController::class, 'updateProfile']);
    Route::put('user/mot-de-passe', [AuthController::class, 'updatePassword']);
    Route::delete('user', [AuthController::class, 'destroyAccount']);

    Route::post('2fa/activer', [TwoFactorController::class, 'activer']);
    Route::post('2fa/confirmer', [TwoFactorController::class, 'confirmer']);
    Route::post('2fa/desactiver', [TwoFactorController::class, 'desactiver']);

    Route::apiResource('sols', SolController::class);
    Route::get('sols/{sol}/tableau-de-bord', [SolController::class, 'tableauDeBord']);
    Route::get('sols/{sol}/cotisations-manquantes', [SolController::class, 'cotisationsManquantes']);
    Route::get('sols/{sol}/cotisations-par-tour', [SolController::class, 'cotisationsParTour']);

    Route::get('sols/{sol}/membres', [MembreController::class, 'index']);
    Route::post('sols/{sol}/membres', [MembreController::class, 'store']);
    Route::post('sols/{sol}/membres/echanger-tour', [MembreController::class, 'echangerTour']);
    Route::put('membres/{membre}', [MembreController::class, 'update']);
    Route::delete('membres/{membre}', [MembreController::class, 'destroy']);

    Route::post('cotisations', [CotisationController::class, 'store']);
    Route::delete('cotisations/{cotisation}', [CotisationController::class, 'destroy']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/non-lues-count', [NotificationController::class, 'nonLuesCount']);
    Route::put('notifications/{notification}/lue', [NotificationController::class, 'marquerLue']);
    Route::put('notifications/tout-marquer-lu', [NotificationController::class, 'toutMarquerLu']);

    Route::post('admin/promouvoir', [AdminController::class, 'promouvoir']);
    Route::get('admin/statistiques', [AdminController::class, 'statistiques']);
    Route::get('admin/utilisateurs/recents', [AdminController::class, 'recentsUtilisateurs']);
    Route::get('admin/utilisateurs/export', [AdminController::class, 'exportUtilisateursCsv']);
    Route::get('admin/avis/recents', [AdminController::class, 'recentsAvis']);
    Route::get('admin/avis/export', [AdminController::class, 'exportAvisCsv']);
    Route::get('admin/journal', [AdminController::class, 'journalAudit']);
    Route::delete('admin/reinitialiser', [AdminController::class, 'reinitialiserBaseDeDonnees']);
});