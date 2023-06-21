import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ApiKeyContext } from "src/context/apiKey.context";
import { ChatLoginResponseDto } from "src/dtos/login/chat-login-response-dto";
import { ApiKey, ApiKeyDocument } from "src/schemas/apiKey.schema";
import { Session } from "src/schemas/session.schema";

@Injectable()
export class ChatLoginService {
    constructor(@InjectModel(ApiKey.name) private readonly apiKeyModel: Model<ApiKeyDocument>,
        @InjectModel(Session.name) private readonly sessionModel: Model<Session>,
        private readonly apiKeyContext: ApiKeyContext) { }

    validateKey(): ChatLoginResponseDto {
        this.generateDefaultSessionIfNotExists()

        return {
            phoneFilled: Boolean(this.apiKeyContext.value.phone),
            nameFilled: Boolean(this.apiKeyContext.value.description),
            name: this.apiKeyContext.value.description,
        } as ChatLoginResponseDto
    }

    async addInfoToApiKey(phoneNumber: string, name: string, hasAcceptedTermsAndConditions: boolean): Promise<void> {
        if (this.apiKeyContext.value.phone && this.apiKeyContext.value.description)
            return

        await this.apiKeyModel.updateOne({ _id: this.apiKeyContext.value._id }, { $set: { phone: phoneNumber, description: name, hasAcceptedTermsAndConditions } })
    }

    private async generateDefaultSessionIfNotExists() {
        const sessionsCountForApiKey = await this.sessionModel.countDocuments({ apiKey: this.apiKeyContext.value._id }).exec()

        if (sessionsCountForApiKey > 0)
            return

        await this.sessionModel.create(Session.createSessionDefault(this.apiKeyContext.value._id))
    }
}
