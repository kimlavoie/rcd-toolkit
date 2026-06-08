import React from 'react'
import ContextMenuAddCourse from '@/app/taches/components/ContextMenuAddCourse'
import type { Groupe, Cours, Charge } from "@/app/db/db"

describe('<ContextMenuAddCourse />', () => {
  const coursData: Cours[] = [
    { id: 'c1', sigle: 'INF101', nom: 'Introduction', heuresTheorie: 3, heuresPratique: 2, saison: 'A', couleur: '#000', heuresMaison: 0 }
  ]
  const groupes: Groupe[] = [
    { id: 'g1', cours: 'c1', session: 'A26', nbEtudiants: 30, aTheorie: true, aPratique: true }
  ]
  const scenarioCharges: Charge[] = []

  let props: any;

  beforeEach(() => {
    props = {
        position: { left: 100, top: 100 },
        onClose: cy.stub().as('onClose'),
        onAdd: cy.stub().as('onAdd'),
        onAddAll: cy.stub().as('onAddAll'),
        onOpenModal: cy.stub().as('onOpenModal'),
        sortedCourseIds: ['c1'],
        groupsByCourse: { 'c1': groupes },
        coursData,
        scenarioCharges,
        enseignantId: 'e1'
    }
  })

  it('renders course information', () => {
    cy.mount(<ContextMenuAddCourse {...props} />)
    cy.contains('INF101').should('be.visible')
    cy.contains('Introduction').should('be.visible')
  })

  it('expands course to show group options', () => {
    cy.mount(<ContextMenuAddCourse {...props} />)
    // Click expand button (▼)
    cy.contains('▼').click()
    
    // Should show T and P buttons
    cy.get('button').contains(/^T$/).should('be.visible')
    cy.get('button').contains(/^P$/).should('be.visible')
    
    // Click T button
    cy.get('button').contains(/^T$/).click()
    cy.get('@onAdd').should('have.been.calledWith', groupes[0], 'T')
  })

  it('filters courses by search', () => {
    const moreProps = {
        ...props,
        coursData: [
            ...coursData,
            { id: 'c2', sigle: 'MAT101', nom: 'Maths', heuresTheorie: 3, heuresPratique: 0, saison: 'A', couleur: '#000', heuresMaison: 0 }
        ],
        sortedCourseIds: ['c1', 'c2'],
        groupsByCourse: { 'c1': groupes, 'c2': [] }
    }
    cy.mount(<ContextMenuAddCourse {...moreProps} />)
    
    cy.contains('INF101').should('be.visible')
    cy.contains('MAT101').should('be.visible')
    
    cy.get('input').type('INF')
    
    cy.contains('INF101').should('be.visible')
    cy.contains('MAT101').should('not.exist')
  })
})
