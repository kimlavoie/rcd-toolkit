// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

Cypress.Commands.add('login', () => {
  const user = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User'
  };
  localStorage.setItem('cypress-user', JSON.stringify(user));
  
  // Inject empty arrays for all collections to stop "Chargement..."
  const collections = [
    'enseignants', 'cours', 'groupes', 'allocations', 
    'liberations', 'stages', 'supervisions', 'charges', 
    'CIReelles', 'scenarios'
  ];
  
  collections.forEach(col => {
    localStorage.setItem(`cypress-db-${col}`, '[]');
  });

  // Inject some base data for testing
  localStorage.setItem('cypress-db-scenarios', JSON.stringify([{ id: 'production', nom: 'Production', session: 'A26', isDefault: true }]));
});

Cypress.Commands.add('logout', () => {
  localStorage.removeItem('cypress-user');
});
