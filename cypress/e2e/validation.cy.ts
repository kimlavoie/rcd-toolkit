describe('Validation Report', () => {
  beforeEach(() => {
    cy.login();
    cy.window().then((win) => {
      const enseignants = [{ id: 'e1', prenom: 'John', nom: 'Doe' }];
      const cours = [{ id: 'c1', sigle: 'INF101', nom: 'Intro', heuresTheorie: 3, heuresPratique: 2 }];
      const groupes = [{ id: 'g1', cours: 'c1', session: 'A26', nbEtudiants: 30, aTheorie: true, aPratique: true }];
      // Incomplete charge: only 10 weeks out of 15
      const charges = [{ id: 'ch1', enseignant: 'e1', groupe: 'g1', nbSemaines: 10, type: 'TP', session: 'A26', scenario: 'production' }];
      
      win.localStorage.setItem('cypress-db-enseignants', JSON.stringify(enseignants));
      win.localStorage.setItem('cypress-db-cours', JSON.stringify(cours));
      win.localStorage.setItem('cypress-db-groupes', JSON.stringify(groupes));
      win.localStorage.setItem('cypress-db-charges', JSON.stringify(charges));
    });
    
    cy.visit('/taches/2026');
  });

  it('shows an error report when tasks are incomplete', () => {
    // Click validate button
    cy.contains('button', '✅ Valider').click();
    
    // Should show a toast with the missing weeks
    cy.contains('Rapport de validation').should('be.visible');
    cy.contains('Théorie (5.0 sem.)').should('be.visible');
    cy.contains('Pratique (5.0 sem.)').should('be.visible');
  });

  it('shows success when all tasks are complete', () => {
    // Fix the data
    cy.window().then((win) => {
        const charges = [{ id: 'ch1', enseignant: 'e1', groupe: 'g1', nbSemaines: 15, type: 'TP', session: 'A26', scenario: 'production' }];
        win.localStorage.setItem('cypress-db-charges', JSON.stringify(charges));
    });
    cy.visit('/taches/2026');

    cy.contains('button', '✅ Valider').click();
    cy.contains('Toutes les tâches sont validées').should('be.visible');
  });
});
