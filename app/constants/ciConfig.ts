
export const CI_THRESHOLDS = {
    SESSION: {
        NORMAL: 30,
        YELLOW: 40,
        GREEN: 55
    },
    ANNUAL: {
        NORMAL: 70,
        YELLOW: 80,
        GREEN: 85
    }
};

export const CI_COLORS = {
    INHERIT: "inherit",
    YELLOW: "darkkhaki",
    GREEN: "green",
    RED: "red"
};

export function getCIColor(value: number, type: 'session' | 'annual'): string {
    const thresholds = type === 'session' ? CI_THRESHOLDS.SESSION : CI_THRESHOLDS.ANNUAL;
    
    if (value < thresholds.NORMAL) return CI_COLORS.INHERIT;
    if (value < thresholds.YELLOW) return CI_COLORS.YELLOW;
    if (value < thresholds.GREEN) return CI_COLORS.GREEN;
    return CI_COLORS.RED;
}
