import { ReactNode, memo } from "react";

interface StickyCellProps {
    children: ReactNode;
    top?: string;
    bottom?: string;
    left?: string;
    zIndex?: number;
    className?: string;
    style?: React.CSSProperties;
}
const StickyCell = memo(function StickyCell({ 
    children, 
    top = "auto", 
    bottom = "auto", 
    left = "auto", 
    zIndex = 100, 
    className = "", 
    style = {} 
}: StickyCellProps) {
    const stickyStyle: React.CSSProperties = {
        ...style,
        position: "sticky",
        top,
        bottom,
        left,
        zIndex,
        backgroundClip: "padding-box"
    };

    return (
        <td className={className} style={stickyStyle}>
            {children}
        </td>
    );
});

export default StickyCell;
