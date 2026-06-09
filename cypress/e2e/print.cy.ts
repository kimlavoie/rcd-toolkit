describe('Print Workflow', () => {
  beforeEach(() => {
    cy.login();
    cy.window().then((win) => {
      const enseignants = [
          { id: 'e1', prenom: 'John', nom: 'Doe' },
          { id: 'e2', prenom: 'Jane', nom: 'Smith' },
          { id: 'e3', prenom: 'Bob', nom: 'Brown' }
      ];
      win.localStorage.setItem('cypress-db-enseignants', JSON.stringify(enseignants));
    });
    
    // Freeze time so we can inspect the print layout before it disappears
    cy.clock();

    // Stub window.print to prevent actual print dialog
    cy.visit('/taches/2026', {
        onBeforeLoad(win) {
            cy.stub(win, 'print').as('printStub');
        }
    });
  });

  it('triggers the print layout and calls window.print', () => {
    cy.contains('button', 'Exporter').click();
    
    // Select "2" teachers per page to test pagination logic
    cy.get('input[type="number"]').type('{selectAll}2');

    // Click Print PDF button
    cy.contains('button', '🖨️ Imprimer (PDF)').click();

    // The print mode should render 'Tâches Enseignants - Page X / Y'
    cy.contains('Page 1 / 2').should('be.visible');
    cy.contains('Page 2 / 2').should('be.visible');

    // The first page should have John and Jane, the second should have Bob
    cy.contains('John Doe').should('be.visible');
    cy.contains('Jane Smith').should('be.visible');
    cy.get('.print-page-break').should('exist'); // Just verify the page break exists

    // Advance time by 500ms to trigger the print
    cy.tick(500);

    // Wait for the setTimeout in the component to trigger window.print
    cy.get('@printStub').should('have.been.calledOnce');
    
    // It should automatically exit print mode after printing
    cy.contains('Page 1 / 2').should('not.exist');
  });
});
