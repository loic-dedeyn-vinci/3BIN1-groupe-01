# Bilan de la semaine 2 — Gestion des candidatures

## 1. Choix

La semaine 2 a porté sur les exigences fonctionnelles **EF-32** et **EF-33** : candidater à une offre publiée, consulter ses candidatures et retirer une candidature tant qu'elle n'est pas traitée.

### Choix fonctionnels

- Une candidature est créée uniquement par un étudiant authentifié.
- Une candidature ne peut viser qu'une offre au statut `PUBLISHED`.
- Le message de candidature est facultatif. Les valeurs vides sont normalisées en `null` et la taille est limitée à 2 000 caractères.
- Une seule candidature est autorisée par couple étudiant/offre. Cette règle reste vraie après un retrait : une candidature retirée ne peut pas être recréée.
- Le retrait est logique : la ligne est conservée et son statut devient `WITHDRAWN`, afin de rester visible dans la liste des candidatures.
- Une candidature `SELECTED` ou `REJECTED` est considérée comme traitée et ne peut plus être retirée.
- Les statuts sont persistés en anglais (`IN_PROGRESS`, `SELECTED`, `REJECTED`, `WITHDRAWN`) et traduits en français dans l'interface.
- Les candidatures sont toujours filtrées par l'étudiant connecté. Aucun identifiant d'étudiant n'est accepté depuis le client.

### Choix techniques

- Ajout des routes `POST /applications`, `GET /applications` et `DELETE /applications/:id`.
- Respect de l'architecture existante : contrôleur pour HTTP et validation, service pour les règles métier, repository pour le SQL, mapper pour les conversions DBO/entité/DTO.
- Ajout d'une migration incrémentale `002_applications_unique_student_offer.sql`, sans modification de `001_initial.sql`.
- Réutilisation des patterns frontend existants : services `fetch`, type guards manuels, hook avec annulation, gestion centralisée des erreurs `401` et composants d'état.
- Le `DELETE` est volontairement une action métier de retrait, et non une suppression SQL.

## 2. Résultat

### Fonctionnalités opérationnelles

- Création d'une candidature avec ou sans message facultatif.
- Refus serveur d'une candidature sur une offre inexistante ou non publiée.
- Refus serveur des utilisateurs qui ne sont pas étudiants.
- Consultation par l'étudiant de ses propres candidatures uniquement.
- Affichage des statuts « En cours », « Retenue », « Non retenue » et « Retirée ».
- Retrait d'une candidature `IN_PROGRESS` avec conservation de la ligne et passage à `WITHDRAWN`.
- Blocage du retrait d'une candidature traitée ou déjà retirée.
- Affichage d'un message compréhensible lorsqu'une recandidature provoque une réponse `409` : « Une seule candidature est autorisée par offre. »

### Difficultés rencontrées et corrections

- L'ajout de la deuxième migration a rendu obsolète une assertion qui attendait uniquement `001_initial.sql`. Le test des migrations a été mis à jour pour vérifier `001` et `002`.
- Le premier typecheck backend a signalé un import manquant et des valeurs `unknown` dans la validation du contrôleur. Les types des paramètres ont été resserrés.
- Le lancement de `tsx watch` dans la sandbox a échoué avec `EPERM` lors de la création de son canal IPC. Le serveur a été relancé hors sandbox et fonctionne sur les ports prévus.
- Un lancement ciblé des tests frontend depuis la racine n'avait pas chargé jsdom et produisait `document is not defined`. Les tests ont ensuite été lancés via le workspace frontend, avec sa configuration Vitest correcte.
- Oxlint a signalé des mises à jour d'état synchrones dans `useApplications`. Le hook a été simplifié pour reprendre le pattern asynchrone déjà utilisé par `useOffers`.
- Après retour fonctionnel, l'erreur technique générique liée au statut `409` a été remplacée par un message utilisateur explicite et couverte par un test.

### Limites restantes

