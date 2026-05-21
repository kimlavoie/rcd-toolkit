'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const routeLabels: { [key: string]: string } = {
  admin: 'Administration',
  taches: 'Tâches',
  db: 'Données',
  enseignants: 'Enseignants',
  cours: 'Cours',
  groupes: 'Groupes',
  allocations: 'Allocations',
  liberations: 'Libérations',
  stages: 'Stages',
  supervisions: 'Supervisions',
  charges: 'Charges',
  CIReelles: 'CI Réelles',
  export: 'Exportation',
  import: 'Importation',
  copy: 'Copie'
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  if (pathname === '/' || pathname === '/login') return null

  const pathSegments = pathname.split('/').filter(segment => segment !== '')

  return (
    <nav aria-label="breadcrumb" className="container-fluid mt-3 mb-0">
      <ol className="breadcrumb bg-white p-2 rounded shadow-sm border" style={{ fontSize: '0.9rem' }}>
        <li className="breadcrumb-item">
          <Link href="/" style={{ textDecoration: 'none' }}>🏠 Accueil</Link>
        </li>
        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join('/')}`
          const isLast = index === pathSegments.length - 1
          const label = routeLabels[segment] || segment

          return (
            <li 
              key={href} 
              className={`breadcrumb-item ${isLast ? 'active' : ''}`} 
              aria-current={isLast ? 'page' : undefined}
            >
              {isLast ? (
                <span className="text-muted fw-bold">{label}</span>
              ) : (
                <Link href={href} style={{ textDecoration: 'none' }}>{label}</Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
