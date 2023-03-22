export function roundNumberTwoDecimals(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Converts to currency and shows a maximum of two decimal places. Does not round.
 * @param num
 */
export function convertToCurrency(num: number) {
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
