import { HydratedDocument } from "mongoose"
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

export type StudentDocument = HydratedDocument<Student>

@Schema()
export class Student {
    @Prop({ required: true })
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
}

export const StudentSchema = SchemaFactory.createForClass(Student)