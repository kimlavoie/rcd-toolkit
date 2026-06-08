import React from 'react'
import { ErrorBoundary } from '@/app/utilities/ErrorBoundary'

describe('<ErrorBoundary />', () => {
  it('renders children when there is no error', () => {
    cy.mount(
      <ErrorBoundary>
        <div data-testid="child-content">Contenu normal</div>
      </ErrorBoundary>
    )

    cy.get('[data-testid="child-content"]').should('be.visible').and('contain', 'Contenu normal')
    cy.contains('Une erreur inattendue est survenue').should('not.exist')
  })

  it('catches errors and renders fallback UI', () => {
    // A component that always throws an error
    const BuggyComponent = () => {
      throw new Error('Test Error from BuggyComponent')
    }

    // Suppress the expected React error boundary logs in Cypress to avoid confusing console output
    cy.on('uncaught:exception', (err, runnable) => {
        if (err.message.includes('Test Error from BuggyComponent')) {
            return false // Prevent Cypress from failing the test
        }
    })

    cy.mount(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    )

    // Verify the error boundary caught it and shows the default UI
    cy.contains('Une erreur inattendue est survenue').should('be.visible')
    cy.contains('Test Error from BuggyComponent').should('be.visible')
  })

  it('allows resetting the error state', () => {
    // We use a mutable object to control the error state from outside safely in Cypress
    const testState = { shouldThrow: true }

    const RecoverableBuggyComponent = () => {
      if (testState.shouldThrow) {
        throw new Error('Recoverable Error')
      }
      return <div>Composant réparé</div>
    }

    cy.on('uncaught:exception', (err, runnable) => {
        if (err.message.includes('Recoverable Error')) {
            return false
        }
    })

    cy.mount(
      <ErrorBoundary>
        <RecoverableBuggyComponent />
      </ErrorBoundary>
    )

    cy.contains('Recoverable Error').should('be.visible')
    
    // Fix the component's internal state
    cy.then(() => {
        testState.shouldThrow = false
    })

    // Click retry
    cy.contains('button', 'Réessayer').click()

    // It should now show the fixed content
    cy.contains('Composant réparé').should('be.visible')
  })
})
