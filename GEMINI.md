# Project Mandates

## Security
- **Strict Environment Isolation:** Access to any `.env*` files for reading or writing is strictly prohibited. These files contain sensitive credentials and must never be processed by the agent.
- **Ignore Patterns:** The `.geminiignore` file has been configured to explicitly hide `.env*` files from all search and read tools.
- **Firestore Rules:** Security is enforced via `firestore.rules`. Any new collection must include a `userId` field, and the rules must be updated if specific access logic is required. Use `firebase deploy --only firestore:rules` to update rules in production.

## Architecture
- **Firebase First:** The application has been migrated from Dexie (local) to Firebase (cloud). All new features must use Firestore for data persistence and Firebase Authentication for security.
- **Authentication:** All routes must be protected by the `useAuth` hook.

## Workflow
- **Build Verification:** ALWAYS run `npm run build` after making significant code changes to ensure no TypeScript or Next.js compilation errors were introduced. Validation is incomplete without a successful build.
- **Test Validation:** ALWAYS ensure that all existing and new tests pass (unit, component, and E2E) before considering a request or a code change as finished. Run `npm run test:unit`, `npx cypress run --component`, and `npx cypress run --e2e` to verify.
- **Test Generation:** Whenever you add a new feature, component, or significantly modify existing business logic, you MUST generate the corresponding tests (unit, component, or E2E as appropriate) to ensure the behavior is verified and to proactively increase the overall test coverage.
