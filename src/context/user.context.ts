import { Injectable, Scope } from "@nestjs/common";
import { User } from "src/schemas/user.schema";

@Injectable({ scope: Scope.REQUEST })
export class UserContext {
    private _value: User

    public get value(): User {
        return this._value
    }

    public set value(value) {
        if (!this._value)
            this._value = value
    }
}