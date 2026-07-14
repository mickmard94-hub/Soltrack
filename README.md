# SolTrack

**Gestion numérique de sols (tontines communautaires)**

Application web full-stack permettant à un responsable de sol de suivre les cotisations, les tours de versement et le tableau de bord financier de ses tontines, sans risque d'erreur de calcul ou de conflit entre membres.

🌐 **Application en ligne** : https://soltrack-frontend.onrender.com
🔌 **API en ligne** : https://soltrack-backend.onrender.com
📦 **Dépôt GitHub** : https://github.com/mickmard94-hub/Soltrack
🎥 **Vidéo de démonstration** (présentation du travail) : https://youtu.be/o1LiWUi3UjI?si=xb5GN97Y7aJE_CH6
🎥 **Vidéo de démonstration** (tests Selenium) : https://youtu.be/0Q3PheyyKzs
🎥 **Vidéo de démonstration** (tests Postman) : https://youtu.be/tOTmxbR4JwI

## Contexte

Le suivi manuel des sols (cahier papier, groupes WhatsApp, mémoire du responsable) entraîne des erreurs de calcul, des oublis de cotisation et parfois des conflits entre membres. SolTrack offre une vision claire et immédiate de qui a cotisé, qui doit recevoir la cagnotte, et à quelle date.

## Technologies

- **Front-end** : React (via Vite), React Router, Axios, Bootstrap
- **Back-end** : Laravel 13, Laravel Sanctum (authentification par token)
- **Base de données** : SQLite en local, PostgreSQL en production (Render)
- **Déploiement** : Render (backend en conteneur Docker, frontend en Static Site)
- **Tests** : PHPUnit (back-end), Selenium IDE (parcours front-end)

## Fonctionnalités principales

- Authentification (inscription / connexion) par email et mot de passe
- Gestion des sols : créer, modifier, clôturer, supprimer
- Gestion des membres (CRUD complet) avec ordre de réception de la cagnotte
- **Échange de tour entre deux membres**, à tout moment tant que le tour n'est pas déjà versé
- Enregistrement des cotisations avec règles métier strictes (montant fixe, anti-double-paiement, paiement possible en avance ou en retard)
- Un tour n'est marqué **« versé »** que lorsque **tous** les membres du sol ont cotisé pour ce tour — jamais au premier paiement reçu
- Dates de chaque tour calculées à partir de la date de début du sol, de sa fréquence et du nombre de tours (période réelle affichée : début → fin)
- Tableau de bord : total collecté, prochain bénéficiaire, cotisations en attente et en retard — calculées **tour par tour**, en tenant compte de sa date réelle de début et de fin
- Page dédiée « Cotisations manquantes » (tour en cours) et « Cotisations par tour » (historique complet, qui a payé et quand, pour chaque tour)
- Isolation des données : chaque responsable ne voit que ses propres sols

## Structure du dépôt

Soltrack/
├── back-end/                     # API Laravel
│   ├── app/
│   │   ├── Http/Controllers/Api/ # AuthController, SolController,
│   │   │                        # MembreController, CotisationController
│   │   └── Models/               # User, Sol, Membre, Tour, Cotisation
│   ├── database/
│   │   ├── migrations/           # Schéma des tables + index de performance
│   │   ├── factories/
│   │   └── seeders/
│   ├── routes/
│   │   └── api.php               # Toutes les routes /api/*
│   ├── bootstrap/app.php         # Middleware, gestion des exceptions API
│   └── Dockerfile                # Image de déploiement (Render)
│
├── front-end/                    # SPA React (Vite)
│   └── src/
│       ├── pages/                # Accueil, Connexion, ListeSols, DetailSol,
│       │                        # CreerSol, ModifierSol, CotisationsParTour, etc.
│       ├── components/           # RouteProtegee, RoueDesTours (roue des tours)
│       ├── contexts/              # AuthContext (état de connexion)
│       └── services/              # api.js (instance Axios + intercepteur)
│
├── .gitignore
└── README.md

## Installation

### Prérequis
- PHP 8.3+, Composer
- Node.js 18+, npm
- SQLite

### Back-end

```bash
cd back-end
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

L'API tourne sur `http://127.0.0.1:8000`.

### Front-end

```bash
cd front-end
npm install
npm run dev
```

L'application tourne sur `http://localhost:5173`.

Pour mesurer la performance réelle (version minifiée, pas le mode développement) :

```bash
cd front-end
npm run build
npm run preview
```

## Déploiement (Render)

