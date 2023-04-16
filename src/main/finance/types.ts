export enum TransferType {
    TRANSFER = 'transfer',
    CHARGE = 'charge',
    CREDIT = 'credit',
}

export type StatusWithErrorResponse = { success: boolean; failReason: string };
