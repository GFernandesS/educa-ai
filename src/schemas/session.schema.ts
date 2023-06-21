import { HydratedDocument } from "mongoose"
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { v4 as uuidv4 } from 'uuid'

export type SessionDocument = HydratedDocument<Session>

@Schema()
export class Session {
    @Prop({ required: false, default: uuidv4(), unique: true })
    _id: string

    @Prop({ required: true })
    apiKey: string

    @Prop({ required: false })
    startDate: Date

    @Prop({ required: false })
    totalResponses: number

    @Prop({ required: false, default: 20 })
    permittedQuantityResponses: number

    @Prop({ required: false, default: false })
    currentSession: boolean

    public static createSessionDefault(apiKey: string): Session {
        return {
            _id: uuidv4(),
            apiKey,
            startDate: null,
            totalResponses: 0,
            permittedQuantityResponses: 20,
            currentSession: false,
        } as Session
    }
}

export const SessionSchema = SchemaFactory.createForClass(Session)