import React from 'react'
import TacheSummaryBadges from '@/app/taches/components/TacheSummaryBadges'

describe('<TacheSummaryBadges />', () => {
  it('renders nothing when all values are zero', () => {
    cy.mount(
      <TacheSummaryBadges 
        courseCount={0}
        groupCount={0}
        studentsFromCourses={0}
        totalStagiaires={0}
        totalCoord={0}
        totalETC={0}
      />
    )
    // Component returns null, so data-cy-root should have no children
    cy.get('[data-cy-root]').should('be.empty')
  })

  it('renders badges when values are provided', () => {
    cy.mount(
      <TacheSummaryBadges 
        courseCount={2}
        groupCount={3}
        studentsFromCourses={45}
        totalStagiaires={5}
        totalCoord={1.5}
        totalETC={0.5}
      />
    )
    // Check for values regardless of the exact tag structure
    cy.contains('2').should('be.visible')
    cy.contains('3').should('be.visible')
    cy.contains('45').should('be.visible')
    cy.contains('5').should('be.visible')
    cy.contains('1.5').should('be.visible')
    cy.contains('0.5').should('be.visible')
  })

  it('shows only provided badges', () => {
    cy.mount(
      <TacheSummaryBadges 
        courseCount={2}
        groupCount={0}
        studentsFromCourses={0}
        totalStagiaires={0}
        totalCoord={0}
        totalETC={0}
      />
    )
    cy.contains('2').should('be.visible')
    // Check that groups icon or badge doesn't exist
    cy.contains('👥').should('not.exist')
  })
})
