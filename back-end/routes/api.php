<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SolController;
use App\Http\Controllers\Api\MembreController;
use App\Http\Controllers\Api\CotisationController;
use Illuminate\Support\Facades\Route;

Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'me']);

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
});