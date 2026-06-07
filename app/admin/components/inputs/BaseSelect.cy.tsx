import React from 'react'
import BaseSelect from '@/app/admin/components/inputs/BaseSelect'

describe('<BaseSelect />', () => {
  const mockItems = [
    { id: '1', name: 'Alpha' },
    { id: '2', name: 'Beta' },
    { id: '3', name: 'Gamma' }
  ]

  beforeEach(() => {
    // Clear localStorage to avoid interference
    localStorage.clear()
    localStorage.setItem('cypress-db-test_col', JSON.stringify(mockItems))
  })

  it('renders options from the collection', () => {
    const onChange = cy.stub().as('onChangeStub')
    cy.mount(
      <BaseSelect
        collectionName="test_col"
        value=""
        onChange={onChange}
        label="Select an item"
        renderOption={(item: any) => item.name}
      />
    )

    cy.get('select').should('contain', 'Select an item')
    cy.get('option').should('have.length', 4) // label + 3 items
    cy.get('option').contains('Alpha').should('exist')
    cy.get('option').contains('Beta').should('exist')
    cy.get('option').contains('Gamma').should('exist')
  })

  it('calls onChange when an item is selected', () => {
    const onChange = cy.stub().as('onChangeStub')
    cy.mount(
      <BaseSelect
        collectionName="test_col"
        value=""
        onChange={onChange}
        label="Select an item"
        renderOption={(item: any) => item.name}
      />
    )

    cy.get('select').select('2')
    cy.get('@onChangeStub').should('have.been.calledWith', '2')
  })

  it('applies filter and sort functions', () => {
    const onChange = cy.stub().as('onChangeStub')
    cy.mount(
      <BaseSelect
        collectionName="test_col"
        value=""
        onChange={onChange}
        label="Select an item"
        filterFn={(item: any) => item.name !== 'Beta'}
        sortFn={(a: any, b: any) => b.name.localeCompare(a.name)}
        renderOption={(item: any) => item.name}
      />
    )

    cy.get('option').should('have.length', 3) // label + 2 items
    cy.get('option').eq(1).should('contain', 'Gamma') // Sorted descending
    cy.get('option').eq(2).should('contain', 'Alpha')
    cy.get('option').contains('Beta').should('not.exist')
  })
})
