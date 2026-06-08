describe('Taches Grid', () => {
  const year = '2026';
  
  beforeEach(() => {
    cy.login();
    cy.visit(`/taches/${year}`);
  });

  it('should display the main grid for the given year', () => {
    cy.contains(`Année scolaire ${year}-2027`).should('be.visible');
    cy.get('table').should('be.visible');
  });

  it('should allow toggling session visibility', () => {
    cy.contains('Mode Hiver').click();
    cy.contains('❄️ Mode Hiver').should('have.class', 'btn-primary');
  });
});
