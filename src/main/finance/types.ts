export enum TransferType {
    TRANSFER = 'transfer',
    CHARGE = 'charge',
    CREDIT = 'credit',
    TRANSFER_IOU = 'IOU transfer',
}

export type StatusWithErrorResponse = { success: boolean; failReason: string };
