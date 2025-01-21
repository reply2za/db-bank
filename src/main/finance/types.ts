export enum TransferType {
    TRANSFER = 'transfer',
    CHARGE = 'charge',
    CREDIT = 'credit',
    TRANSFER_IOU = 'IOU transfer',
}

export enum RedemptionType {
    REDEEM_IOU = 'IOU redemption',
}

export type TransferRedemptionType = TransferType | RedemptionType;

export type StatusWithErrorResponse = { success: boolean; failReason: string };
