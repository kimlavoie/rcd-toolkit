describe('Authentication', () => {
  it('should redirect to login if not authenticated', () => {
    cy.visit('/taches');
    cy.url().should('include', '/login');
  });

  it('should show login options', () => {
    cy.visit('/login');
    cy.contains('Se connecter');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });
});
