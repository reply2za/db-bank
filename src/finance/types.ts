export enum TransferType {
    TRANSFER = 'transfer',
    CHARGE = 'charge',
}

export type FinalTransferStatus = { success: boolean; failReason: string };
