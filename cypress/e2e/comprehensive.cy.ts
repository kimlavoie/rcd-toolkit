describe('rcd-toolkit E2E', () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Navigation', () => {
    it('should navigate between admin pages', () => {
      cy.visit('/admin');
      cy.contains('Administration').should('be.visible');
      
      cy.get('a').contains('Enseignants').click();
      cy.url().should('include', '/admin/enseignants');
      
      cy.visit('/admin');
      cy.get('a').contains('Cours').click();
      cy.url().should('include', '/admin/cours');
      
      cy.visit('/admin');
      cy.get('a').contains('Allocations').click();
      cy.url().should('include', '/admin/allocations');
    });
  });

  describe('Enseignants', () => {
    beforeEach(() => {
      cy.visit('/admin/enseignants');
    });

    it('should show the teachers management UI', () => {
      cy.get('h1').contains('Gestion des enseignants');
      cy.get('input[placeholder="Rechercher par nom, prénom, no..."]').should('exist');
    });

    it('should allow typing in add form', () => {
      cy.get('tr.table-info').within(() => {
        cy.get('input[placeholder="Nouveau..."]').type('12345');
        cy.get('input[placeholder="Prénom"]').type('John');
        cy.get('input[placeholder="Nom"]').type('Doe');
        cy.get('input[placeholder="Courriel"]').type('john.doe@example.com');
      });
    });
  });

  describe('Tâches Grid', () => {
    const year = '2026';
    
    beforeEach(() => {
      cy.visit(`/taches/${year}`);
    });

    it('should load the grid and show toolbar', () => {
      cy.contains(`Année scolaire ${year}-2027`).should('be.visible');
      cy.get('input[placeholder="Chercher..."]').should('exist');
    });

    it('should toggle display modes', () => {
      cy.contains('Mode Hiver').click();
      cy.contains('❄️ Mode Hiver').should('have.class', 'btn-primary');
      
      cy.contains('Mode Automne').click();
      cy.contains('🍂 Mode Automne').should('have.class', 'btn-primary');
    });

    it('should show help modal', () => {
      cy.get('button[title="Aide et astuces"]').click();
      cy.contains('Astuces et Fonctionnalités').should('be.visible');
      cy.contains("C'est compris !").click();
      cy.contains('Astuces et Fonctionnalités').should('not.exist');
    });
  });

  describe('Scénarios', () => {
    it('should navigate to scenarios and show production', () => {
      cy.visit('/admin/scenarios');
      cy.contains('Gestion des Scénarios', { matchCase: false }).should('be.visible');
      cy.contains('Production').should('be.visible');
    });
  });
});
