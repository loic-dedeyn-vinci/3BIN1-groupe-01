# Semaine 8 — Harnais agentique : guider et vérifier

## Exercice 1 — Inventaire des guides et des senseurs

L'analyse du dépôt met en évidence des mécanismes de guidage et de vérification, mais aussi des automatisations qui ne relèvent d'aucune de ces deux catégories.

### Classification des mécanismes

| | Guide — Feedforward | Senseur — Feedback |
|---|---|---|
| **Inférentiel (interprété par une IA)** | **[AGENTS.md](../AGENTS.md)** donne aux assistants IA des consignes sur l'architecture, les imports TypeScript, la gestion des erreurs, les migrations et les tests. Il demande notamment l'exécution de `npm run check`. Son chargement automatique n'a pas été vérifié.<br><br>**[.github/copilot-instructions.md](../.github/copilot-instructions.md)** fournit à GitHub Copilot les conventions du projet, les commandes disponibles et les règles de développement, par exemple l'utilisation de SQLite en mémoire pour les tests backend. Son chargement automatique n'est pas vérifiable depuis le dépôt seul.<br><br>**[.github/pull_request_template.md](../.github/pull_request_template.md)** propose une checklist destinée principalement aux contributeurs humains, notamment pour vérifier les tests, les droits backend et la documentation API. | Aucun senseur inférentiel automatisé n'a été identifié. Les conversations de [docs/semaine-2/](./semaine-2/) sont des traces de travail et non un mécanisme automatique de revue ou d'analyse du code. |
| **Computationnel (règles ou calculs exécutables)** | Les configurations [backend/.oxlintrc.json](../backend/.oxlintrc.json) et [frontend/.oxlintrc.json](../frontend/.oxlintrc.json) définissent les règles Oxlint, par exemple l'interdiction de `any` et le contrôle des égalités avec `eqeqeq`.<br><br>Les configurations [backend/tsconfig.json](../backend/tsconfig.json) et [frontend/tsconfig.app.json](../frontend/tsconfig.app.json) imposent des contraintes de typage, notamment `strict` et `noUnusedLocals`. Elles orientent et contraignent le développement : ce sont des guides computationnels configurés. | **Oxlint** analyse le code et détecte les erreurs et mauvaises pratiques. **TypeScript** vérifie les types et détecte certaines erreurs de programmation. **Vitest** exécute les tests backend et frontend, notamment les routes API, les permissions et les composants React. La compilation et le build vérifient que le projet peut être compilé et produisent les fichiers `dist`. Enfin, `npm run check` orchestre le lint, le typecheck, les tests et le build. |

### Guides, senseurs et simples automatisations

Les scripts [backend/scripts/setupEnv.js](../backend/scripts/setupEnv.js), [backend/scripts/copyMigrations.js](../backend/scripts/copyMigrations.js), [backend/src/db/scripts/init.ts](../backend/src/db/scripts/init.ts) et [backend/src/db/scripts/reset.ts](../backend/src/db/scripts/reset.ts) automatisent des opérations techniques. Ils ne donnent pas de consignes à un agent et ne produisent pas de diagnostic sur le code ; ils ne sont donc classés ni comme guides ni comme senseurs.

Les éléments absents sont les suivants :

- aucun générateur de code applicatif dédié ;
- aucun senseur inférentiel automatisé ;
- aucun workflow GitHub Actions ou système CI/CD équivalent ;
- aucune revue de code assistée par IA automatisée.

Le projet dispose ainsi d'une base de vérification computationnelle solide, fondée sur Oxlint, TypeScript, Vitest et la compilation. Les rapports de la semaine 2 indiquent 126 tests backend et 50 tests frontend réussis, ainsi que des vérifications de lint, de typage et de compilation ; ces résultats n'ont pas été reproduits pendant l'exploration. Une revue de code automatisée assistée par IA constituerait une amélioration possible.

## Exercice 2 — Vérification des senseurs

### Périmètre et exigences

L'analyse porte sur les candidatures, en lien avec les exigences suivantes :

