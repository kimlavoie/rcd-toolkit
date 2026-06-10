describe('Préférences et Priorités', () => {
    beforeEach(() => {
        cy.login();
        cy.visit('/admin/enseignants');
        cy.window().then((win) => {
            const enseignants = [{ id: 'e1', nom: 'Tremblay', prenom: 'Jean', numeroEmploye: '123', userId: 'test-user-id' }];
            const cours = [{ id: 'c1', sigle: 'INF101', nom: 'Intro Programmation', userId: 'test-user-id' }];
            win.localStorage.setItem('cypress-db-enseignants', JSON.stringify(enseignants));
            win.localStorage.setItem('cypress-db-cours', JSON.stringify(cours));
            win.dispatchEvent(new CustomEvent('cypress-db-changed', { detail: { collection: 'enseignants' } }));
            win.dispatchEvent(new CustomEvent('cypress-db-changed', { detail: { collection: 'cours' } }));
        });
    });

    it('devrait pouvoir accéder à la page des préférences', () => {
        cy.get('table').should('be.visible');
        cy.contains('Tremblay').should('be.visible');
        cy.get('button').contains('⭐').first().click();
        cy.url().should('include', '/preferences');
        cy.contains('Préférences de Jean Tremblay').should('be.visible');
    });

    it('devrait ajouter une priorité absolue et respecter la limite', () => {
        cy.get('table').should('be.visible');
        cy.get('button').contains('⭐').first().click();
        
        // Attendre que la page des préférences charge
        cy.contains('Ajouter une préférence').should('be.visible');
        
        // Ajouter une absolue
        cy.get('select').first().select('INF101 - Intro Programmation');
        cy.get('select').last().select('ABSOLUE');
        cy.contains('button', 'Ajouter').click();
        
        cy.contains('🌟 Absolue').should('be.visible');
        
        // Essayer d'en ajouter une deuxième
        cy.get('select').first().select('INF101 - Intro Programmation');
        cy.get('select').last().select('ABSOLUE');
        cy.contains('button', 'Ajouter').click();
        cy.contains("L'enseignant a déjà une priorité absolue").should('be.visible');
    });

    it('devrait configurer les paramètres globaux', () => {
        cy.visit('/admin/parametres');
        cy.get('input[type="number"]').should('be.visible').clear().type('5');
        cy.contains('button', 'Enregistrer').click();
        cy.contains('Paramètres enregistrés').should('be.visible');
    });

    it('devrait afficher les badges dans la grille des tâches', () => {
        // Setup preferences
        const preferences = [
            { id: 'p1', enseignant: 'e1', cours: 'c1', type: 'ABSOLUE', userId: 'test-user-id' }
        ];
        const groupes = [
            { id: 'g1', cours: 'c1', session: 'A26', nbEtudiants: 30, userId: 'test-user-id' }
        ];
        const charges = [
            { id: 'ch1', enseignant: 'e1', groupe: 'g1', nbSemaines: 15, type: 'TP', session: 'A26', scenario: 'production', userId: 'test-user-id' }
        ];
        
        localStorage.setItem('cypress-db-preferences', JSON.stringify(preferences));
        localStorage.setItem('cypress-db-groupes', JSON.stringify(groupes));
        localStorage.setItem('cypress-db-charges', JSON.stringify(charges));
        
        cy.visit('/taches/2026'); // Session A26
        
        // Attendre la fin du chargement (disparition des squelettes)
        cy.get('.spinner-border').should('not.exist');
        
        // Vérifier la présence de l'étoile
        cy.contains('INF101').should('be.visible');
        cy.contains('🌟').should('be.visible');
    });
});
