import React, { useState } from 'react'
import InputModal from '@/app/taches/components/InputModal'

describe('<InputModal />', () => {
  const TestWrapper = (props: any) => {
    const [isOpen, setIsOpen] = useState(true)
    return <div id="modal-root"><InputModal {...props} isOpen={isOpen} onClose={() => setIsOpen(false)} /></div>
  }

  it('renders with title and default value', () => {
    cy.mount(
      <TestWrapper 
        onConfirm={() => {}}
        title="Test Modal"
        label="Input label:"
        defaultValue={10}
        max={15}
      />
    )
    cy.contains('Test Modal').should('be.visible')
    // Select input via global document because of portal
    cy.document().then((doc) => {
        const input = doc.querySelector('input[type="number"]') as HTMLInputElement
        expect(input.value).to.equal('10')
    })
  })

  it('calls onConfirm with the entered value', () => {
    const onConfirm = cy.stub().as('onConfirmStub')
    cy.mount(
      <TestWrapper 
        onConfirm={onConfirm}
        title="Test Modal"
        label="Input label:"
        defaultValue={5}
        max={20}
      />
    )
    
    cy.get('input[type="number"]').type('{selectall}12').should('have.value', '12')
    cy.contains('button', 'Confirmer').click()
    
    cy.get('@onConfirmStub').should('have.been.calledWith', 12)
  })

  it('respects the max attribute if provided', () => {
    cy.mount(
      <TestWrapper 
        onConfirm={() => {}}
        title="Test Modal"
        label="Input label:"
        defaultValue={5}
        max={15}
      />
    )
    cy.get('body').find('input[type="number"]').should('have.attr', 'max', '15')
  })
})
