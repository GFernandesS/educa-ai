import { HydratedDocument } from "mongoose"
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

export type ApiKeyDocument = HydratedDocument<ApiKey>

@Schema()
export class ApiKey {
    @Prop({ required: true })
    _id: string

    @Prop({ required: false })
    description: string

    @Prop({ required: false })
    phone: string

    @Prop({ required: false, default: 0 })
    totalValidTokens: number

    @Prop({ required: false })
    hasAcceptedTermsAndConditions: boolean

    @Prop({ required: false })
    wasStarted: boolean
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey)