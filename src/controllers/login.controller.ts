import { Controller, Post, HttpCode, HttpStatus, Body } from "@nestjs/common";
import { LoginResponseDto } from "src/dtos/login/login-response-dto";
import { LoginService } from "src/services/login.service";


@Controller('login')
export class LoginController {
    constructor(private readonly chatLoginService: LoginService) { }

    @HttpCode(HttpStatus.OK)
    @Post()
    validateKey(): LoginResponseDto {
        return this.chatLoginService.validateLogin()
    }
}