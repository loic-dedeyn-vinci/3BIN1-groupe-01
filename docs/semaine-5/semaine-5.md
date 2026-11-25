## 2. Tester un scénario avec Playwright MCP

### Préparation

Le serveur Playwright MCP a été démarré localement depuis la racine du projet avec la commande :

```bash
npx -y @playwright/mcp@latest --isolated --port 8931
```

Le serveur était accessible à l'adresse `http://localhost:8931`.

Le fichier `.mcp.json` a été configuré à la racine du projet pour permettre à GitHub Copilot, en mode Agent, de se connecter au serveur Playwright MCP.

Le backend et le frontend ont été démarrés. L'application a été vérifiée manuellement avant l'exécution du scénario.

### Scénario exécuté

**Scénario 1 — Recherche avec résultat**

Le scénario a été exécuté avec GitHub Copilot en mode Agent, en utilisant les outils du serveur Playwright MCP.

L'utilisateur de démonstration utilisé était Lucas Dupont, avec le rôle étudiant.

Les opérations réalisées étaient les suivantes :

1. Ouverture de l'application locale à l'adresse `http://localhost:5173`.
2. Connexion en tant qu'étudiant Lucas Dupont.
3. Accès à la rubrique « Offres ».
4. Observation de la liste initiale des offres.
5. Saisie de `API REST` dans le champ « Rechercher par titre ».
6. Observation des résultats après la recherche.

### Appels d'outils MCP observés

Plusieurs appels d'outils Playwright MCP ont été observés dans la conversation avec Copilot.

**Appel 1 — `playwright-browser_navigate`**

- Action : navigation vers `http://localhost:5173`.
- Observation retournée : l'application locale est accessible et le titre de la page est « Gesta ».

**Appel 2 — `playwright-browser_snapshot`**

- Action : observation de la page des offres avant la recherche.
- Observation retournée : l'utilisateur connecté est Lucas Dupont, avec le rôle étudiant. Quatre offres sont affichées et chacune présente le statut « Publiée ».

**Appel 3 — `playwright-browser_type`**

- Action : saisie du texte `API REST` dans le champ « Rechercher par titre ».
- Observation retournée : l'outil confirme la saisie du texte dans le champ correspondant.

**Appel 4 — `playwright-browser_snapshot`**

- Action : nouvelle observation de la page après la recherche.
- Observation retournée : une seule offre apparaît, intitulée « API REST de facturation », appartenant à l'entreprise Orbis. Son statut est « Publiée ».

Des appels `playwright-browser_click` ont également été observés pour la connexion de l'étudiant et l'accès à la rubrique « Offres ».

### Résultat du scénario

Le scénario 1 est considéré comme réussi.

Les observations du navigateur confirment que :

- L'application est accessible.
- L'étudiant peut accéder à la liste des offres.
- La recherche `API REST` est effectuée.
- L'offre « API REST de facturation » apparaît dans les résultats.
- Son statut affiché est « Publiée ».
- Une seule offre correspondante est affichée après la recherche.

Une capture d'écran du navigateur a également permis de confirmer visuellement le résultat.

### Limite de vérification

Le snapshot initial présentait quatre offres, toutes avec le statut « Publiée ».

Il n'a donc pas été possible de démontrer, à partir des seules observations disponibles, que des offres non publiées existaient dans les données sous-jacentes et qu'elles étaient effectivement masquées pour l'étudiant.

Cette vérification reste donc non concluante.

### Conclusion

L'utilisation de Playwright MCP a permis à GitHub Copilot de piloter réellement le navigateur et d'interagir avec l'application à travers des outils de navigation, de clic, de saisie et d'observation.

Le scénario 1 a été exécuté avec succès, et les résultats observés confirment le bon fonctionnement de la recherche d'offres dans l'application.

Le scénario 1 a été exécuté avec succès. Les appels d'outils MCP et leurs observations ont été examinés pour justifier le résultat.

# Étape 3 --- Tests automatisés avec Playwright Test

## 3.1. Fichiers Playwright concernés

-   `e2e/recherche-offres/recherche-offres.spec.ts` --- fichier
    contenant les deux tests E2E. Il était déjà présent au début de
    cette étape et n'a pas été modifié pendant les exécutions
    rapportées.
-   `playwright.config.ts` --- configuration existante : dossier `e2e`,
    URL de base `http://localhost:5173` et projets Chromium, Firefox et
    WebKit. Le démarrage automatique du serveur (`webServer`) est
    commenté.
