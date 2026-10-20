# Instructions pour les Agents IA — Projet Gesta

Ce fichier définit les directives et conventions pour les assistants de développement IA (Copilot, Antigravity, Claude, etc.).
Les instructions complètes et détaillées sont centralisées dans [`.github/copilot-instructions.md`](./.github/copilot-instructions.md).

## Règles Clés

1. **Vérification de qualité** : Toujours exécuter `npm run check` avant de valider toute modification (zéro erreur ni avertissement Oxlint, TypeScript ou Vitest).
2. **Backend (Express + SQLite)** :
   - Architecture en couches stricte : `controllers` -> `services` -> `repositories` -> SQLite.
   - Les services ne touchent jamais aux objets `Request`/`Response` d'Express.
   - Imports relatifs avec extension `.ts` obligatoire.
   - SQL écrit à la main avec `better-sqlite3`, aucun ORM.
   - Migrations : Ne jamais modifier une migration existante, toujours créer un nouveau fichier incrémental (`002_...sql`).
   - Erreurs : Lever systématiquement `throw new HttpError(statut, code, message)`.
3. **Frontend (React + Vite)** :
   - Architecture MVVM : `pages` -> `hooks` -> `services` / `utils` -> `models`.
   - `useAuth` appelé exclusivement dans `App.tsx`.
   - Type guards écrits à la main pour valider les payloads API (pas de Zod/bibliothèque tierce).
   - Libellés en français côté interface, statuts en anglais en base.
4. **Documentation & Suivi** :
   - Mettre à jour [`backend/API.md`](./backend/API.md) et [`backend/http/`](./backend/http/) lors des ajouts d'endpoints.
   - Exporter les conversations de session dans [`docs/`](./docs/).

