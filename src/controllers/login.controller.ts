import { Controller, Post, HttpCode, HttpStatus, Body } from "@nestjs/common";
import { ChatLoginAddInfoDto } from "src/dtos/login/chat-login-add-info-dto";
import { ChatLoginResponseDto } from "src/dtos/login/chat-login-response-dto";
import { ChatLoginService } from "src/services/chat.login.service";


@Controller('login')
export class LoginController {
    constructor(private readonly chatLoginService: ChatLoginService) { }

    @HttpCode(HttpStatus.OK)
    @Post()
    validateKey(): ChatLoginResponseDto {
        return this.chatLoginService.validateKey()
    }

    @HttpCode(HttpStatus.OK)
    @Post('additional-info')
    async addInfoFromLoginToApiKey(@Body() apiKeyAdditionalInfo: ChatLoginAddInfoDto) {
        await this.chatLoginService.addInfoToApiKey(apiKeyAdditionalInfo.phone, apiKeyAdditionalInfo.name, apiKeyAdditionalInfo.hasAcceptedTermsAndConditions)
    }
}