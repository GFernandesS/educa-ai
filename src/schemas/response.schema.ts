import { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { FeedbackType } from "src/enums/feedback-type";

export type ResponseDocument = HydratedDocument<Response>

export interface FeedbackModel {
    type: FeedbackType,
    feedback: string,
    date: Date
}

@Schema()
export class Response {
    @Prop({ required: true })
    studentId: string

    @Prop({ required: false })
    input: string

    @Prop({ required: false })
    date: Date

    @Prop({ required: true })
    output: string

    @Prop({ required: false, default: 0 })
    tokens: number // Número de tokens contidos somente na resposta, sem considerar o contexto

    @Prop({ required: false })
    isFirstInteraction: boolean

    @Prop({ required: false, default: [] })
    feedbacks: FeedbackModel[]
}


export const ResponseSchema = SchemaFactory.createForClass(Response)