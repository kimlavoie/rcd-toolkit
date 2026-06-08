describe('Drag & Drop functionality', () => {
  beforeEach(() => {
    cy.login();
    // Inject mock data for drag & drop test using cy.window() to be safe
    cy.window().then((win) => {
      const enseignants = [
        { id: 'e1', prenom: 'John', nom: 'Doe' },
        { id: 'e2', prenom: 'Jane', nom: 'Smith' }
      ];
      const cours = [{ id: 'c1', sigle: 'INF101', nom: 'Intro', couleur: '#ff0000' }];
      const groupes = [{ id: 'g1', cours: 'c1', session: 'A26', nbEtudiants: 30 }];
      const charges = [{ id: 'ch1', enseignant: 'e1', groupe: 'g1', nbSemaines: 15, type: 'TP', session: 'A26', scenario: 'production' }];

      win.localStorage.setItem('cypress-db-enseignants', JSON.stringify(enseignants));
      win.localStorage.setItem('cypress-db-cours', JSON.stringify(cours));
      win.localStorage.setItem('cypress-db-groupes', JSON.stringify(groupes));
      win.localStorage.setItem('cypress-db-charges', JSON.stringify(charges));
    });

    cy.visit('/taches/2026');
  });

  it('should allow dragging a charge between teachers', () => {
    // Wait for the grid to load and show teachers
    cy.contains('John Doe').should('be.visible');
    cy.contains('Jane Smith').should('be.visible');

    // 1. Find the source charge card (use first() if multiple exist)
    cy.contains('INF101').first().should('be.visible');
    
    // 2. Drag & Drop simulation
    const dataTransfer = new DataTransfer();
    
    cy.contains('INF101').first().closest('[draggable="true"]')
      .trigger('dragstart', { dataTransfer });
      
    // Target teacher e2's cell
    cy.get('td[data-enseignant-id="e2"]').first()
      .trigger('drop', { dataTransfer })
      .trigger('dragleave');
      
    cy.contains('Cours déplacé').should('be.visible');
  });

  it('should fusion charges of different types', () => {
    // ch1 is TP on e1. Let's add ch2 as T on e2.
    cy.window().then((win) => {
      const charges = [
        { id: 'ch1', enseignant: 'e1', groupe: 'g1', nbSemaines: 15, type: 'P', session: 'A26', scenario: 'production' },
        { id: 'ch2', enseignant: 'e2', groupe: 'g1', nbSemaines: 15, type: 'T', session: 'A26', scenario: 'production' }
      ];
      win.localStorage.setItem('cypress-db-charges', JSON.stringify(charges));
    });
    cy.visit('/taches/2026');

    // Use global expansion button to see everything
    cy.contains('button', 'Déplier tout').click();

    cy.get('.badge').contains('P').first().should('be.visible');
    cy.get('.badge').contains('T').first().should('be.visible');

    const dataTransfer = new DataTransfer();
    // Manually set data to be sure it's available for the drop handler
    dataTransfer.setData("groupeId", "g1");
    dataTransfer.setData("enseignantId", "e1");

    cy.get('td[data-enseignant-id="e2"]').first()
      .trigger('drop', { dataTransfer });

    cy.contains('Fusionnées', { timeout: 10000 }).should('be.visible');
  });
});
