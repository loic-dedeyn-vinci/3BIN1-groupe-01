## Audit des tests — Candidatures (EF-32 et EF-33)

L’audit a été réalisé avec le skill `test-gap-audit`. Les fichiers sources et les tests existants ont été examinés afin de vérifier les lacunes de couverture.

### Tableau des constats vérifiés

| Constat initial | Vérification | Action réalisée |
|---|---|---|
| L'accès ADMIN à la création d'une candidature n'était pas testé. | Aucun test ne vérifiait le refus d'un ADMIN sur la route POST. | Ajout d'un test vérifiant une réponse HTTP 403. |
| L'accès ADMIN au retrait d'une candidature n'était pas testé. | Aucun test ne vérifiait le refus d'un ADMIN sur la route DELETE. | Ajout d'un test vérifiant une réponse HTTP 403. |
| Le message facultatif n'était pas suffisamment testé. | Les cas absent, vide et composé d'espaces n'étaient pas couverts. | Ajout de trois tests vérifiant l'acceptation et la normalisation en `null`. |
| Les types et longueurs invalides du message n'étaient pas testés. | Aucun test ne vérifiait un message numérique ou dépassant 2 000 caractères. | Ajout de deux tests vérifiant une réponse HTTP 400 avec `INVALID_BODY`. |
| Le chargement des candidatures en cas de session expirée n'était pas testé. | Aucun test ne vérifiait le comportement lors d'une réponse HTTP 401. | Ajout d'un test vérifiant l'appel de `onUnauthorized`. |
| Les erreurs lors du retrait d'une candidature n'étaient pas testées. | Les réponses HTTP 409 et 500 n'étaient pas couvertes. | Ajout de deux tests vérifiant l'affichage d'une alerte. |

### Tests ajoutés ou améliorés

**Backend — `backend/tests/applications.test.ts`**

Sept tests ont été ajoutés :
- Deux tests sur les autorisations ADMIN (POST et DELETE).
- Trois tests sur les messages absents, vides ou composés d'espaces.
- Deux tests sur les messages invalides (type numérique et longueur supérieure à 2 000 caractères).

**Frontend — `frontend/tests/ApplicationsPage.test.tsx`**

Trois tests ont été ajoutés :
- Un test sur l'expiration de session (HTTP 401).
- Un test sur l'erreur HTTP 409 lors du retrait.
- Un test sur l'erreur HTTP 500 lors du retrait.

Les tests frontend vérifient également que les erreurs sont affichées dans un élément accessible avec le rôle `alert`.

### Résultat de la vérification

Après les modifications, les vérifications complètes ont réussi :
- Backend : 138 tests réussis.
- Frontend : 57 tests réussis.
- Lint et Typecheck : OK.
- Build backend et frontend : OK.

**Bilan :** dix tests ont été ajoutés à la suite de l'audit : sept côté backend et trois côté frontend. Les lacunes identifiées ont ainsi été couvertes.

## TDD – Recherche d'offres EF-30

Avant de commencer l'implémentation, Copilot a automatiquement chargé le skill `test-driven-development`. Il a préparé des tests pour le backend et le frontend, puis les a exécutés avant de modifier le code de l'application.

Les premiers résultats étaient les suivants :

- **Backend :** 20 tests réussis et 3 nouveaux tests échoués, car le paramètre de recherche `q` n'était pas encore pris en compte par l'API.
- **Frontend :** 8 tests réussis et 2 nouveaux tests échoués, car le champ de recherche n'existait pas encore dans l'interface.

Ces échecs étaient cohérents avec le comportement attendu : la fonctionnalité de recherche n'était pas encore implémentée.

Copilot m'a ensuite présenté les tests et m'a demandé mon accord avant de commencer l'implémentation.

J'ai trouvé cette étape importante, car elle permet de vérifier que les tests correspondent bien au besoin avant de laisser l'agent modifier le code. Les tests proposés couvraient les principaux comportements attendus et permettaient de vérifier que la fonctionnalité manquante était bien à l'origine des échecs.

Après validation, Copilot a implémenté la recherche et relancé les tests. Les tests backend et frontend sont alors passés. Cela correspond au cycle TDD : écrire les tests, observer leur échec, implémenter la fonctionnalité, puis vérifier leur réussite.

## Recherche – Cas essayés et vérifications

La recherche d'offres EF-30 a été ajoutée dans le titre des offres.

Les comportements suivants ont été pris en compte :

- Recherche d'un texte présent dans le titre d'une offre.
- Recherche insensible aux majuscules et aux minuscules.
- Suppression des espaces au début et à la fin du texte recherché.
- Affichage normal des offres accessibles lorsque le champ de recherche est vide.
- Affichage d'une liste vide et d'un message adapté lorsqu'aucune offre ne correspond.
- Combinaison de la recherche avec le filtre par période.
- Conservation des règles de visibilité : un étudiant ne voit que les offres publiées.
- Recherche de plusieurs mots comme une expression entière.

J'ai également essayé la recherche dans le navigateur et constaté qu'elle fonctionnait.

### Résultat de `npm run check`

D'après les résultats de la vérification effectuée par Copilot, la commande `npm run check` s'est terminée avec succès.

Les vérifications annoncées sont :

- Lint : réussi.
- Vérification des types : réussie.
- Tests backend : 142 réussis.
- Tests frontend : 59 réussis.
- Build : réussi.

Cela représente 201 tests réussis au total.

### Problèmes restants

Pendant l'implémentation, une erreur de syntaxe SQL liée à l'échappement du caractère utilisé dans la recherche `LIKE` a été rencontrée. Copilot l'a corrigée en reprenant le mécanisme déjà utilisé pour la recherche des entreprises.

Après cette correction, les tests backend et frontend ainsi que `npm run check` ont été annoncés comme réussis.

Au moment de la rédaction, aucun problème bloquant n'a été constaté lors de mon essai de la recherche dans le navigateur.