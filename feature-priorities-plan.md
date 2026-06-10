# Plan : Gestion des Priorités et Intérêts

## Objectif
Ajouter la gestion des priorités (Absolue, Ordinaire) et des intérêts pour les cours, permettant une meilleure planification des tâches des enseignants.

## Contexte et Motivation
Les départements doivent souvent jongler avec les préférences des enseignants. L'application doit permettre :
- Une **priorité absolue** (à vie, une par enseignant).
- Des **priorités ordinaires** (durée configurable, max deux par enseignant).
- Des **intérêts** simples pour des cours (sans limite).
Ces informations doivent être visibles lors de l'attribution des tâches.

## Portée et Impact
Ce changement est transversal et touche :
- **Modèle de données** : Ajout de collections `preferences` et `parametres`.
- **Services (DAL)** : Nouveaux services d'accès aux données.
- **UI Admin** : Nouvelles pages pour les paramètres globaux et les préférences individuelles.
- **UI Tâches** : Mise à jour de la grille pour afficher des marqueurs visuels (ex: 🌟, ⭐, ❤️).

## Solution Proposée

### 1. Modèle de données (Schémas Zod & Types)
*   **Collection `parametres`** : Un seul document (ID "global") pour stocker `dureePrioriteOrdinaire` (par défaut 4).
*   **Collection `preferences`** : Stocke un lien `{ id, enseignant, cours, type: 'ABSOLUE' | 'ORDINAIRE' | 'INTERET', anneeObtention: number }`.

### 2. Services d'Accès aux Données (DAL)
*   Création de `PreferenceService` et `ParametreService` étendant `BaseService`.
*   Validation stricte pour empêcher plus d'une priorité absolue ou plus de deux ordinaires par enseignant côté interface.

### 3. Interface Utilisateur - Administration
*   **`/admin/parametres`** : Nouvelle page pour définir la durée en années des priorités ordinaires.
*   **`/admin/enseignants`** : Ajout d'un bouton "⭐ Préférences" pour chaque enseignant.
*   **`/admin/enseignants/[id]/preferences`** : Page dédiée. Interface intuitive pour ajouter/retirer des cours dans les 3 catégories. Saisie de `anneeObtention` obligatoire pour les priorités ordinaires.

### 4. Interface Utilisateur - Tâches (Grille)
*   Dans `DataContext.tsx`, charger les `preferences` et `parametres`.
*   Dans `Charge.tsx` (composant qui affiche le cours pour un enseignant) :
    *   Croiser les données pour voir si l'enseignant assigné a une préférence.
    *   Si Ordinaire, vérifier l'expiration : `(anneeActuelle - anneeObtention) <= dureePrioriteOrdinaire`.
    *   Afficher un badge discret mais clair sur la carte du cours.

## Alternatives Considérées
*   *Stocker dans `Enseignant`* : Rejeté pour éviter d'alourdir le document enseignant et faciliter les requêtes complexes futures (ex: "qui a une priorité absolue sur le cours X").
*   *Fichier de configuration local* : Rejeté car le client préfère une page "Paramètres Globaux" administrable depuis l'interface.

## Plan d'Implémentation (Phases)
1.  **Phase 1 : Data Model & Services**. Mettre à jour `schemas.ts`, `db.ts`, créer les services et mettre à jour `firebaseDb.ts` et `index.ts`.
2.  **Phase 2 : Paramètres Globaux**. Créer la route `/admin/parametres` et la lier au menu Admin.
3.  **Phase 3 : Préférences Enseignant**. Créer `/admin/enseignants/[id]/preferences`.
4.  **Phase 4 : Grille des Tâches**. Injecter les marqueurs visuels dans `Charge.tsx` et mettre à jour `useTacheData.ts` / `DataContext.tsx`.
5.  **Phase 5 : Tests**. Écrire des tests unitaires et E2E.

## Vérification
*   Vérifier que la limite des priorités est respectée dans l'UI.
*   Vérifier que le calcul d'expiration de la priorité ordinaire fonctionne.
*   Lancer `npm run build` et toute la suite Cypress.
