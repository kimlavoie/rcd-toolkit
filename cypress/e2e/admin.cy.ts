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

  it('should easily switch between Automne 2026 and Hiver 2027 without going back to selector', () => {
    cy.visit('/admin/allocations/A26');
    cy.contains('h1', 'Automne 2026').should('be.visible');
    
    // Switcher should show both corresponding sessions
    cy.contains('button', '🍂 Automne 2026').should('have.class', 'btn-primary');
    cy.contains('button', '❄️ Hiver 2027').should('not.have.class', 'btn-primary');

    // Click to switch to Winter 2027
    cy.contains('button', '❄️ Hiver 2027').click();
    cy.url().should('include', '/admin/allocations/H27');
    cy.contains('h1', 'Hiver 2027').should('be.visible');
    cy.contains('button', '❄️ Hiver 2027').should('have.class', 'btn-primary');

    // Click to switch back to Autumn 2026
    cy.contains('button', '🍂 Automne 2026').click();
    cy.url().should('include', '/admin/allocations/A26');
    cy.contains('h1', 'Automne 2026').should('be.visible');

    // Click "Autre session" should open the modal
    cy.contains('button', 'Autre session').click();
    cy.contains('Sélectionner une autre session').should('be.visible');

    // Change season to Hiver in the modal and click Accéder
    cy.get('.modal, .card').within(() => {
      cy.get('select[name="saison"]').select('Hiver');
      cy.contains('button', 'Accéder').click();
    });

    // Should navigate to H26
    cy.url().should('include', '/admin/allocations/H26');
    cy.contains('h1', 'Hiver 2026').should('be.visible');
    cy.contains('Sélectionner une autre session').should('not.exist');
  });

  it('should navigate to task grid with correct mode query param from allocations', () => {
    cy.visit('/admin/allocations/A26');
    cy.contains('a', 'Grille des tâches').should('have.attr', 'href', '/taches/2026?mode=Automne');
    cy.contains('a', 'Grille des tâches').click();
    cy.url().should('include', '/taches/2026?mode=Automne');
    cy.contains('Mode Automne').should('have.class', 'btn-primary');
  });
});

describe('Admin - Groupes', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should allow switching sessions in groupes view', () => {
    cy.visit('/admin/groupes/A26');
    cy.contains('h1', 'Automne 2026').should('be.visible');

    cy.contains('button', '❄️ Hiver 2027').click();
    cy.url().should('include', '/admin/groupes/H27');
    cy.contains('h1', 'Hiver 2027').should('be.visible');
  });
});

describe('Taches - Navigation vers Admin', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should show Admin dropdown with links targeting current session in new tabs', () => {
    cy.visit('/taches/2026?mode=Automne');
    cy.contains('Admin (A26)').should('be.visible').click();

    // Verify session links targeting A26 and opening in a new tab
    cy.contains('a', 'Allocations')
      .should('have.attr', 'href', '/admin/allocations/A26')
      .should('have.attr', 'target', '_blank')
      .should('have.attr', 'rel', 'noopener noreferrer');

    cy.contains('a', 'Groupes')
      .should('have.attr', 'href', '/admin/groupes/A26')
      .should('have.attr', 'target', '_blank');

    cy.contains('a', 'Charges')
      .should('have.attr', 'href', '/admin/charges/A26')
      .should('have.attr', 'target', '_blank');

    cy.contains('a', 'Libérations')
      .should('have.attr', 'href', '/admin/liberations/A26')
      .should('have.attr', 'target', '_blank');

    cy.contains('a', 'CI Réelles')
      .should('have.attr', 'href', '/admin/CIReelles/A26')
      .should('have.attr', 'target', '_blank');

    // Verify general links
    cy.contains('a', 'Enseignants')
      .should('have.attr', 'href', '/admin/enseignants')
      .should('have.attr', 'target', '_blank');

    cy.contains('a', 'Tous les menus admin')
      .should('have.attr', 'href', '/admin')
      .should('have.attr', 'target', '_blank');

    // Switch to Hiver mode
    cy.contains('button', '❄️ Mode Hiver').click();
    cy.contains('Admin (H27)').should('be.visible').click();

    cy.contains('a', 'Allocations')
      .should('have.attr', 'href', '/admin/allocations/H27')
      .should('have.attr', 'target', '_blank');
  });
});


