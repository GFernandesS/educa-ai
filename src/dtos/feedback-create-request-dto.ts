import { FeedbackType } from "src/enums/feedback-type";

export interface FeedbackCreateRequestDto {
    responseId: string,
    type: FeedbackType,
    feedback: string
}