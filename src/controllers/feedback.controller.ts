import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { FeedbackCreateRequestDto } from "src/dtos/feedback-create-request-dto";
import { FeedbackService } from "src/services/feedback.service";


@Controller('feedback')
export class FeedbackController {

    constructor(private readonly feedbackService: FeedbackService) { }

    @Post()
    @HttpCode(201)
    async createFeedback(@Body() feedbackCreateRequestDto: FeedbackCreateRequestDto) {
        return await this.feedbackService.createFeedback(feedbackCreateRequestDto)
    }
}