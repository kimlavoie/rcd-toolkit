import React from 'react'
import Skeleton from '@/app/utilities/Skeleton'

describe('<Skeleton />', () => {
  it('renders with default props', () => {
    cy.mount(<Skeleton data-testid="skeleton" />)
    
    cy.get('.skeleton-loader').should('be.visible')
    // height '20px' translates to '20px' in css usually, but it might be computed to pixels
    cy.get('.skeleton-loader').invoke('css', 'height').should('eq', '20px')
  })

  it('renders with custom width and height', () => {
    cy.mount(<Skeleton width="250px" height="50px" />)
    
    cy.get('.skeleton-loader').should('have.css', 'width', '250px')
    cy.get('.skeleton-loader').should('have.css', 'height', '50px')
  })

  it('applies custom className and styles', () => {
    cy.mount(<Skeleton className="my-custom-class" style={{ marginTop: '10px' }} />)
    
    cy.get('.skeleton-loader').should('have.class', 'my-custom-class')
    cy.get('.skeleton-loader').should('have.css', 'margin-top', '10px')
  })
})
