"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLM = void 0;
const base_1 = require("../base");
const anthropic_1 = require("@ai-sdk/anthropic");
const openai_1 = require("@ai-sdk/openai");
const ai_1 = require("ai");
const uburu = (options) => {
    const baseURL = options?.baseURL || "http://54.246.213.85:8080";
    const apiKey = options?.apiKey || "dummy-key";
    return (0, openai_1.createOpenAI)({
        name: "uburu",
        baseURL,
        apiKey,
    });
};
class LLM extends base_1.Base {
    model;
    constructor(provider) {
        super("llm");
        switch (provider.provider) {
            case "openai":
                this.model = (0, openai_1.openai)(provider.id);
                break;
            case "anthropic":
                this.model = (0, anthropic_1.anthropic)(provider.id);
                break;
            case "uburu":
                const uburuProvider = uburu({
                    baseURL: provider.baseURL,
                    apiKey: provider.apiKey,
                });
                this.model = uburuProvider(provider.id);
                break;
            case "custom":
                const customProvider = (0, openai_1.createOpenAI)({
                    name: "custom",
                    baseURL: provider.baseURL,
                    apiKey: provider.apiKey || "dummy-key",
                });
                this.model = customProvider(provider.id);
                break;
            default:
                throw new Error(`Unsupported provider: ${provider.provider}`);
        }
    }
    async generate(args, viaAgent = false) {
        try {
            const hasTools = "tools" in args && Object.keys(args.tools ?? {}).length > 0;
            const hasSchema = "schema" in args && args.schema;
            const isTextResponse = viaAgent || hasTools || !hasSchema;
            if (isTextResponse) {
                const textArgs = args;
                const { tools, ...restArgs } = textArgs;
                if (!restArgs.messages) {
                    throw new Error("Messages are required for text generation");
                }
                const response = await (0, ai_1.generateText)({
                    model: this.model,
                    maxRetries: 5,
                    messages: restArgs.messages,
                    system: restArgs.system,
                    temperature: restArgs.temperature,
                    maxOutputTokens: restArgs.maxOutputTokens,
                    topP: restArgs.topP,
                    frequencyPenalty: restArgs.frequencyPenalty,
                    presencePenalty: restArgs.presencePenalty,
                    seed: restArgs.seed,
                    tools: tools,
                    toolChoice: tools ? "auto" : undefined,
                    stopWhen: viaAgent ? (0, ai_1.stepCountIs)(2) : (0, ai_1.stepCountIs)(1),
                });
                return {
                    type: "assistant",
                    value: response.text,
                };
            }
            else {
                const objectArgs = args;
                if (!objectArgs.messages) {
                    throw new Error("Messages are required for object generation");
                }
                if (!objectArgs.schema) {
                    throw new Error("Schema is required for object generation");
                }
                const result = await (0, ai_1.generateObject)({
                    model: this.model,
                    maxRetries: 5,
                    messages: objectArgs.messages,
                    system: objectArgs.system,
                    temperature: objectArgs.temperature,
                    maxOutputTokens: objectArgs.maxOutputTokens,
                    schema: objectArgs.schema,
                });
                return {
                    type: "assistant",
                    value: result.object,
                };
            }
        }
        catch (error) {
            throw new Error(`Failed to parse response: ${error}`);
        }
    }
}
exports.LLM = LLM;
//# sourceMappingURL=llm.js.map