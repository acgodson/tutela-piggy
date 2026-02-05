"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UburuToolHandler = void 0;
class UburuToolHandler {
    tools;
    constructor(tools) {
        this.tools = tools;
    }
    parseToolCalls(text) {
        const toolCalls = [];
        const pattern = /TOOL_CALL:\s*(\{(?:[^{}]|{[^{}]*})*\})/g;
        let match;
        while ((match = pattern.exec(text)) !== null) {
            try {
                const jsonString = match[1];
                if (!jsonString)
                    continue;
                const toolCallData = JSON.parse(jsonString);
                if (toolCallData.name && typeof toolCallData.name === 'string') {
                    toolCalls.push({
                        name: toolCallData.name,
                        arguments: toolCallData.arguments || {},
                        fullMatch: match[0]
                    });
                }
            }
            catch (error) {
                console.warn(`Failed to parse tool call: ${match[1]}`, error);
            }
        }
        return toolCalls;
    }
    async executeToolCalls(toolCalls, messages) {
        const results = [];
        for (const toolCall of toolCalls) {
            const tool = this.tools[toolCall.name];
            if (!tool || !tool.execute) {
                results.push(`Error: Tool '${toolCall.name}' not found or not executable`);
                continue;
            }
            try {
                const result = await tool.execute(toolCall.arguments, {
                    toolCallId: `uburu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    messages,
                });
                const resultString = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
                results.push(`Tool '${toolCall.name}' result: ${resultString}`);
            }
            catch (error) {
                results.push(`Error executing tool '${toolCall.name}': ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return results;
    }
    hasToolCalls(text) {
        return /TOOL_CALL:\s*\{/.test(text);
    }
    removeToolCallsFromText(text) {
        return text.replace(/TOOL_CALL:\s*\{(?:[^{}]|{[^{}]*})*\}/g, '').trim();
    }
}
exports.UburuToolHandler = UburuToolHandler;
//# sourceMappingURL=uburu-tool-handler.js.map