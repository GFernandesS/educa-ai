import { Injectable } from "@nestjs/common";
import { UserContext } from "src/context/user.context";
import { ChatLoginResponseDto } from "src/dtos/login/chat-login-response-dto";

@Injectable()
export class ChatLoginService {
    constructor(private readonly userContext: UserContext) { }

    validateLogin(): ChatLoginResponseDto {
        return {
            name: this.userContext.value.name,
            role: this.userContext.value.role,
            id: this.userContext.value._id
        }
    }
}
