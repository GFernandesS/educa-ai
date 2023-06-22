import { HydratedDocument } from "mongoose"
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { UserRole } from "src/enums/user-role"

export type UserDocument = HydratedDocument<User>

@Schema()
export class User {
    @Prop({ required: true, _id: true })
    _id: string

    @Prop({})
    name: string

    @Prop()
    email: string

    @Prop()
    password: string

    @Prop({ required: false, default: 0 })
    totalValidTokens: number

    @Prop({ required: false })
    wasStarted: boolean

    @Prop()
    role: UserRole
}

export const UserSchema = SchemaFactory.createForClass(User)