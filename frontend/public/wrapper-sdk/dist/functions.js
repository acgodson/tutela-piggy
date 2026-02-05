"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemMessage = exports.assistantMessage = exports.userMessage = void 0;
const userMessage = (content) => {
    return {
        role: "user",
        content,
    };
};
exports.userMessage = userMessage;
const assistantMessage = (content) => {
    return {
        role: "assistant",
        content,
    };
};
exports.assistantMessage = assistantMessage;
const systemMessage = (content) => {
    return {
        role: "system",
        content,
    };
};
exports.systemMessage = systemMessage;
//# sourceMappingURL=functions.js.map