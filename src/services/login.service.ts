import { Injectable } from "@nestjs/common";
import { UserContext } from "src/context/user.context";
import { LoginResponseDto } from "src/dtos/login/login-response-dto";

@Injectable()
export class LoginService {
    constructor(private readonly userContext: UserContext) { }

    validateLogin(): LoginResponseDto {
        return {
            name: this.userContext.value.name,
            role: this.userContext.value.role,
            id: this.userContext.value._id
        }
    }
}
