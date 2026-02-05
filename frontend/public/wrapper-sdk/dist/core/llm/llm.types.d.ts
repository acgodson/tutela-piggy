import type { ToolSet } from "../tools";
import type { FilePart, ImagePart, ModelMessage, SystemModelMessage, UserModelMessage, AssistantModelMessage } from "ai";
import type { AnyZodObject, z } from "zod";
export type OpenAIModelId = "gpt-4o" | "gpt-4o-mini" | "gpt-4o-2024-05-13" | "gpt-4o-2024-08-06" | "gpt-4o-2024-11-20" | "gpt-4o-audio-preview" | "gpt-4o-audio-preview-2024-10-01" | "gpt-4o-audio-preview-2024-12-17" | "gpt-4o-mini-2024-07-18" | "gpt-4-turbo" | "gpt-4-turbo-2024-04-09" | "gpt-4-turbo-preview" | "gpt-4-0125-preview" | "gpt-4-1106-preview" | "gpt-4" | "gpt-4-0613" | "gpt-3.5-turbo-0125" | "gpt-3.5-turbo" | "gpt-3.5-turbo-1106";
export interface OpenAIModelProvider {
    provider: "openai";
    id: OpenAIModelId;
}
export type AnthropicModelId = "claude-3-5-sonnet-latest" | "claude-3-5-sonnet-20241022" | "claude-3-5-sonnet-20240620" | "claude-3-5-haiku-latest" | "claude-3-5-haiku-20241022" | "claude-3-opus-latest" | "claude-3-opus-20240229" | "claude-3-sonnet-20240229" | "claude-3-haiku-20240307";
export interface AnthropicModelProvider {
    provider: "anthropic";
    id: AnthropicModelId;
}
export type UburuModelId = "uburu-gptc-small";
export interface UburuModelProvider {
    provider: "uburu";
    id: UburuModelId;
    baseURL?: string;
    apiKey?: string;
}
export interface CustomModelProvider {
    provider: "custom";
    id: string;
    baseURL?: string;
    apiKey?: string;
}
export type ModelProvider = OpenAIModelProvider | AnthropicModelProvider | UburuModelProvider | CustomModelProvider;
export type ExtendedModelProvider = ModelProvider;
export type GenerateTextParams = {
    messages: ModelMessage[];
    system?: string | SystemModelMessage | SystemModelMessage[];
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    seed?: number;
    tools?: ToolSet;
};
export type GenerateObjectParams = {
    messages: ModelMessage[];
    system?: string | SystemModelMessage | SystemModelMessage[];
    prompt?: string;
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    seed?: number;
    schema: AnyZodObject;
};
export type LLMParameters = GenerateTextParams | GenerateObjectParams;
export interface LLMStructuredResponse<T extends AnyZodObject> {
    type: "assistant";
    value: z.infer<T>;
}
export interface LLMTextResponse {
    type: "assistant";
    value: string;
}
export type LLMResponse<T extends AnyZodObject> = LLMStructuredResponse<T> | LLMTextResponse;
export type UserContentAttachments = Array<ImagePart | FilePart>;
export type FileAttachment = {
    type: "file";
    data: string;
    mediaType: string;
};
export type ImageAttachment = {
    type: "image";
    image: string;
    mimeType?: string;
};
export type { ModelMessage, SystemModelMessage, UserModelMessage, AssistantModelMessage };
//# sourceMappingURL=llm.types.d.ts.map