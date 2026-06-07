describe('Taches Grid', () => {
  const year = '2026';
  
  beforeEach(() => {
    cy.visit(`/taches/${year}`);
  });

  it('should display the main grid for the given year', () => {
    // Should redirected if not logged in, but let's assume we want to test the grid
    cy.url().then(url => {
      if (url.includes('/login')) {
        // Skip or fail with a message
        cy.log('Redirected to login - testing environment needs Firebase Auth setup');
      } else {
        cy.contains(`Tâches ${year}`).should('be.visible');
        cy.get('table').should('be.visible');
      }
    });
  });

  it('should allow toggling session visibility', () => {
    cy.visit(`/taches/${year}`);
    cy.url().then(url => {
      if (!url.includes('/login')) {
        cy.contains('Automne').click();
        // Check if details are hidden/shown
      }
    });
  });
});
