import { Injectable, Scope } from "@nestjs/common";
import { Student } from "src/schemas/student.schema";

@Injectable({ scope: Scope.REQUEST })
export class StudentContext {
    private _value: Student

    public get value(): Student {
        return this._value
    }

    public set value(value) {
        if (!this._value)
            this._value = value
    }
}