- **EF-32** : soumettre une candidature et pouvoir la retirer selon les règles métier ;
- **EF-33** : consulter ses candidatures et leurs statuts.

Le backend concerné comprend le contrôleur [applications.controller.ts](../backend/src/controllers/applications.controller.ts), le service [applications.service.ts](../backend/src/services/applications.service.ts), le repository [applications.repository.ts](../backend/src/repositories/applications.repository.ts) et le modèle [application.ts](../backend/src/models/application.ts). Les surfaces frontend sont [ApplicationsPage.tsx](../frontend/src/pages/ApplicationsPage.tsx), [ApplicationTable.tsx](../frontend/src/components/ApplicationTable.tsx), [useApplications.ts](../frontend/src/hooks/useApplications.ts), [applications.service.ts](../frontend/src/services/applications.service.ts) et [OfferTable.tsx](../frontend/src/components/OfferTable.tsx).

Les règles implémentées sont les suivantes : seuls les étudiants peuvent consulter, créer ou retirer une candidature ; l'étudiant est identifié par le jeton et non par un identifiant fourni par le client ; une candidature est possible uniquement pour une offre `PUBLISHED` ; une seule candidature est autorisée par étudiant et par offre, y compris après retrait ; le retrait est logique et affecte le statut `WITHDRAWN` ; une candidature traitée ne peut plus être retirée.

### Tests ajoutés

Les tests ajoutés concernent les trois fichiers suivants :

- [backend/tests/applications.test.ts](../backend/tests/applications.test.ts) : POST non authentifié, offre inexistante, isolation des candidatures entre étudiants, retrait déjà effectué et identifiant invalide ;
- [frontend/tests/ApplicationsPage.test.tsx](../frontend/tests/ApplicationsPage.test.tsx) : liste vide, statuts `SELECTED` et `REJECTED`, absence du bouton de retrait pour les statuts traités et annulation de la confirmation ;
- [frontend/tests/OffersPage.test.tsx](../frontend/tests/OffersPage.test.tsx) : soumission réussie, vérification du POST, du corps envoyé et du message de succès.

Aucun fichier de production n'a été modifié.

### Lacunes et limites de couverture

Avant ces ajouts, plusieurs cas étaient absents ou seulement partiellement couverts : offre inexistante, POST non authentifié, validation complète du corps, limite de 2 000 caractères, retrait déjà effectué, identifiant de retrait invalide, refus de confirmation côté interface, affichage des statuts `SELECTED` et `REJECTED`, accès GET d'un autre étudiant et liste vide. Les ajouts ont renforcé cette couverture, sans permettre d'affirmer que tous les cas possibles sont testés.

Certaines limites subsistent dans l'analyse de couverture :

- la validation complète du corps doit notamment considérer `offerId` nul, négatif ou décimal, un `message` non textuel et un message vide ou composé d'espaces ;
- le cas d'une soumission depuis l'interface est couvert, mais les différents scénarios d'erreur ne le sont pas tous ;
- les statuts et les comportements d'interface ne constituent pas une couverture exhaustive de toutes les combinaisons possibles ;
- la couverture des chemins d'erreur et des valeurs limites ne permet pas de conclure à l'absence de tout défaut.

### Résultats de `npm run check`

La commande `npm run check` s'est terminée avec le code de sortie `0` :

- lint backend et frontend : réussi, sans erreur ni avertissement ;
- typecheck backend et frontend : réussi ;
- tests backend : 131 réussis, 0 échoué, dans 10 fichiers ;
- tests frontend : 54 réussis, 0 échoué, dans 8 fichiers ;
- total : 185 tests réussis, 0 échoué ;
- build backend et frontend : réussi, avec 62 modules transformés côté frontend.

Ces résultats attestent du passage de la vérification globale dans l'état analysé ; ils ne signifient pas que les tests couvrent tous les cas fonctionnels possibles.

## Exercice 3 — Audit des guides

### Méthode et distinction des sources

La comparaison s'appuie sur les supports suivants :

