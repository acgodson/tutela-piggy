import { Base } from "../base";
import type { LLMParameters, LLMResponse, ModelProvider } from "./llm.types";
import type { AnyZodObject } from "zod";
export declare class LLM extends Base {
    private model;
    constructor(provider: ModelProvider);
    generate<ZOD_OBJECT extends AnyZodObject>(args: LLMParameters, viaAgent?: boolean): Promise<LLMResponse<ZOD_OBJECT>>;
}
//# sourceMappingURL=llm.d.ts.map