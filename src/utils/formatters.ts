/**
 * Converts a number or string number to its ordinal representation (e.g. 1 -> 1st, 2 -> 2nd).
 *
 * @param {string | number} n - The number to convert
 * @returns {string} The ordinal string
 */
export const getOrdinal = (n: string | number): string => {
    const v = typeof n === 'string' ? parseInt(n, 10) : n;

    if (isNaN(v)) return String(n);

    const j = v % 10;
    const k = v % 100;
    if (j === 1 && k !== 11) {
        return v + "st";
    }
    if (j === 2 && k !== 12) {
        return v + "nd";
    }
    if (j === 3 && k !== 13) {
        return v + "rd";
    }
    return v + "th";
};
