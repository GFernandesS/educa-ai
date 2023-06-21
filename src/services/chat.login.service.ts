import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { StudentContext } from "src/context/student.context";
import { ChatLoginResponseDto } from "src/dtos/login/chat-login-response-dto";
import { Student, StudentDocument } from "src/schemas/student.schema";
import { Session } from "src/schemas/session.schema";

@Injectable()
export class ChatLoginService {
    constructor(@InjectModel(Student.name) private readonly apiKeyModel: Model<StudentDocument>,
        @InjectModel(Session.name) private readonly sessionModel: Model<Session>,
        private readonly apiKeyContext: StudentContext) { }

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
