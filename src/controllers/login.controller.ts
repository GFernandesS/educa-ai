import { Controller, Post, HttpCode, HttpStatus, Body } from "@nestjs/common";
import { ChatLoginResponseDto } from "src/dtos/login/chat-login-response-dto";
import { ChatLoginService } from "src/services/chat.login.service";


@Controller('login')
export class LoginController {
    constructor(private readonly chatLoginService: ChatLoginService) { }

    @HttpCode(HttpStatus.OK)
    @Post()
    validateKey(): ChatLoginResponseDto {
        return this.chatLoginService.validateLogin()
    }
}