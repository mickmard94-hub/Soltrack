<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // CORRECTION RÉELLE — SolTrack est une API pure, sans page de connexion
        // web. Sans cette ligne, le middleware d'authentification essaie par
        // défaut de rediriger tout visiteur non connecté vers une route nommée
        // "login" qui n'existe pas ici, ce qui provoque un crash (Route [login]
        // not defined) au lieu d'une simple réponse 401. On désactive donc
        // explicitement toute tentative de redirection.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Sécurité supplémentaire : force une réponse JSON (jamais de page
        // HTML de débogage) pour toute requête vers /api/*.
        $exceptions->shouldRenderJsonWhen(function ($request, $exception) {
            return $request->is('api/*') || $request->expectsJson();
        });
    })->create();