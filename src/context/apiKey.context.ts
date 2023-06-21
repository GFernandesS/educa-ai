import { Injectable, Scope } from "@nestjs/common";
import { ApiKey } from "src/schemas/apiKey.schema";
import { BaseContext } from "./base.context";

@Injectable({ scope: Scope.REQUEST })
export class ApiKeyContext extends BaseContext<ApiKey> {
}