-   `package.json` et `package-lock.json` --- Playwright est déjà
    présent comme dépendance de développement. Aucun script npm
    Playwright dédié n'est configuré.
-   `.gitignore` --- configuration existante permettant d'ignorer les
    résultats Playwright.

**Remarque :** aucun code applicatif n'a été modifié. Les autres
fichiers mentionnés étaient déjà modifiés ou non suivis avant cette
étape.

## 3.2. Principales assertions

Les tests utilisent plusieurs assertions Playwright (`expect`) pour
vérifier le comportement de la recherche d'offres.

-   `expectStudentOffersToBePublished` : vérifie qu'il existe au moins
    une offre dans la liste et que le statut de chaque ligne visible est
    `Publiée`.
-   **Scénario 1 --- Recherche d'une offre existante :**
    -   Vérifie que l'offre « API REST de facturation » est visible.
    -   Vérifie que son statut est « Publiée ».
    -   Vérifie qu'après filtrage, la table ne contient qu'une seule
        ligne de résultat, en plus de l'en-tête.
-   **Scénario 2 --- Recherche sans résultat :**
    -   Vérifie que la table disparaît lorsqu'aucune offre ne correspond
        à la recherche.
    -   Vérifie l'affichage du message exact : « Aucune offre ne
        correspond à la recherche. »

Les interactions utilisent des sélecteurs basés sur les rôles et les
noms accessibles, notamment : - Le bouton « Lucas Dupont ». - Le lien «
Offres ». - Le champ « Rechercher par titre ».

## 3.3. Première exécution --- Tous les navigateurs configurés

**Commande exécutée :**

``` bash
npx playwright test e2e/recherche-offres/recherche-offres.spec.ts --reporter=list
```

**Résultat réel :**

  Navigateur     Tests réussis   Tests échoués
  ------------ --------------- ---------------
  Chromium                   2               0
  Firefox                    2               0
  WebKit                     0               2
  **Total**              **4**           **2**

-   6 tests exécutés.
-   4 tests réussis.
-   2 tests échoués.
-   0 test ignoré.

**Cause des échecs :**

WebKit n'a pas pu démarrer en raison de dépendances système manquantes :

-   `libicu74`
-   `libjpeg-turbo8`
-   `libmanette-0.2-0`

La tentative d'installation des dépendances système avec
`sudo -A npx playwright install-deps webkit` a échoué.

Ces échecs sont liés à l'environnement système nécessaire au lancement
de WebKit, et non à une assertion échouée ou à un comportement incorrect
observé dans l'application.

## 3.4. Deux exécutions successives --- Chromium et Firefox

Afin de vérifier la stabilité des tests sur les navigateurs
fonctionnels, les deux exécutions suivantes ont été réalisées
successivement, sans modification entre les deux.

**Commande exécutée :**

``` bash
npx playwright test e2e/recherche-offres/recherche-offres.spec.ts --project=chromium --project=firefox --reporter=list
```

**Résultats :**

  Exécution              Tests réussis   Tests échoués   Tests ignorés
  -------------------- --------------- --------------- ---------------
  Première exécution                 4               0               0
  Deuxième exécution                 4               0               0

**Bilan :** - Les deux scénarios passent sur Chromium. - Les deux
scénarios passent sur Firefox. - Les résultats sont identiques lors des
deux exécutions successives. - Aucun échec ni test ignoré n'a été
constaté.

Ces résultats confirment la reproductibilité des tests sur les deux
navigateurs concernés.

## 3.5. Vérification avec `npm run check`

**Commande exécutée :**

``` bash
npm run check
```

**Résultat : SUCCÈS**

L'ensemble des vérifications du projet s'est terminé sans erreur.

  Vérification                      Résultat
  --------------------------------- ----------
  Lint                              Réussi
  Vérification des types backend    Réussie
  Vérification des types frontend   Réussie
  Tests backend                     Réussis
  Tests frontend                    Réussis
  Build backend                     Réussi
  Build frontend                    Réussi

**Détail des tests :**

-   Backend : 10 fichiers de tests, 142 tests réussis.
-   Frontend : 8 fichiers de tests, 59 tests réussis.
-   Aucune erreur signalée.

**Important :** `npm run check` ne lance pas les tests Playwright. Les
tests E2E ont donc été exécutés séparément.

## 3.6. Conclusion générale

