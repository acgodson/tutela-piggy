import type { UserContentAttachments, UserModelMessage, AssistantModelMessage, SystemModelMessage } from "./core/llm/llm.types";
export declare const userMessage: (content: string | UserContentAttachments) => UserModelMessage;
export declare const assistantMessage: (content: string) => AssistantModelMessage;
export declare const systemMessage: (content: string) => SystemModelMessage;
//# sourceMappingURL=functions.d.ts.map