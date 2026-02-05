import type { ToolSet } from "../tools";
import type { ModelMessage } from "ai";
export interface ToolCallMatch {
    name: string;
    arguments: Record<string, any>;
    fullMatch: string;
}
export declare class UburuToolHandler {
    private tools;
    constructor(tools: ToolSet);
    parseToolCalls(text: string): ToolCallMatch[];
    executeToolCalls(toolCalls: ToolCallMatch[], messages: ModelMessage[]): Promise<string[]>;
    hasToolCalls(text: string): boolean;
    removeToolCallsFromText(text: string): string;
}
//# sourceMappingURL=uburu-tool-handler.d.ts.map