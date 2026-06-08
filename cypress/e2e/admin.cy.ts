describe('Admin - Enseignants', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/admin/enseignants');
  });

  it('should display the teachers management title', () => {
    cy.contains('Gestion des enseignants').should('be.visible');
  });

  it('should have a search input', () => {
    cy.get('input[placeholder*="Rechercher"]').should('be.visible');
  });

  it('should have a form to add a new teacher', () => {
    cy.get('tr.table-info').within(() => {
      cy.get('input[placeholder="Nouveau..."]').should('be.visible');
      cy.get('input[placeholder="Prénom"]').should('be.visible');
      cy.get('input[placeholder="Nom"]').should('be.visible');
      cy.get('button').contains('+').should('be.visible');
    });
  });

  // More advanced tests would require a real or mocked DB
});
