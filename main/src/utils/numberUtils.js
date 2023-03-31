"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToCurrency = exports.roundNumberTwoDecimals = void 0;
function roundNumberTwoDecimals(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}
exports.roundNumberTwoDecimals = roundNumberTwoDecimals;
/**
 * Converts to currency and shows a maximum of two decimal places. Does not round.
 * @param num
 */
function convertToCurrency(num) {
    return "$".concat(num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}
exports.convertToCurrency = convertToCurrency;
