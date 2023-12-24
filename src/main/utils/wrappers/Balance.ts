export class Balance {
    private _value: number;

    constructor(value = 0) {
        this._value = value;
    }

    get value(): number {
        return this._value;
    }

    set value(value: number) {
        this._value = value;
    }
}
