"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const tools_1 = require("../tools");
const vitest_1 = require("vitest");
let fs, path;
let TEST_IMAGES_DIR;
let sampleImages;
const importNodeModules = async () => {
    try {
        const fsModule = await Promise.resolve().then(() => __importStar(require("fs")));
        fs = fsModule.promises;
        path = await Promise.resolve().then(() => __importStar(require("path")));
        return { fs, path };
    }
    catch (error) {
        console.error("Error importing Node.js modules:", error);
        throw error;
    }
};
if (typeof window === "undefined") {
    (0, vitest_1.describe)("redaction/tests", () => {
        (0, vitest_1.beforeAll)(async () => {
            await importNodeModules();
            TEST_IMAGES_DIR = path.join(__dirname, "..", "__test_images__");
            sampleImages = {
                localPath: path.join(TEST_IMAGES_DIR, "info.png"),
            };
            try {
                await fs.mkdir(TEST_IMAGES_DIR, { recursive: true });
                try {
                    await fs.access(sampleImages.localPath);
                }
                catch (error) {
                    throw new Error(`Image not found in local directory: ${sampleImages.localPath}`);
                }
            }
            catch (error) {
                console.error("Error setting up test images directory:", error);
            }
        });
        const providers = [
            {
                provider: "openai",
                id: "gpt-4o",
            },
        ];
        providers.forEach((model) => {
            (0, vitest_1.describe)(`${model.provider}::${model.id}`, () => {
                (0, vitest_1.test)("Redaction Agent with LLM control", async () => {
                    const imagePath = sampleImages.localPath;
                    const agent = (0, tools_1.RedactionAgent)();
                    const result = await agent.generate({
                        messages: [
                            (0, __1.userMessage)(`I need you to redact sensistve information on image at: ${imagePath} using the contentRedactor tool.
                        Please don't ask to see the document, just  redact.`),
                        ],
                    });
                    console.log("Redaction Agent Test Result:", result);
                    (0, vitest_1.expect)(result.type).toBe("assistant");
                    (0, vitest_1.expect)(result.value).toBeDefined();
                });
                (0, vitest_1.test)("Complete Redaction Workflow", async () => {
                    const imagePath = sampleImages.localPath;
                    const redactionAgent = (0, tools_1.RedactionAgent)();
                    const verificationAgent = new __1.Agent({
                        name: "RedactionVerifier",
                        model,
                        description: "Verifies redaction completeness and suggests improvements",
                        instructions: [
                            "You verify that redaction was performed appropriately.",
                            "Review metadata about redactions without seeing document content.",
                            "Specifically check if patient ID and medical record number were properly redacted.",
                            "Suggest additional patterns if certain sensitive information categories might be missed.",
                            "Help users understand what was redacted and if further actions are needed.",
                        ],
                    });
                    const redactionWorkflow = new __1.Workflow({
                        goal: `Securely redact sensitive information from document at ${imagePath}`,
                        agents: [redactionAgent, verificationAgent],
                        model,
                    });
                    const result = await redactionWorkflow.run();
                    console.log("Redaction Workflow Test Result:", result);
                    (0, vitest_1.expect)(result).toBeDefined();
                    (0, vitest_1.expect)(result.content).toBeDefined();
                });
            });
        });
    });
}
//# sourceMappingURL=redaction.test.js.map