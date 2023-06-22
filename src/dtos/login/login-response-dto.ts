import { UserRole } from "src/enums/user-role";

export interface LoginResponseDto {
    name: string,
    role: UserRole,
    id: string
}