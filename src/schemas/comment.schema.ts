import { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { v4 as uuidV4 } from 'uuid'
import { SchoolMatter } from "src/enums/school-matter";

export type CommentDocument = HydratedDocument<Comment>

@Schema()
export class Comment {
    @Prop({ required: true, default: uuidV4() })
    _id: string

    @Prop({ required: true })
    studentId: string

    @Prop({ required: true })
    teacherId: string

    @Prop({ required: true })
    comment: string

    @Prop({ required: true })
    matter: SchoolMatter
}


export const CommentSchema = SchemaFactory.createForClass(Comment)