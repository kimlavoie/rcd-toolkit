describe('Authentication & Route Protection', () => {
  it('should redirect to login if accessing /taches unauthenticated', () => {
    cy.visit('/taches');
    cy.url().should('include', '/login');
  });

  it('should redirect to login if accessing /taches/[year] unauthenticated', () => {
    cy.visit('/taches/2026');
    cy.url().should('include', '/login');
  });

  it('should redirect to login if accessing /admin unauthenticated', () => {
    cy.visit('/admin');
    cy.url().should('include', '/login');
  });

  it('should show login options', () => {
    cy.visit('/login');
    cy.contains('Se connecter');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });

  it('should allow access to protected routes when authenticated', () => {
    cy.login(); // Custom command that sets cypress-user in localStorage
    cy.visit('/taches/2026');
    cy.url().should('include', '/taches/2026');
    // Ensure no redirect happened
    cy.url().should('not.include', '/login');
  });
});
