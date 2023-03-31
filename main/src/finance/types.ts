export enum TransferType {
    TRANSFER = 'transfer',
    CHARGE = 'charge',
}

export type StatusWithErrorResponse = { success: boolean; failReason: string };
