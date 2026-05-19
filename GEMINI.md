# Project Mandates

## Security
- **Strict Environment Isolation:** Access to any `.env*` files for reading or writing is strictly prohibited. These files contain sensitive credentials and must never be processed by the agent.
- **Ignore Patterns:** The `.geminiignore` file has been configured to explicitly hide `.env*` files from all search and read tools.

## Architecture
- **Firebase First:** The application has been migrated from Dexie (local) to Firebase (cloud). All new features must use Firestore for data persistence and Firebase Authentication for security.
- **Authentication:** All routes must be protected by the `useAuth` hook.