- La sélection d'un candidat, la création du stage et la gestion complète des offres restent hors périmètre, conformément à EF-30, EF-31, EF-34 et EF-50.
- La recandidature après retrait est volontairement interdite par le choix d'unicité retenu.
- Aucun historique détaillé des transitions de statut n'est ajouté, car le schéma initial ne le prévoit pas.

## 3. Modifications

Aucun fichier n'a été supprimé.

### API / Backend

- `backend/src/app.ts` : création du service et branchement de la route `/applications` derrière l'authentification.
- `backend/src/controllers/applications.controller.ts` : validation des corps et paramètres HTTP, routes de lecture, création et retrait.
- `backend/src/models/application.ts` : statuts, DBO, entité métier et DTO.
- `backend/src/mappers/application.mapper.ts` : conversion des données SQL vers l'entité et le DTO API.
- `backend/src/repositories/applications.repository.ts` : requêtes SQL de lecture, création et retrait logique.
- `backend/src/services/applications.service.ts` : règles métier, contrôle étudiant, publication de l'offre, unicité et retrait conditionnel.
- `backend/API.md` : documentation des trois endpoints et des erreurs possibles.
- `backend/http/applications.http` : requêtes REST d'exemple pour le mode démo.

### Schéma de base de données

- `backend/src/db/migrations/002_applications_unique_student_offer.sql` : index unique sur `(student_id, offer_id)`.
- `backend/tests/db/migrations.test.ts` : adaptation du test pour la nouvelle migration.
- La migration existante `001_initial.sql` n'a pas été modifiée.

### Frontend

- `frontend/src/models/application.ts` : modèle et statuts frontend.
- `frontend/src/services/applications.service.ts` : appels `GET`, `POST` et `DELETE` vers l'API.
- `frontend/src/hooks/useApplications.ts` : chargement, annulation, erreurs, session expirée et rafraîchissement après retrait.
- `frontend/src/pages/ApplicationsPage.tsx` : page « Mes candidatures ».
- `frontend/src/components/ApplicationTable.tsx` : tableau des candidatures et action de retrait.
- `frontend/src/components/OfferTable.tsx` : formulaire de candidature depuis une offre publiée et message d'erreur `409` convivial.
- `frontend/src/App.tsx` : route `/candidatures` réservée aux étudiants.
- `frontend/src/components/NavBar.tsx` : lien « Mes candidatures » pour les étudiants.
- `frontend/src/pages/OffersPage.tsx` : transmission du contexte étudiant au tableau des offres.
- `frontend/src/utils/guards.ts` : validation manuelle des réponses de candidature.
- `frontend/src/utils/labels.ts` : libellés et tons des statuts de candidature.
- `frontend/src/index.css` : styles du formulaire et des actions de candidature.

### Tests ajoutés ou modifiés

- `backend/tests/applications.test.ts` : tests d'intégration des trois endpoints.
- `frontend/tests/ApplicationsPage.test.tsx` : affichage, statuts, retrait et rafraîchissement.
- `frontend/tests/OffersPage.test.tsx` : message convivial en cas de doublon `409`.

### Ajustements par rapport au plan initial

- Le choix « une seule candidature par offre, y compris après retrait » a été confirmé et matérialisé par une migration unique.
- Le retrait a été implémenté par `DELETE` avec changement de statut, et non par suppression physique.
- Une limite de 2 000 caractères a été définie pour le message facultatif, car le cahier des charges ne donnait pas de valeur.
- L'erreur `409` est traduite dans l'interface pour éviter d'exposer le message technique « Candidature impossible (statut 409) ».

## 4. Validation fonctionnelle

### Scénarios manuels réellement exécutés

Aucun parcours complet n'a été exécuté manuellement dans le navigateur. Le navigateur était ouvert, mais son contenu n'était pas partageable dans l'environnement et aucune interaction manuelle fiable n'a été enregistrée. Il serait donc incorrect de présenter ces scénarios comme essayés manuellement.

Les vérifications d'exécution réellement effectuées sont les suivantes :

