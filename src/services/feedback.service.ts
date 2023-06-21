import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Response, ResponseDocument } from '../schemas/response.schema'
import { Model } from "mongoose";
import { FeedbackCreateRequestDto } from "src/dtos/feedback-create-request-dto";


@Injectable()
export class FeedbackService {
    constructor(@InjectModel(Response.name) private readonly responseModel: Model<ResponseDocument>) { }

    async createFeedback(feedbackRequest: FeedbackCreateRequestDto) {
        if (!feedbackRequest.responseId || feedbackRequest.type == null)
            throw new BadRequestException('O tipo de feedback e o ID de resposta vinculado são obrigatórios')

        await this.responseModel.updateOne({ _id: feedbackRequest.responseId }, {
            "$push": {
                "feedbacks": {
                    type: feedbackRequest.type,
                    feedback: feedbackRequest.feedback,
                    date: new Date()
                }
            }
        })
    }
}