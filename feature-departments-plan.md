# Plan : Départements, Rôles et Firebase Admin SDK

## 1. Objectif
Migrer l'architecture actuelle (mono-utilisateur) vers un système collaboratif (multi-locataire) basé sur des **départements**. L'accès et les permissions seront gérés via des **rôles** (Admin, Coordonnateur, Enseignant) sécurisés par Firebase Custom Claims à l'aide de Firebase Admin SDK et des routes API Next.js.

## 2. Rôles et Permissions
*   **Administrateur (Super Admin)** : 
    *   Unique ou restreint. N'est lié à aucun département (`departementId: null`).
    *   Peut créer, modifier et supprimer des Départements.
    *   Peut créer des Coordonnateurs et les assigner à un département.
*   **Coordonnateur** :
    *   Lié à un département spécifique.
    *   Possède un accès complet (lecture/écriture) sur toutes les données de son département (cours, groupes, tâches, etc.).
    *   Peut gérer la liste des enseignants de son département et leur créer des comptes d'accès.
*   **Enseignant** :
    *   Lié à un département spécifique.
    *   Accès en **lecture seule** au tableau des tâches. Ne peut accéder aux pages d'administration.

## 3. Modèle de Données et Sécurité (Phase 1)
*   **Schémas (`app/db/schemas.ts`, `app/db/db.ts`)** :
    *   Création de l'interface `Departement` (`{ id, nom }`).
    *   Remplacement de la propriété implicite `userId` par `departementId` sur **toutes** les entités métier (Cours, Groupes, Charges, etc.).
*   **Sécurité (`firestore.rules`)** :
    *   Les règles seront basées sur les Custom Claims : `request.auth.token.role` et `request.auth.token.departementId`.
    *   Exemple : `allow read: if request.auth.token.departementId == resource.data.departementId;`
    *   Exemple (écriture) : `allow write: if request.auth.token.departementId == resource.data.departementId && request.auth.token.role == 'COORDONNATEUR';`

## 4. Backend API & Admin SDK (Phase 2)
*   **Installation** : Ajout du package `firebase-admin`.
*   **Configuration** : Création d'un utilitaire `app/utilities/firebaseAdmin.ts` pour initialiser le SDK serveur avec les clés de service (via variables d'environnement).
*   **Routes API (Next.js)** :
    *   `POST /api/admin/departements` : Création de départements (Admin seulement).
    *   `POST /api/admin/users` : Création d'utilisateurs via Auth et définition immédiate des Custom Claims.
    *   `PUT /api/admin/users/claims` : Mise à jour des rôles d'un utilisateur existant.

## 5. Mise à jour du Frontend (Phase 3)
*   **Contexte Auth (`useAuth`)** : Mettre à jour le hook pour récupérer et décoder le token Firebase (`user.getIdTokenResult()`) afin d'exposer le rôle et le `departementId` actuel à l'application React.
*   **BaseService (`app/services/BaseService.ts`)** : 
    *   Lors de l'ajout de données (`add`), injecter automatiquement le `departementId` de l'utilisateur connecté au lieu de son `uid`.
*   **Hooks de requêtes (`useFirestoreCollection`)** :
    *   Modifier les requêtes pour utiliser `where("departementId", "==", userClaims.departementId)`.

## 6. Interface Utilisateur (Phase 4)
*   **Nouveau Dashboard Super Admin (`/admin/super`)** : 
    *   Réservé aux Administrateurs pour la gestion des départements et l'assignation des coordonnateurs.
*   **Gestion des enseignants (`/admin/enseignants`)** :
    *   Ajout d'un bouton pour "Créer un accès" permettant au Coordonnateur de générer un compte (email/mot de passe par défaut) pour un enseignant via l'API.
*   **Verrouillage UI** :
    *   Masquer les boutons d'édition (crayons, suppression, drag & drop) dans la grille des tâches si `role === 'ENSEIGNANT'`.
    *   Rediriger l'enseignant s'il tente d'accéder à une route `/admin/*`.

## 7. Plan de Migration (Phase 5)
*   Créer un script temporaire (ou une API Route sécurisée) pour prendre les données de l'utilisateur actuel, créer un "Département par défaut", définir cet utilisateur comme Coordonnateur, et mettre à jour tous ses documents existants en remplaçant `userId` par le nouveau `departementId`.

## Vérification
*   Valider qu'un utilisateur Enseignant ne peut faire aucune modification via l'interface ou directement via l'API Firebase (bloqué par `firestore.rules`).
*   Valider que deux départements différents ne voient jamais leurs données respectives.