Les tests automatisés Playwright permettent de vérifier le bon
fonctionnement de la recherche d'offres, notamment la recherche d'une
offre existante et le comportement lorsqu'aucun résultat ne correspond
aux critères.

Les deux scénarios ont été exécutés avec succès à deux reprises sur
Chromium et Firefox. Les résultats identiques confirment la stabilité et
la reproductibilité des tests dans ces deux navigateurs.

La commande `npm run check` s'est également terminée avec succès. Les
vérifications du lint, des types, des tests backend et frontend ainsi
que les builds sont toutes passées.

**Limites identifiées :**

-   WebKit n'a pas pu être testé en raison de dépendances système
    manquantes sur l'environnement d'exécution.
-   Les tests utilisent le serveur local et sa base de démonstration
    existante. Ils ne créent pas et n'isolent pas leurs propres données.
-   La configuration Playwright ne démarre pas automatiquement le
    serveur puisque l'option `webServer` est commentée.

**Bilan :** les tests E2E sont fonctionnels et reproductibles sur
Chromium et Firefox. La vérification globale du projet est réussie. La
validation complète sur les trois navigateurs reste à effectuer après
résolution des dépendances système nécessaires à WebKit.

## 4. Vérifier la qualité des tests et comparer les approches

### 4.1. Vérification de la qualité des tests

Pour vérifier que les tests E2E détectent réellement un défaut dans l'application, nous avons choisi le scénario 1 : la recherche d'une offre existante.

Ce scénario vérifie :
- La visibilité de l'offre « API REST de facturation ».
- La présence du statut « Publiée ».
- Le nombre de résultats affichés après filtrage.

**Défaut temporaire introduit**

Nous avons temporairement désactivé le filtrage des offres par titre dans le code applicatif. Ce défaut avait pour objectif de simuler un dysfonctionnement de la fonctionnalité de recherche : les offres ne correspondant pas au texte saisi pouvaient également apparaître dans les résultats.

**Échec du test**

Après l'introduction du défaut, nous avons relancé le test automatisé du scénario 1 avec Playwright Test.

Le test a détecté le problème au niveau de la vérification du nombre de résultats. Le comportement obtenu ne correspondait plus au résultat attendu : seule l'offre recherchée devait être affichée.

Cet échec montre l'intérêt des assertions explicites, qui permettent de détecter une régression fonctionnelle et pas seulement de vérifier que la page se charge correctement.

**Restauration du code initial**

Nous avons ensuite restauré le code applicatif initial afin de supprimer le défaut temporaire.

Le test du scénario 1 a été relancé après cette restauration. Le comportement normal de la recherche a été rétabli et le test a retrouvé son résultat positif.

**Bilan**

Cette vérification illustre l'intérêt des tests E2E : un test pertinent doit être capable de détecter une régression fonctionnelle, puis de réussir à nouveau lorsque le code est restauré.

Aucun défaut temporaire ne doit être conservé dans la version finale de l'application.

### 4.2. Comparaison entre Playwright MCP et Playwright Test

**1. Que permet Playwright MCP dans la conversation avec l'agent ? Quelle action précise avez-vous vu passer par un outil MCP ?**

Playwright MCP permet à Copilot d'interagir directement avec le navigateur pour tester l'application, notamment en naviguant, cliquant et saisissant du texte. Nous avons observé l'utilisation de `browser_navigate` pour ouvrir l'application et de `browser_snapshot` pour observer son contenu.

**2. Qu'apportent les scripts Playwright Test que le compte rendu d'un test par MCP n'apporte pas ?**

Les scripts Playwright Test permettent de conserver des tests automatisés, reproductibles et versionnés. Ils peuvent être exécutés indépendamment de l'agent IA et intégrés dans une chaîne CI/CD. Ils fournissent également des assertions explicites permettant de vérifier précisément les résultats attendus.

**3. Dans quel cas préféreriez-vous une exploration interactive avec MCP ? Dans quel cas préféreriez-vous un test automatisé ?**

MCP est préférable pour explorer une fonctionnalité, découvrir le comportement de l'application ou investiguer un problème de manière interactive. Les tests automatisés sont préférables pour vérifier régulièrement et de manière reproductible le bon fonctionnement des fonctionnalités, notamment après des modifications du code.

**Conclusion**

Les deux approches sont complémentaires. MCP permet à l'agent d'interagir avec l'application, tandis que Playwright Test permet de conserver des vérifications exécutables indépendamment de l'agent. Le serveur MCP ne remplace donc pas une suite de tests automatisés.