- `http://localhost:5173/` répond avec HTTP `200`.
- `http://localhost:3000/health` répond avec HTTP `200`.
- Le serveur backend démarre avec la migration `002_applications_unique_student_offer.sql` appliquée.
- Les comportements fonctionnels listés ci-dessous sont couverts par des tests d'intégration ou de composants automatisés.

### Scénarios automatisés équivalents

- Création avec message.
- Création sans message.
- Refus d'une offre non publiée.
- Refus d'une candidature déjà existante, y compris si elle est `WITHDRAWN`.
- Consultation limitée aux candidatures de l'étudiant connecté.
- Retrait d'une candidature `IN_PROGRESS`.
- Conservation de la candidature après retrait avec statut `WITHDRAWN`.
- Refus du retrait d'une candidature `SELECTED` ou `REJECTED`.
- Refus d'un retrait demandé pour la candidature d'un autre étudiant.
- Affichage frontend des quatre statuts en français.
- Affichage du message convivial lorsqu'une recandidature reçoit `409`.

## 5. Qualité

Les points suivants ont été vérifiés par lecture du code, analyse statique et validation du dépôt :

- Respect de `.github/copilot-instructions.md` et de l'architecture en couches backend.
- Services indépendants d'Express : aucun `Request` ou `Response` n'est transmis au service.
- SQL limité aux repositories et migration séparée pour l'évolution du schéma.
- Contrôles d'accès effectués côté serveur avec `authenticate`, `authorize` et vérification de l'étudiant connecté.
- Imports TypeScript relatifs terminés par `.ts`.
- Nommage explicite : `ApplicationsService`, `ApplicationsRepository`, `ApplicationDto`, `isApplication`, `withdrawApplication`.
- Type guards frontend écrits manuellement, sans dépendance de validation tierce.
- Pas de code mort ou de sélection administrateur ajoutée hors périmètre.
- DTO API distincts des données SQL internes : `studentId` n'est pas exposé dans la réponse frontend.
- Migration historique conservée intacte.
- `git diff --check` ne signale aucun problème de formatage.

Les principales simplifications/refactorisations sont le réemploi des patterns existants de `offers`, `useOffers`, `readJson` et `StatusBadge`, ainsi que l'usage d'un retrait logique plutôt qu'un nouveau système d'historique hors périmètre.

## 6. Tests et commandes

### Commandes principales exécutées

| Commande | Résultat |
|---|---|
| `npm run typecheck --workspace backend` | Réussi après correction des types du contrôleur |
| `npm test --workspace backend` | Suite complète réussie après mise à jour du test de migration |
| `npm run typecheck --workspace frontend` | Réussi |
| `npm test --workspace frontend` | Suite complète réussie |
| `npm test --workspace frontend -- OffersPage.test.tsx` | 7 tests réussis |
| `npm run lint --workspace frontend` | Réussi sans avertissement |
| `git diff --check` | Réussi |
| `npm run check` | Réussi : lint, typecheck, tests et build |
| `curl ... http://localhost:5173/` | HTTP `200` |
| `curl ... http://localhost:3000/health` | HTTP `200` |

La dernière exécution de `npm run check` a produit exactement :

- Backend : **10 fichiers de tests, 126 tests réussis**.
- Frontend : **8 fichiers de tests, 51 tests réussis**.
- Lint : réussi.
- Typecheck : réussi.
- Build backend et frontend : réussi.

### Couverture automatisée

Les tests backend sont des tests d'intégration Vitest/Supertest exécutés sur une base SQLite en mémoire isolée. Les tests frontend utilisent Vitest et React Testing Library avec le mock de `fetch` du projet.

Exemples de comportements couverts :

- Un `POST /applications` sur une offre non publiée retourne `409 CONFLICT`.
- Un administrateur qui appelle `GET /applications` reçoit `403 FORBIDDEN`.
- Un étudiant ne voit que ses propres candidatures.
- Un `DELETE /applications/:id` sur une candidature traitée retourne `409 CONFLICT`.
- Une candidature retirée reste présente dans `GET /applications` avec le statut `WITHDRAWN`.
- Le frontend remplace un `409` de recandidature par « Une seule candidature est autorisée par offre. »
