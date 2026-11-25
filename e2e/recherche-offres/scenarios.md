# Scénarios E2E — Recherche d'offres EF-30

## scénario 1 — Recherche avec résultat

### État initial

- L'étudiant est connecté.

### Données nécessaires

- L'offre « API REST de facturation » existe avec le statut `PUBLISHED`.
- Il existe également au moins une offre non publiée, afin de vérifier la visibilité étudiant.

### Actions dans l'interface

1. Dans le champ « Rechercher par titre », saisir `API REST`.

### Résultats observables attendus

- L'offre « API REST de facturation » apparaît dans la liste.
- Son statut est affiché « Publiée ».
- Aucune offre non publiée n'apparaît dans la liste de l'étudiant.

## scénario 2 — Recherche sans résultat

### État initial

- L'étudiant est connecté.

### Données nécessaires

- Des offres publiées sont accessibles à l'étudiant.
- Aucune offre publiée accessible à l'étudiant ne contient l'expression `titre inexistant`.

### Actions dans l'interface

1. Dans le champ « Rechercher par titre », saisir `titre inexistant`.

### Résultats observables attendus

- Aucune ligne d'offre n'est affichée.
- Le message « Aucune offre ne correspond à la recherche. » est affiché.
