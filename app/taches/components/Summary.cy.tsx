import React from 'react'
import Summary from '@/app/taches/components/Summary'
import { DataProvider } from '@/app/taches/components/DataContext'

describe('<Summary />', () => {
  const visibleEnseignants = [{ id: 'e1', prenom: 'John', nom: 'Doe' }]
  const sessions = ['A26', 'H27']
  
  beforeEach(() => {
    cy.window().then((win) => {
        // Minimal data for calculateSessionCI to not throw errors and return 0
        win.localStorage.setItem('cypress-db-charges', '[]')
        win.localStorage.setItem('cypress-db-supervisions', '[]')
        win.localStorage.setItem('cypress-db-liberations', '[]')
        win.localStorage.setItem('cypress-db-groupes', '[]')
        win.localStorage.setItem('cypress-db-cours', '[]')
        win.localStorage.setItem('cypress-db-stages', '[]')
        win.localStorage.setItem('cypress-db-allocations', '[]')
        win.localStorage.setItem('cypress-db-CIReelles', JSON.stringify([
            { id: 'ci1', enseignant: 'e1', session: 'A26', CI: 40.5 }
        ]))
    })
  })

  it('renders annual CI total', () => {
    cy.mount(
      <DataProvider sessions={sessions}>
        <table>
            <tbody>
                <Summary 
                    visibleEnseignants={visibleEnseignants}
                    sessions={sessions}
                    saison="Automne"
                />
            </tbody>
        </table>
      </DataProvider>
    )

    cy.contains('CI Annuelle (Total)').should('be.visible')
    cy.contains('0.00').should('be.visible') // 0 for A26 + 0 for H27
  })

  it('uses CIReelle for Automne if saison is Hiver', () => {
    cy.mount(
      <DataProvider sessions={sessions}>
        <table>
            <tbody>
                <Summary 
                    visibleEnseignants={visibleEnseignants}
                    sessions={sessions}
                    saison="Hiver"
                />
            </tbody>
        </table>
      </DataProvider>
    )

    // CIReelle for A26 is 40.5, H27 calculation is 0, so total is 40.50
    cy.contains('40.50').should('be.visible')
  })
})
