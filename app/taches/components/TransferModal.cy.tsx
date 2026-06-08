import React, { useState } from 'react'
import TransferModal from '@/app/taches/components/TransferModal'

describe('<TransferModal />', () => {
  const enseignants = [
    { id: 'e1', prenom: 'John', nom: 'Doe', numeroEmploye: '123' },
    { id: 'e2', prenom: 'Jane', nom: 'Smith', numeroEmploye: '456' },
    { id: 'e3', prenom: 'Alice', nom: 'Johnson', numeroEmploye: '789' }
  ]

  beforeEach(() => {
    localStorage.setItem('cypress-db-enseignants', JSON.stringify(enseignants))
  })

  const TestWrapper = (props: any) => {
    const [isOpen, setIsOpen] = useState(true)
    return <TransferModal {...props} isOpen={isOpen} onClose={() => setIsOpen(false)} />
  }

  it('renders and displays teachers except the current one', () => {
    cy.mount(
      <TestWrapper 
        onConfirm={() => {}}
        title="Transférer le cours"
        currentEnseignantId="e1"
      />
    )
    cy.contains('Transférer le cours').should('be.visible')
    cy.contains('Jane Smith').should('be.visible')
    cy.contains('Alice Johnson').should('be.visible')
    cy.contains('John Doe').should('not.exist')
  })

  it('filters teachers based on search input', () => {
    cy.mount(
      <TestWrapper 
        onConfirm={() => {}}
        title="Transférer le cours"
        currentEnseignantId="e1"
      />
    )
    cy.get('input[placeholder="Rechercher un enseignant..."]').type('Smith')
    cy.contains('Jane Smith').should('be.visible')
    cy.contains('Alice Johnson').should('not.exist')
  })

  it('calls onConfirm with the selected teacher id', () => {
    const onConfirm = cy.stub().as('onConfirmStub')
    cy.mount(
      <TestWrapper 
        onConfirm={onConfirm}
        title="Transférer le cours"
        currentEnseignantId="e1"
      />
    )
    
    // Click on the transfer button for Jane Smith (e2)
    cy.contains('Jane Smith').closest('button').click()
    cy.get('@onConfirmStub').should('have.been.calledWith', 'e2')
  })
})
