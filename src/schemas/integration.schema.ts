import { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { IntegrationType } from "src/enums/integration-type"


export type IntegrationDocument = HydratedDocument<Integration>

@Schema()
export class Integration {
    @Prop({ unique: true })
    _id: string

    @Prop({ required: true })
    apiKey: string

    @Prop({ required: false })
    type: IntegrationType
}


export const IntegrationSchema = SchemaFactory.createForClass(Integration)