- *18-jwt.pdf*, **Séance 19 — JSON Web Tokens**, 14 pages ;
- *19-encryption.pdf*, **Séance 20 — Chiffrement des mots de passe**, 10 pages ;
- *20-session.pdf*, **Séance 22 — Session et web storage**, 7 pages.

Le tableau distingue les attentes issues du cours des conventions propres au projet. Les valeurs de correspondance sont `Oui`, `Partielle`, `Non` et `Contradiction`.

| Attente ou convention de Web 2 (source) | Guide examiné (fichier et passage) | Correspondance | Écart ou ajout proposé |
|---|---|---|---|
| Générer un JWT avec `jwt.sign`, un secret et une durée d'expiration. Source : *18-jwt.pdf*, séance 19, p. 6, section « Génération et vérification de JWT » : `jwt.sign({ username }, jwtSecret, { expiresIn: jwtLifetime })`. | [AGENTS.md](../AGENTS.md), lignes 1-25 : aucune mention de génération JWT. | Non | Ajouter une consigne sur la génération d'un token signé et expirant. |
| Même attente. | [.github/copilot-instructions.md](../.github/copilot-instructions.md), ligne 78 : mention du jeton JWT, mais pas de `jwt.sign`, du secret ou de l'expiration. | Partielle | Préciser les éléments vérifiables : signature, secret externe et expiration. |
| Même attente. | [.github/pull_request_template.md](../.github/pull_request_template.md), lignes 9-16 : aucune vérification JWT explicite. | Non | Ajouter une case de vérification de génération et d'expiration du JWT si une authentification est modifiée. |
| Vérifier un JWT côté backend. Source : *18-jwt.pdf*, séance 19, p. 6 : appel à `jwt.verify(token, jwtSecret)` dans un `try/catch`. | Aucun des trois guides ne décrit explicitement `jwt.verify` ni la vérification d'un JWT. | Non | Ajouter cette règle dans le guide principal et dans la checklist de PR. |
| Envoyer le JWT dans l'en-tête d'autorisation pour les requêtes identifiées. Source : *18-jwt.pdf*, séance 19, p. 3 : le frontend envoie ce JWT dans le header d'autorisation. | [AGENTS.md](../AGENTS.md), lignes 16-20 : aucune mention. | Non | Ajouter la convention frontend/backend dans `AGENTS.md`. |
| Même attente. | [.github/copilot-instructions.md](../.github/copilot-instructions.md), ligne 78 : le jeton JWT est transmis directement dans l'en-tête `Authorization`. | Oui | La règle est correctement documentée. |
| Même attente. | [.github/pull_request_template.md](../.github/pull_request_template.md), lignes 9-16 : aucune mention du header `Authorization`. | Non | Ajouter une vérification des requêtes protégées. |
| Protéger les routes avec un middleware. Source : *18-jwt.pdf*, séance 19, p. 11, section « Middlewares » : le middleware lit le token, le vérifie, retrouve l'utilisateur et appelle `next()`. | [AGENTS.md](../AGENTS.md), ligne 10 : mention générale de l'architecture, mais pas de middleware d'authentification. | Partielle | Nommer explicitement le middleware d'authentification et son rôle. |
| Même attente. | [.github/copilot-instructions.md](../.github/copilot-instructions.md), lignes 46 et 77-79 : mention de `authenticate` et `authorize`, mais sans décrire le contrôle effectué par le middleware. | Partielle | Décrire la séquence : lecture, vérification, refus ou `next()`. |
| Même attente. | [.github/pull_request_template.md](../.github/pull_request_template.md), ligne 13 : contrôle des droits côté backend, sans mention du middleware JWT. | Partielle | Ajouter une vérification de protection effective des routes. |
| Retourner 401 lorsqu'il n'y a pas de token ou lorsqu'il est invalide. Source : *18-jwt.pdf*, séance 19, p. 11 : `sendStatus(401)` pour token absent, invalide ou utilisateur introuvable. | [AGENTS.md](../AGENTS.md), lignes 8-23 : aucune règle 401/403. | Non | Ajouter la distinction explicite entre absence d'authentification et refus d'autorisation. |
| Même attente. | [.github/copilot-instructions.md](../.github/copilot-instructions.md), lignes 67-69 : codes `UNAUTHENTICATED` (401) et `FORBIDDEN` (403) documentés. | Oui | La distinction est explicitement documentée. |
| Même attente. | [.github/pull_request_template.md](../.github/pull_request_template.md), ligne 12 : demande de tester les erreurs 401 et 403, sans expliquer leur signification. | Partielle | Indiquer que 401 concerne l'authentification absente ou invalide. |
| Retourner 403 lorsqu'un utilisateur authentifié n'a pas les droits. Source : *18-jwt.pdf*, séance 19, p. 11 : `isAdmin` retourne `403 Forbidden` lorsque l'utilisateur connecté n'est pas administrateur. | [AGENTS.md](../AGENTS.md), lignes 1-25 : aucune mention. | Non | Ajouter la règle d'autorisation et le statut attendu. |
| Même attente. | [.github/copilot-instructions.md](../.github/copilot-instructions.md), lignes 67-69 : `FORBIDDEN` (403) est explicitement listé. | Oui | Aucune correction indispensable. |
| Même attente. | [.github/pull_request_template.md](../.github/pull_request_template.md), lignes 12-13 : tests 403 et droits contrôlés côté backend. | Partielle | Ajouter une définition explicite de 403. |
| Associer l'utilisateur authentifié à la requête. Source : *18-jwt.pdf*, séance 19, p. 11 : `req.user = user` avant `next()`. | Aucun des trois guides ne mentionne explicitement l'association à `req.user`. | Non | Ajouter cette règle si le projet conserve ce mécanisme. |
| Utiliser bcrypt pour les mots de passe. Source : *19-encryption.pdf*, séance 20, p. 5, section « Librairie bcrypt » : installation et import de `bcrypt`. | Aucun des trois guides ne mentionne bcrypt. | Non | Ne pas ajouter cette règle comme comportement actuel : le projet n'utilise pas d'authentification par mot de passe. Ajouter plutôt une note d'inapplicabilité. |
| Hacher le mot de passe lors de l'inscription avec `await bcrypt.hash`. Source : *19-encryption.pdf*, séance 20, p. 8 : `const hashedPassword = await bcrypt.hash(...)` dans `register`. | Aucun des trois guides ne mentionne cette pratique. | Non | Documenter explicitement que l'inscription par mot de passe n'existe pas actuellement. |
| Comparer le mot de passe lors de la connexion avec `await bcrypt.compare`. Source : *19-encryption.pdf*, séance 20, p. 9 : `await bcrypt.compare(credentials.password, user.password)`. | Aucun des trois guides ne mentionne cette pratique. | Non | Même recommandation : préciser que cette attente est hors périmètre actuel. |
| Privilégier les opérations bcrypt asynchrones dans les requêtes. Source : *19-encryption.pdf*, séance 20, p. 6 : les variantes synchrones sont décrites comme trop longues en réaction à une requête. | Aucun des trois guides ne traite ce sujet. | Non | Ajouter cette règle uniquement si une authentification avec mot de passe est introduite. |
| Le stockage des mots de passe en clair est présenté comme un problème à corriger. Source : *19-encryption.pdf*, séance 20, p. 2 : « mots de passe stockés en clair dans la DB » et risques associés. | Aucun des trois guides ne mentionne les mots de passe en clair. | Non | Ajouter une note de périmètre : aucun mot de passe n'est utilisé ou stocké dans le mode démo actuel. |
| Gérer l'état de session dans React lors du login et du logout. Source : *20-session.pdf*, séance 22, p. 4, section « Exemple - login/logout » : `useState`, `setToken` lors du login et remise à `undefined` lors du logout. | [AGENTS.md](../AGENTS.md), ligne 18 : `useAuth` appelé exclusivement dans `App.tsx`, mais pas de cycle login/logout. | Partielle | Décrire le rôle de `useAuth` dans le cycle de session, sans présenter cette architecture propre au projet comme une exigence du cours. |
| Même attente. | [.github/copilot-instructions.md](../.github/copilot-instructions.md), lignes 94-96 : `useAuth`, `onLogout` et `onUnauthorized` sont documentés. | Oui | La gestion de session est suffisamment couverte, même si `useAuth` exclusivement dans `App.tsx` est une convention propre au projet. |
| Même attente. | [.github/pull_request_template.md](../.github/pull_request_template.md), lignes 9-16 : aucune mention du login/logout frontend. | Non | Ajouter une vérification de connexion, déconnexion et retour à l'état non authentifié. |
| Stocker, récupérer et supprimer une donnée avec Web Storage. Source : *20-session.pdf*, séance 22, p. 6, section « Web Storage API » : `setItem`, `getItem`, `removeItem`, `localStorage` et `sessionStorage`. | Aucun des trois guides ne mentionne Web Storage, `localStorage` ou `sessionStorage`. | Non | Documenter le mécanisme de stockage réellement choisi par le projet. |
| Récupérer une session existante au démarrage, stocker le token au login et le supprimer au logout. Source : *20-session.pdf*, séance 22, p. 7, section « Récupérer une session » : `localStorage.getItem`, `setItem` au login et `removeItem` au logout. | Aucun des trois guides ne décrit ce cycle complet. | Non | Ajouter une règle frontend couvrant restauration, sauvegarde et suppression du token. |
| Transmettre le token aux requêtes protégées. Source : *20-session.pdf*, séance 22, p. 5, section « Exemple - Utilisation du token » : `headers: { 'Authorization': token }`. | [.github/copilot-instructions.md](../.github/copilot-instructions.md), ligne 78 : l'en-tête `Authorization` est documenté. | Oui | La convention est couverte, mais le guide pourrait préciser qu'elle concerne toutes les requêtes protégées. |
| Même attente. | [AGENTS.md](../AGENTS.md) et [.github/pull_request_template.md](../.github/pull_request_template.md) : aucune mention explicite. | Non | Dupliquer cette règle dans `AGENTS.md` ou renvoyer clairement au guide principal. |

