describe('Scenarios Management', () => {
  beforeEach(() => {
    cy.login();
    cy.window().then((win) => {
        // Base data for scenarios
        win.localStorage.setItem('cypress-db-scenarios', JSON.stringify([
            { id: 'production', nom: 'Production', session: 'A26', isDefault: true }
        ]));
        // Some initial data to see if it copies
        win.localStorage.setItem('cypress-db-charges', JSON.stringify([
            { id: 'ch1', enseignant: 'e1', groupe: 'g1', nbSemaines: 15, type: 'TP', session: 'A26', scenario: 'production' }
        ]));
    });
  });

  it('allows creating a new scenario and selecting it', () => {
    cy.visit('/admin/scenarios');
    
    // Add new scenario
    cy.get('input[placeholder="Nom..."]').type('Plan B');
    // Session is already A26 by default
    cy.get('tr.table-info').contains('button', '+').click();

    // Verify it was added. The mock DB now updates the UI!
    cy.contains('Plan B').should('be.visible'); 
    
    cy.visit('/taches/2026');
    
    // Select the newly created scenario from the dropdown
    cy.get('select').first().contains('Plan B').should('exist');
    // We don't know the exact random mock ID, so we select by text using cypress-select extension or just change value.
    cy.contains('select option', 'Plan B').then(option => {
       cy.get('select').first().select(option.val() as string);
    });
    
    cy.contains('Scénario : Plan B').should('be.visible');
  });
});
