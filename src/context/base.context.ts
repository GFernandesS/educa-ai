export abstract class BaseContext<T>{
    private _value: T

    public get value(): T {
        return this._value
    }

    public set value(value) {
        if (!this._value)
            this._value = value
    }
}