- **Backend** : service Web (Docker) — Root Directory `back-end`, build via `Dockerfile` (PHP 8.3, extensions `pdo_pgsql`, `bcmath`), migrations exécutées automatiquement au démarrage.
- **Frontend** : Static Site — Root Directory `front-end`, `npm run build`, dossier de publication `dist`, variable d'environnement `VITE_API_URL` pointée vers l'API backend déployée, règle de réécriture `/* → /index.html` (routing côté client React Router).
- **Base de données** : PostgreSQL managé par Render, connecté via variables d'environnement (`DB_HOST`, `DB_PASSWORD`, etc.), jamais en dur dans le code.

Le fichier `.env` n'est jamais versionné (voir `.env.example`).

## Logique des dates et des tours

- La **date de fin** d'un sol ou d'un tour n'est jamais stockée : elle est recalculée à partir de `date_debut`, `frequence` et `nombre_tours` (ou de l'ordre de réception pour un tour précis).
- Un tour peut être payé **en avance ou en retard** : les dates ne bloquent jamais un paiement, elles servent uniquement à classer les cotisations manquantes en **« en attente »** (tour en cours) ou **« en retard »** (période du tour terminée).
- Un tour passe au statut **« versé »** uniquement quand tous les membres ont cotisé pour ce tour ; la date de versement enregistrée est celle du dernier paiement qui complète le tour.
- Deux membres peuvent **échanger leur tour** (page « Membres du sol »), sauf si l'un des deux tours est déjà versé.

## Tests

### Back-end (PHPUnit)

```bash
cd back-end
php artisan test
```

- `SolControllerTest` (5 tests) : création d'un sol, validation des champs obligatoires, fréquence invalide, accès refusé sans authentification (401), accès refusé au sol d'un autre utilisateur (403).
- `CotisationControllerTest` (5 tests) : enregistrement valide, montant incorrect rejeté, double paiement sur le même tour rejeté, membre hors du sol rejeté, passage automatique du tour au statut « versé ».
- `CotisationReglesMetierTest` : versement uniquement si tous ont cotisé, paiement en avance autorisé, échange de tour entre deux membres, impossible d'échanger un tour déjà versé.

### Front-end (Selenium IDE)

Le fichier `tests-selenium/soltrack.side` contient les scénarios de test automatisés (connexion, création d'un sol et ajout de membres, enregistrement d'une cotisation), exécutables via l'extension Selenium IDE. Voir la vidéo de démonstration ci-dessus pour une exécution complète.

## Sécurité

- Mots de passe hashés (bcrypt), jamais stockés ni renvoyés en clair
- Authentification par token (Laravel Sanctum), attaché automatiquement à chaque requête front-end
- Validation stricte de toutes les entrées côté serveur
- Protection contre l'injection SQL (ORM Eloquent + listes blanches `$fillable`, aucune requête brute)
- Protection XSS (échappement automatique React)
- Contrôle d'accès par propriétaire (chaque utilisateur n'accède qu'à ses propres sols — protection anti-IDOR)
- Intégrité financière (montant de cotisation vérifié contre le montant fixé du sol, tour dans les bornes, anti-double-paiement)
- Blocage des actions sur un sol clôturé (ajout de membre, cotisation, échange de tour)
- Toutes les routes sensibles protégées par le middleware `auth:sanctum`
- Aucun détail technique d'erreur serveur exposé à l'utilisateur final

## Performance et optimisation

Optimisations mises en place pour respecter le seuil de 2,5 secondes par action fixé au Cahier des Charges :

- **Pagination** : la liste des sols est renvoyée par pages de 10 plutôt qu'en un seul bloc.
- **Eager loading** (anti N+1) : le détail d'un sol charge ses membres et ses tours en une seule fois (3 requêtes fixes au lieu d'une vingtaine).
- **Agrégats calculés en base** : les totaux du tableau de bord (`SUM`) sont calculés par la base de données, pas par une boucle PHP.
- **Index composites** (`sol_id` + `tour_numero`, `sol_id` + `numero_tour`) sur les tables `cotisations` et `tours`.
- **Code splitting** front-end : chaque page React est chargée à la demande (`lazy` + `Suspense`), réduisant le poids initial téléchargé — important pour un usage mobile en connexion limitée.

**Mesures réelles (Postman, environnement local)** : 625 à 720 ms par action, largement sous le seuil de 2,5 s.

Un incident réel de performance (délai de ~30 secondes sur les requêtes non authentifiées, dû à une tentative de redirection Laravel vers une route `login` inexistante dans cette API pure) a été diagnostiqué via les logs (`storage/logs/laravel.log`) et corrigé dans `bootstrap/app.php` via `redirectGuestsTo(fn () => null)`. Validation : 5 scénarios Selenium rejoués avec succès après correction (205 étapes cumulées, 1 à 4 secondes par étape).

## Auteur

Mardochee Michel — Projet réalisé dans le cadre du cours Développement Web Niveau Approfondi (D-CLIC)