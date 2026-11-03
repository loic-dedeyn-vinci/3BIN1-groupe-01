# Instructions GitHub Copilot — Projet Gesta

Ce document fournit le contexte technique, architectural et les règles de développement pour assister au développement de **Gesta**.

---

## 1. Vue d'ensemble du projet

**Gesta** est une application web de gestion des stages en entreprise pour une école (étudiants, entreprises/contacts, offres, candidatures, stages et conventions).
Le cahier des charges fonctionnel et métier complet est disponible dans [`docs/cdc_gesta_developpement.md`](../docs/cdc_gesta_developpement.md).

### Monorepo & Espaces de travail (Workspaces)
- **Monorepo** géré par npm workspaces (`backend` et `frontend`).
- **Backend** (`backend/`) : API REST Node.js (>=22.14.0), Express 5, TypeScript, SQLite avec `better-sqlite3`.
- **Frontend** (`frontend/`) : SPA React 19, TypeScript, Vite, React Router, CSS natif.
- **Base de données** : SQLite fichier local (`backend/data/gesta.db`) ou en mémoire pour les tests.

---

## 2. Commandes principales

Toutes les commandes se lancent depuis la racine du dépôt :

| Commande | Rôle |
|---|---|
| `npm ci` | Installe les dépendances strictement selon `package-lock.json` |
| `npm run setup` | Crée `backend/.env` avec un `JWT_SECRET` aléatoire et initialise la base avec le seed de démo |
| `npm run dev` | Lance l'API (`http://localhost:3000`) et le frontend (`http://localhost:5173`) en simultané |
| `npm run db:init` | Crée/met à jour la base et applique les migrations SQL |
| `npm run db:reset` | Supprime et recrée la base de données avec le seed |
| `npm run check` | **Obligatoire avant commit/PR** : exécute `lint`, `typecheck`, `test` et `build` |
| `npm test` | Exécute les suites de tests Vitest (backend et frontend) |
| `npm run lint` | Linter Oxlint (aucune erreur ni avertissement toléré) |
| `npm run typecheck` | Contrôle de types TypeScript |
| `npm run build` | Compile backend et frontend pour la production |

---

## 3. Architecture et Conventions Backend

Le backend suit une architecture en couches stricte :

```text
Requête HTTP
   ↓
main.ts → app.ts ── middlewares (authenticate, authorize, errorHandler)
   ↓
controllers → services → repositories → SQLite
                 ↕
     mappers : DBO ↔ Entité métier ↔ DTO
```

### Règles de conception :
1. **Contrôleurs (`backend/src/controllers/`)** :
   - Gèrent la réception HTTP, l'extraction et la validation des paramètres de requête et du corps (`INVALID_QUERY`, `INVALID_BODY`).
   - Délèguent toute la logique métier aux services.
   - Ne font pas de requêtes SQL directes.
2. **Services (`backend/src/services/`)** :
   - Encapsulent la logique métier et la vérification des autorisations métier.
   - **Ne doivent JAMAIS recevoir d'objets `Request` ou `Response` d'Express.**
   - Utilisent les règles définies dans `services/permissions.ts`.
3. **Repositories (`backend/src/repositories/`)** :
   - Exécutent le SQL écrit à la main avec `better-sqlite3`. Pas d'ORM.
   - Retournent des DBO (Database Objects bruts).
4. **Mappers & Modèles (`backend/src/mappers/`, `backend/src/models/`)** :
   - Convertissent explicitement : `DBO` (SQL brut) ↔ `Entité métier` ↔ `DTO` (payload API).
