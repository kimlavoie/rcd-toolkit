describe('CSV Export Workflow', () => {
  beforeEach(() => {
    cy.login();
    cy.window().then((win) => {
      const enseignants = [
          { id: 'e1', prenom: 'John', nom: 'Doe', numeroEmploye: '123' }
      ];
      const cours = [
          { id: 'c1', sigle: 'INF101', nom: 'Intro', heuresTheorie: 3, heuresPratique: 2 }
      ];
      const groupes = [
          { id: 'g1', cours: 'c1', session: 'A26', nbEtudiants: 30 }
      ];
      const charges = [
          { id: 'ch1', enseignant: 'e1', groupe: 'g1', nbSemaines: 15, type: 'TP', session: 'A26', scenario: 'production' }
      ];
      win.localStorage.setItem('cypress-db-enseignants', JSON.stringify(enseignants));
      win.localStorage.setItem('cypress-db-cours', JSON.stringify(cours));
      win.localStorage.setItem('cypress-db-groupes', JSON.stringify(groupes));
      win.localStorage.setItem('cypress-db-charges', JSON.stringify(charges));
    });
    
    cy.visit('/taches/2026', {
        onBeforeLoad(win) {
            cy.stub(win.URL, 'createObjectURL').as('createObjectURLStub').returns('blob:http://localhost/test');
            cy.stub(win.URL, 'revokeObjectURL').as('revokeObjectURLStub');
            // Do NOT stub document.createElement, it breaks React.
            // Just spy on click of any anchor tag created.
            // Actually, we can just let it create the object URL and click, Cypress will ignore the fake blob download.
        }
    });
  });

  it('generates a CSV file and triggers a download', () => {
    // Wait for the grid to load
    cy.contains('John Doe').should('be.visible');

    // Click Export CSV button
    cy.contains('button', 'Exporter').click();
    cy.contains('button', '📊 Données (CSV)').click();

    // Verify it creates an object URL (meaning it created a Blob)
    cy.get('@createObjectURLStub').should('have.been.calledOnce');
    
    // Verify success toast appears
    cy.contains('Export CSV terminé').should('be.visible');
  });
});
