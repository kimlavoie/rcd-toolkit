
import { ReactNode } from "react";

interface StickyHeaderProps {
    children: ReactNode;
    top?: string;
    bottom?: string;
    left?: string;
    zIndex?: number;
    className?: string;
    style?: React.CSSProperties;
    isFirstCol?: boolean;
}

export default function StickyHeader({ 
    children, 
    top = "auto", 
    bottom = "auto", 
    left = "0", 
    zIndex = 101, 
    className = "", 
    style = {},
    isFirstCol = false
}: StickyHeaderProps) {
    const stickyStyle: React.CSSProperties = {
        ...style,
        position: "sticky",
        top,
        bottom,
        left: isFirstCol ? left : "auto",
        zIndex: isFirstCol ? zIndex + 5 : zIndex,
        backgroundClip: "padding-box",
        boxShadow: isFirstCol ? "2px 0 5px rgba(0,0,0,0.1)" : "none",
        whiteSpace: isFirstCol ? "nowrap" : "normal",
        minWidth: isFirstCol ? "180px" : "auto"
    };

    return (
        <th className={className} style={stickyStyle}>
            {children}
        </th>
    );
}
