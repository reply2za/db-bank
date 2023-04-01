export default {
    BANK_IMG:
        'https://static.wikia.nocookie.net/spongebob/images/9/92/Goodbye%2C_Krabby_Patty_151.png/revision/latest?cb=20170310020233',
    TRANSFER_IMG:
        'https://vignette.wikia.nocookie.net/spongebob/images/2/25/Mermaid_Man_and_Barnacle_Boy_III_092.png/revision/latest?cb=20191208224116',
    TRANSFER_IOU_IMG: 'https://i.makeagif.com/media/2-27-2016/cuk9a4.gif',
    REDEEM_IOU_IMG: 'https://i.pinimg.com/originals/a1/b0/59/a1b0599a8c4e26bb279c3b7a2f23dabc.gif',
    SENT_IOU_IMG: 'https://thumbs.gfycat.com/UnlinedSoreDowitcher-size_restricted.gif',
    REDEEMED_IOU_NOTIF_IMG:
        'https://m.media-amazon.com/images/M/MV5BOWZjOTQxNzEtMTk1ZS00ZWU4LWFlOGQtNWQ5MjhiYWM0YmNkXkEyXkFqcGdeQXVyMTM1NTIzOTI1._V1_.jpg',
    CHARGE_TRANSFER_IMG: 'https://assets.teenvogue.com/photos/5dcdb6c29e7c33000970e45b/16:9/w_1280,c_limit/fb.jpg',
    ChargeImages: {
        SB_CREDIT_CARD: 'https://m.media-amazon.com/images/M/MV5BMTk2MDA4MzQ4MV5BMl5BanBnXkFtZTgwNzQzNTEzMjE@._V1_.jpg',
        SW_BILL_LIST: 'https://i.ytimg.com/vi/8G9sFnTgaqY/maxresdefault.jpg',
        MK_BILL_LIST: 'https://pbs.twimg.com/media/EDszbm6XoAAFfcZ.jpg',
    },
    MoneyImages: {
        TINY: 'https://static.wikia.nocookie.net/spongebob/images/8/89/Wet_Painters_185.png/revision/latest?cb=20191215190719',
        SMALL: 'https://static.wikia.nocookie.net/spongebob/images/0/03/Wet_Painters_085.jpg/revision/latest?cb=20150818012516',
        MEDIUM: 'https://static.wikia.nocookie.net/spongebob/images/7/75/One_Coarse_Meal_078.png/revision/latest?cb=20191029022119',
        LARGE: 'https://i.kym-cdn.com/entries/icons/original/000/026/111/4917038d8bbd7fe362bed691690c7da4.jpg',
    },
    getTransferImage(transferAmount: number): string {
        if (transferAmount < 1) {
            return this.MoneyImages.TINY;
        } else if (transferAmount < 5) {
            return this.MoneyImages.SMALL;
        } else if (transferAmount < 20) {
            return this.MoneyImages.MEDIUM;
        } else {
            return this.MoneyImages.LARGE;
        }
    },
    getChargeImage(transferAmount: number): string {
        if (transferAmount < 7) {
            return this.ChargeImages.SB_CREDIT_CARD;
        } else if (transferAmount < 25) {
            return this.ChargeImages.SW_BILL_LIST;
        } else {
            return this.ChargeImages.MK_BILL_LIST;
        }
    },
};
