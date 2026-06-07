'use client'

import React from 'react'

interface TacheSummaryBadgesProps {
    courseCount: number
    groupCount: number
    studentsFromCourses: number
    totalStagiaires: number
    totalCoord: number
    totalETC: number
}

export default function TacheSummaryBadges({
    courseCount,
    groupCount,
    studentsFromCourses,
    totalStagiaires,
    totalCoord,
    totalETC
}: TacheSummaryBadgesProps) {
    if (groupCount === 0 && totalStagiaires === 0 && totalETC === 0 && totalCoord === 0) {
        return null
    }

    return (
        <div className="d-flex justify-content-center gap-1 flex-wrap">
            {courseCount > 0 && (
                <span className="badge rounded-pill bg-info text-dark shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Préparations">
                    <span style={{marginRight: "2px"}}>📚</span>{courseCount}
                </span>
            )}
            {groupCount > 0 && (
                <span className="badge rounded-pill bg-info text-dark shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Groupes">
                    <span style={{marginRight: "2px"}}>👥</span>{groupCount}
                </span>
            )}
            {studentsFromCourses > 0 && (
                <span className="badge rounded-pill bg-info text-dark shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Étudiants (Cours)">
                    <span style={{marginRight: "2px"}}>👤</span>{studentsFromCourses}
                </span>
            )}
            {totalStagiaires > 0 && (
                <span className="badge rounded-pill bg-info text-dark shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Stagiaires">
                    <span style={{marginRight: "2px"}}>🎓</span>{totalStagiaires}
                </span>
            )}
            {totalCoord > 0 && (
                <span className="badge rounded-pill bg-warning text-dark shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Coordination Stages (CI)">
                    <span style={{marginRight: "2px"}}>📢</span>{totalCoord} CI
                </span>
            )}
            {totalETC > 0 && (
                <span className="badge rounded-pill bg-primary shadow-sm border border-white border-opacity-25" style={{ fontSize: "0.55rem" }} title="Total ETC">
                    {Number(totalETC.toFixed(3))} ETC
                </span>
            )}
        </div>
    )
}
