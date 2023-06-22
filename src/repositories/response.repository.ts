import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ResponseDocument, Response } from "src/schemas/response.schema";

@Injectable()
export class ResponseRepository {
    constructor(@InjectModel(Response.name) private readonly responseModel: Model<ResponseDocument>) { }

    async getByApiKeyForContext(apiKey: string): Promise<Response[]> {
        return await this.getByIdAndHasFranchisingContextOrFirstInteractionBaseQuery(apiKey).exec() as Response[]
    }

    async getByApiKeyForContextSortedByDate(apiKey: string): Promise<Response[]> {
        return await this.getByIdAndHasFranchisingContextOrFirstInteractionBaseQuery(apiKey).sort({ date: 1 }).exec() as Response[]
    }

    async generateErrorResponse(inputMessage: string, outputMessage: string, apiKey: string) {
        return await this.responseModel.create({ sessionId: null, apiKey, input: inputMessage, output: outputMessage, date: new Date(), hasFranchisingContext: false, isFirstInteraction: false })
    }

    private getByIdAndHasFranchisingContextOrFirstInteractionBaseQuery(studentId: string): any {
        return this.responseModel.find({ studentId, isFirstInteraction: true })
    }
}