5. **Gestion des erreurs** :
   - Lever systématiquement `throw new HttpError(statut, code, message)`.
   - Codes standard : `INVALID_QUERY` (400), `INVALID_BODY` (400), `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409).
6. **Imports TypeScript** :
   - Les imports relatifs doivent obligatoirement se terminer par l'extension `.ts` (ex: `import { ... } from './service.ts';`).
7. **Base de données & Migrations (`backend/src/db/migrations/`)** :
   - Les migrations sont des scripts SQL ordonnés (`001_initial.sql`, `002_...sql`).
   - **Ne jamais modifier une migration déjà existante.** Toute évolution de schéma requiert un nouveau fichier incrémental.
   - Les clés étrangères et contraintes d'intégrité sont activées dans SQLite (`PRAGMA foreign_keys = ON`).
   - Les statuts sont persistés en anglais en majuscules (ex: `PUBLISHED`, `PENDING_REVIEW`).
8. **Authentification & Droits** :
   - Le jeton JWT est transmis directement dans l'en-tête `Authorization` (sans préfixe `Bearer `).
   - Le jeton ne stocke que l'identité (`kind`, `id`). Le middleware `authenticate` recharge le compte, les rôles et les entreprises depuis la base à chaque requête.

---

## 4. Architecture et Conventions Frontend

Le frontend suit le patron **MVVM** :

```text
pages → hooks → services / utils → models
  ↓
components
```

### Règles de conception :
1. **Session & Auth** :
   - `useAuth` est appelé **uniquement** dans `App.tsx`. Le jeton et les callbacks (`onLogout`, `onUnauthorized`) sont transmis via les props.
   - Sur un statut 401 reçu de l'API, appeler `onUnauthorized()` pour rediriger vers la page de connexion.
2. **Services (`frontend/src/services/`)** :
   - Effectuent les requêtes `fetch` (avec le préfixe `/api` redirigé par le proxy Vite vers le port 3000).
   - Valident systématiquement le format JSON reçu à l'aide de **type guards écrits à la main** (`src/utils/typeGuards.ts`). Pas de bibliothèque tierce (ex: pas de Zod).
3. **Hooks personnalisés (`frontend/src/hooks/`)** :
   - Gèrent l'état local, le chargement (`isLoading`), les erreurs et le rafraîchissement des données (avec gestion des annulations / debounce si nécessaire).
4. **Composants (`frontend/src/components/`) & Pages (`frontend/src/pages/`)** :
   - Les composants sont réutilisables et découplés des routes.
   - Les pages assemblent les hooks et les composants.
   - CSS simple et soigné, sans framework CSS lourd ni bibliothèque de composants.
   - Libellés et messages affichés en français à l'utilisateur.

---

## 5. Stratégie de Tests

- **Backend (`backend/tests/`)** :
  - Tests d'intégration d'API avec Vitest et Supertest.
  - Toujours exécutés sur une **base SQLite en mémoire isolée** (`tests/helpers/testApp.ts`), jamais sur la base de développement.
  - Utiliser `tokenFor(kind, id)` pour simuler les différents profils d'utilisateurs issus du seed (`tests/helpers/testApp.ts`).
  - Couvrir systématiquement les scénarios nominaux et les cas d'erreur (400, 401, 403, 404).
- **Frontend (`frontend/tests/`)** :
  - Tests de composants et de pages avec Vitest et React Testing Library.
  - Utiliser `tests/helpers/fetchMock.ts` pour simuler les réponses de l'API.

---

## 6. Checklist de Contribution et Pull Request

Avant de soumettre une modification ou d'ouvrir une PR (cf. `.github/pull_request_template.md`) :
- [ ] `npm run check` s'exécute avec succès (0 erreurs, 0 avertissements Oxlint et TypeScript).
- [ ] Les tests couvrent les nouveaux comportements ainsi que les cas d'erreur.
- [ ] La documentation de l'API (`backend/API.md`) et les requêtes de test (`backend/http/*.http`) sont synchronisées.
- [ ] Toute modification de schéma SQL fait l'objet d'un nouveau fichier de migration.
- [ ] La conversation avec l'assistant de code est exportée dans `docs/semaine-N/` ou `docs/conversation-N.md`.

