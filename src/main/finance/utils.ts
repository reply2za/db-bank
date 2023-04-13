/**
 * Calculates the total of a string containing numbers and operators (+, -).
 * @param str The string to calculate the total of.
 */
export function calculateTotal(str: string): string {
    const arr = str.match(/[+\-]?(\s*[0-9.]+\s*)/g) || [];
    if (!arr[0]) return str;
    let total = Number(arr[0]);
    for (let i = 1; i < arr.length; i++) {
        const operator = arr[i][0];
        const number = Number(arr[i].substring(1));
        switch (operator) {
            case '+':
                total += number;
                break;
            case '-':
                total -= number;
                break;
            default:
                return str;
        }
    }
    return total.toString();
}
