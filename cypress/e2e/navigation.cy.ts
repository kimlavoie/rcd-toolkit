describe('Navigation and Security', () => {
  beforeEach(() => {
    cy.login();
    
    // Inject mock data for scenarios to prevent "en cours de chargement..."
    cy.window().then((win) => {
      const scenarios = [{ id: 'production', nom: 'Production', session: 'A26', isDefault: true }];
      win.localStorage.setItem('cypress-db-scenarios', JSON.stringify(scenarios));
    });
  });

  it('should persist Automne/Hiver mode across page reloads', () => {
    cy.visit('/taches/2026');

    // Default mode should be Automne
    cy.contains('button', '🍂 Mode Automne').should('have.class', 'btn-primary');
    cy.contains('button', '❄️ Mode Hiver').should('have.class', 'btn-white');

    // Switch to Mode Hiver
    cy.contains('button', '❄️ Mode Hiver').click();

    // Verify UI shows Hiver mode active
    cy.contains('button', '❄️ Mode Hiver').should('have.class', 'btn-primary');
    cy.contains('button', '🍂 Mode Automne').should('have.class', 'btn-white');

    // Refresh the page
    cy.reload();

    // Verify mode is still Hiver
    cy.contains('button', '❄️ Mode Hiver').should('have.class', 'btn-primary');
    cy.contains('button', '🍂 Mode Automne').should('have.class', 'btn-white');
  });

  it('should persist Automne/Hiver mode for specific years independently', () => {
    // Setup another scenario for 2027 to avoid load issues
    cy.window().then((win) => {
      const scenarios = [
        { id: 'production', nom: 'Production', session: 'A26', isDefault: true },
        { id: 'production2', nom: 'Production 2', session: 'A27', isDefault: true }
      ];
      win.localStorage.setItem('cypress-db-scenarios', JSON.stringify(scenarios));
    });

    // Set 2026 to Hiver
    cy.visit('/taches/2026');
    cy.contains('button', '❄️ Mode Hiver').click();
    cy.contains('button', '❄️ Mode Hiver').should('have.class', 'btn-primary');

    // Visit 2027 - should default to Automne because we haven't visited it yet
    cy.visit('/taches/2027');
    cy.contains('button', '🍂 Mode Automne').should('have.class', 'btn-primary');

    // Go back to 2026 - should remember Hiver
    cy.visit('/taches/2026');
    cy.contains('button', '❄️ Mode Hiver').should('have.class', 'btn-primary');
  });
});
