# SolTrack

**Gestion numérique de sols (tontines communautaires)**

Application web full-stack permettant à un responsable de sol de suivre les cotisations, les tours de versement et le tableau de bord financier de ses tontines, sans risque d'erreur de calcul ou de conflit entre membres.

## Contexte

Le suivi manuel des sols (cahier papier, groupes WhatsApp, mémoire du responsable) entraîne des erreurs de calcul, des oublis de cotisation et parfois des conflits entre membres. SolTrack offre une vision claire et immédiate de qui a cotisé, qui doit recevoir la cagnotte, et à quelle date.

## Technologies

- **Front-end** : React (via Vite), React Router, Axios, Bootstrap
- **Back-end** : Laravel 13, Laravel Sanctum (authentification par token)
- **Base de données** : SQLite
- **Tests** : PHPUnit (back-end), Selenium IDE (parcours front-end)

## Fonctionnalités principales

- Authentification (inscription / connexion) par email et mot de passe
- Gestion des sols : créer, modifier, clôturer, supprimer
- Gestion des membres (CRUD complet) avec ordre de réception de la cagnotte
- Enregistrement des cotisations avec règles métier strictes (montant fixe, anti-double-paiement)
- Suivi automatique des tours (génération et mise à jour de statut)
- Tableau de bord : total collecté, prochain bénéficiaire, cotisations en attente et en retard
- Liste des cotisations manquantes pour le tour en cours
- Isolation des données : chaque responsable ne voit que ses propres sols

## Structure du dépôt

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

## Tests

### Back-end (PHPUnit)

```bash
cd back-end
php artisan test
```

### Front-end (Selenium IDE)

Le fichier `tests-selenium/soltrack.side` contient un scénario de test automatisé du parcours "Créer un sol et ajouter un membre", exécutable via l'extension Selenium IDE.

## Sécurité

- Mots de passe hashés (bcrypt)
- Authentification par token (Laravel Sanctum)
- Validation stricte de toutes les entrées côté serveur
- Protection contre l'injection SQL (ORM Eloquent, aucune requête brute)
- Protection XSS (échappement automatique React)
- Contrôle d'accès par propriétaire (chaque utilisateur n'accède qu'à ses propres données)
- Intégrité financière (montant de cotisation vérifié contre le montant fixé du sol, anti-double-paiement)

## Auteur

Michel Mardochée — Projet réalisé dans le cadre du cours Développement Web Niveau Approfondi (D-CLIC)