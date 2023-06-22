import { UserRole } from "src/enums/user-role";

export interface ChatLoginResponseDto {
    name: string,
    role: UserRole,
    id: string
}