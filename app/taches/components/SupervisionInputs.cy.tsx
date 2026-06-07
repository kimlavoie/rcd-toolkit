import React, { useState } from 'react'
import SupervisionInputs from '@/app/taches/components/SupervisionInputs'

describe('<SupervisionInputs />', () => {
  // Stateful wrapper to test controlled components correctly
  const TestWrapper = ({ initialSt = 0, initialCo = 0, onUpdateStub }: any) => {
    const [st, setSt] = useState(initialSt)
    const [co, setCo] = useState(initialCo)

    const handleUpdate = (field: string, val: number) => {
      if (field === 'nbStagiaires') setSt(val)
      if (field === 'coordination') setCo(val)
      onUpdateStub(field, val)
    }

    return (
      <SupervisionInputs 
        enseignantId="e1"
        stageId="s1"
        stValue={st}
        coValue={co}
        onUpdate={handleUpdate}
      />
    )
  }

  it('renders with initial values', () => {
    const onUpdate = cy.stub().as('onUpdateStub')
    cy.mount(<TestWrapper initialSt={5} initialCo={0.5} onUpdateStub={onUpdate} />)
    
    cy.get('input[title="Nombre de stagiaires"]').should('have.value', '5')
    cy.get('input[title="Coordination (CI)"]').should('have.value', '0.5')
  })

  it('calls onUpdate for nbStagiaires', () => {
    const onUpdate = cy.stub().as('onUpdateStub')
    cy.mount(<TestWrapper onUpdateStub={onUpdate} />)
    
    cy.get('input[title="Nombre de stagiaires"]').clear().type('10{enter}')
    // should('have.been.calledWith') matches if ANY call in history matches
    cy.get('@onUpdateStub').should('have.been.calledWith', 'nbStagiaires', 10)
  })

  it('calls onUpdate for coordination', () => {
    const onUpdate = cy.stub().as('onUpdateStub')
    cy.mount(<TestWrapper onUpdateStub={onUpdate} />)
    
    // Typing slowly with a decimal
    cy.get('input[title="Coordination (CI)"]').clear().type('1.75{enter}')
    
    // Verify it was eventually called with 1.75
    cy.get('@onUpdateStub').should('have.been.calledWith', 'coordination', 1.75)
  })
})