### Constats sur l'implémentation et recommandations

Ces constats ne prouvent pas que les guides documentent les pratiques :

- la génération et la vérification JWT sont implémentées dans `token.ts` ;
- le middleware lit l'en-tête `Authorization` dans `authenticate.ts` ;
- les routes sont protégées dans `app.ts` ;
- le frontend conserve le token dans `localStorage` via `storage.ts` ;
- le cycle login/logout est géré par `useAuth.ts` ;
- aucun `bcrypt`, champ de mot de passe, inscription par mot de passe ou comparaison de mot de passe n'a été retrouvé ; [backend/API.md](../backend/API.md) décrit explicitement un mode démo sans mot de passe.

Les recommandations sont les suivantes :

1. compléter [.github/copilot-instructions.md](../.github/copilot-instructions.md) avec la génération, la vérification et le middleware JWT ;
2. ajouter dans [AGENTS.md](../AGENTS.md) un résumé des règles JWT et session ;
3. compléter la checklist de PR avec des vérifications ciblées : absence de token, token invalide, 401, 403, header `Authorization`, login, logout et restauration de session ;
4. documenter l'inapplicabilité de bcrypt dans le contexte actuel ;
5. ne pas ajouter HS256, le contenu minimal du payload ou le rechargement des rôles comme exigences Web 2 : ces éléments sont des choix techniques du projet et non des exigences démontrées par les supports retenus.

En synthèse, la transmission du JWT dans `Authorization`, la distinction 401/403 et la gestion générale de session React sont documentées, principalement dans [.github/copilot-instructions.md](../.github/copilot-instructions.md). Les détails de `jwt.sign` et `jwt.verify`, le déroulement précis du middleware, l'utilisation de Web Storage, la restauration et la suppression du token, ainsi que bcrypt, le hachage à l'inscription et la comparaison à la connexion, sont absents des guides. Aucune contradiction explicite avec les supports Web 2 n'a été retrouvée.
