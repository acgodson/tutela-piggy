"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSensitivePatterns = exports.createRedactorService = exports.RedactionAgent = exports.RedactionTool = void 0;
const __1 = require("../../");
const service_1 = require("./service");
Object.defineProperty(exports, "createRedactorService", { enumerable: true, get: function () { return service_1.createRedactorService; } });
Object.defineProperty(exports, "defaultSensitivePatterns", { enumerable: true, get: function () { return service_1.defaultSensitivePatterns; } });
const FLORENCE2_API_ENDPOINT = "http://16.170.217.235:8000";
const RedactionTool = () => {
    return (0, service_1.createRedactorService)({ endpoint: FLORENCE2_API_ENDPOINT });
};
exports.RedactionTool = RedactionTool;
const RedactionAgent = () => {
    const model = {
        provider: "openai",
        id: "gpt-4o",
    };
    const redactionTool = RedactionTool();
    return new __1.Agent({
        name: "RedactionAgent",
        description: "An agent that anonymizes ocuments without seeing the content",
        instructions: [
            "Use the contentRedactor tool to remove portions bearing ientity information of user",
            `You help users redact sensitive information and patterns like ${service_1.defaultSensitivePatterns} from documents.`,
            "NEVER ask to see the actual document content.",
            "Return the results in same structured format",
        ],
        tools: {
            contentRedactor: redactionTool,
        },
        model,
    });
};
exports.RedactionAgent = RedactionAgent;
//# sourceMappingURL=index.js.map