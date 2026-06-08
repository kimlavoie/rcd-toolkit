describe('Dashboard Modal Workflow', () => {
  beforeEach(() => {
    cy.login();

    cy.visit('/taches/2026', {
      onBeforeLoad(win) {
        const enseignants = [
            { id: 'e1', prenom: 'John', nom: 'Doe', numeroEmploye: '123' },
            { id: 'e2', prenom: 'Jane', nom: 'Smith', numeroEmploye: '456' },
            { id: 'e3', prenom: 'Bob', nom: 'Brown', numeroEmploye: '789' }
        ];
        const ciReelles = [
            { id: 'ci1', enseignant: 'e1', session: 'A26', CI: 90 }, // Overloaded (>85)
            { id: 'ci2', enseignant: 'e2', session: 'A26', CI: 82 }, // OK (80-85)
            { id: 'ci3', enseignant: 'e3', session: 'A26', CI: 75 }  // Underloaded (<80)
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
        win.localStorage.setItem('cypress-db-CIReelles', JSON.stringify(ciReelles));
      }
    });
  });

  it('displays the health dashboard with correct categorizations', () => {
    cy.window().then((win) => {
        cy.writeFile('localstorage.json', JSON.stringify(win.localStorage));
    });

    cy.contains('John Doe').should('be.visible');

    // Click Santé button
    cy.contains('button', '📈 Santé').click();

    // Verify modal title
    cy.contains('Tableau de bord').should('be.visible');

    // Verify counts in the cards
    // 1 surchargé, 1 équilibré, 1 sous-chargé
    cy.get('.border-danger h3').should('contain', '1');
    cy.get('.border-success h3').should('contain', '1');
    cy.get('.border-warning h3').should('contain', '1');

    // Verify lists contain the right teachers
    cy.contains('🔴 Enseignants Surchargés').parent().contains('John Doe').should('be.visible');
    cy.contains('🟡 Enseignants Sous-chargés').parent().contains('Bob Brown').should('be.visible');
    
    // Close modal
    cy.get('.btn-close').click();
    cy.contains('Tableau de bord').should('not.exist');
  });
});
