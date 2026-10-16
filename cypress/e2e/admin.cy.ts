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

describe('Admin - Allocations', () => {
  const mockAllocations = [
    { id: 'a1', code: 'ALLOC_A26', description: 'Coordination Automne', quantite: 0.2, session: 'A26' },
    { id: 'a2', code: 'ALLOC_H26', description: 'Recherche Hiver', quantite: 0.1, session: 'H26' },
  ];

  beforeEach(() => {
    cy.login();
  });

  it('should navigate from session selection to specific session allocations', () => {
    cy.visit('/admin/allocations');
    cy.contains('Sélection de session').should('be.visible');
    cy.contains('Accéder aux allocations').click();
    cy.url().should('include', '/admin/allocations/A26');
  });

  it('should display ONLY allocations for the selected session A26', () => {
    cy.visit('/admin/allocations/A26', {
      onBeforeLoad(win) {
        win.localStorage.setItem('cypress-db-allocations', JSON.stringify(mockAllocations));
      }
    });
    cy.contains('ALLOC_A26').should('be.visible');
    cy.contains('Coordination Automne').should('be.visible');
    cy.contains('ALLOC_H26').should('not.exist');
    cy.contains('Recherche Hiver').should('not.exist');
  });

  it('should display ONLY allocations for the selected session H26', () => {
    cy.visit('/admin/allocations/H26', {
      onBeforeLoad(win) {
        win.localStorage.setItem('cypress-db-allocations', JSON.stringify(mockAllocations));
      }
    });
    cy.contains('ALLOC_H26').should('be.visible');
    cy.contains('Recherche Hiver').should('be.visible');
    cy.contains('ALLOC_A26').should('not.exist');
    cy.contains('Coordination Automne').should('not.exist');
  });
});

