import React from "react";
import StickyHeader from "./StickyHeader";

interface CollapsibleSectionRowProps {
    title: string;
    isVisible: boolean;
    onToggle: () => void;
    colSpan: number;
    badge?: React.ReactNode;
    children: React.ReactNode;
    indent?: boolean;
    headerStyle?: React.CSSProperties;
}

export default function CollapsibleSectionRow({
    title,
    isVisible,
    onToggle,
    colSpan,
    badge,
    children,
    indent = false,
    headerStyle = {}
}: CollapsibleSectionRowProps) {
    return (
        <>
            <tr style={{ display: isVisible ? "table-row" : "none" }}>
                <StickyHeader isFirstCol style={headerStyle}>
                    <div className={`d-flex justify-content-between align-items-center gap-3 ${indent ? 'ps-3' : 'ps-2'}`}>
                        <div 
                            className="d-flex align-items-center gap-2 cursor-pointer" 
                            onClick={onToggle} 
                            title={`Masquer ${title.toLowerCase()}`} 
                            style={{cursor: "pointer"}}
                        >
                            <span style={{fontSize: "0.6rem", color: "#666", width: "12px", display: "inline-block"}}>▼</span>
                            <span className="fw-bold small text-muted text-uppercase" style={{fontSize: "0.7rem"}}>{title}</span>
                        </div>
                        {badge}
                    </div>
                </StickyHeader>
                {children}
            </tr>
            {!isVisible && (
                <tr className="bg-light">
                    <StickyHeader isFirstCol style={{fontSize: "0.7rem", color: "#999", ...headerStyle}}>
                        <div 
                            className={`cursor-pointer d-flex align-items-center gap-2 ${indent ? 'ps-4' : 'ps-3'}`} 
                            onClick={onToggle} 
                            style={{cursor: "pointer"}}
                            title={`Afficher ${title.toLowerCase()}`} 
                        >
                            <span style={{fontSize: "0.7rem", color: "#999", width: "12px"}}>▶</span>
                            <span className="text-uppercase small" style={{fontSize: "0.65rem"}}>Afficher {title.toLowerCase()}</span>
                        </div>
                    </StickyHeader>
                    <td colSpan={colSpan}></td>
                </tr>
            )}
        </>
    );
}
