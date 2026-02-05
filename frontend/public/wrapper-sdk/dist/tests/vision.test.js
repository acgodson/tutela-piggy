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
const custom_model_1 = require("../core/custom-model");
const vitest_1 = require("vitest");
const zod_1 = require("zod");
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
const FLORENCE2_API_ENDPOINT = "http://16.170.217.235:8000";
const florence2Tools = (0, custom_model_1.createFlorence2Tools)(FLORENCE2_API_ENDPOINT);
const testFlags = {
    urlInput: process.env["TEST_URL_INPUT"] === "true",
    fileInput: process.env["TEST_FILE_INPUT"] === "true",
    florenceUrl: process.env["TEST_FLORENCE_URL"] === "true",
    florenceFile: process.env["TEST_FLORENCE_FILE"] === "true",
    workflow: process.env["TEST_WORKFLOW"] === "true",
    all: process.env["TEST_ALL"] === "true" ||
        (!process.env["TEST_URL_INPUT"] &&
            !process.env["TEST_FILE_INPUT"] &&
            !process.env["TEST_FLORENCE_URL"] &&
            !process.env["TEST_FLORENCE_FILE"] &&
            !process.env["TEST_WORKFLOW"]),
};
if (typeof window === "undefined") {
    (0, vitest_1.describe)("vision-agent/tests", () => {
        const providers = [
            {
                provider: "openai",
                id: "gpt-4o",
            },
        ];
        (0, vitest_1.beforeAll)(async () => {
            await importNodeModules();
            TEST_IMAGES_DIR = path.join(__dirname, "..", "__test_images__");
            sampleImages = {
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Chrome_icon_%28September_2014%29.svg/1024px-Google_Chrome_icon_%28September_2014%29.svg.png",
                localPath: path.join(TEST_IMAGES_DIR, "tweet.png"),
            };
        });
        async function readImageFile(filePath) {
            try {
                const fileBuffer = await fs.readFile(filePath);
                const base64 = fileBuffer.toString("base64");
                const extension = path.extname(filePath).toLowerCase();
                const mimeType = extension === ".png"
                    ? "image/png"
                    : extension === ".gif"
                        ? "image/gif"
                        : "image/jpeg";
                return `data:${mimeType};base64,${base64}`;
            }
            catch (error) {
                console.error(`Error reading image file ${filePath}:`, error);
                throw error;
            }
        }
        providers.forEach((model) => {
            (0, vitest_1.describe)(`${model.provider}::${model.id}`, () => {
                if (testFlags.urlInput || testFlags.all) {
                    (0, vitest_1.test)("LLM with image URL input", async () => {
                        const llm = new __1.LLM(model);
                        const schema = zod_1.z.object({
                            description: zod_1.z.string(),
                            colors: zod_1.z.array(zod_1.z.string()),
                            text_content: zod_1.z.string().optional(),
                        });
                        const result = await llm.generate({
                            schema,
                            messages: [
                                (0, __1.userMessage)("Do you recognize what's in this image?"),
                                (0, __1.userMessage)([
                                    {
                                        type: "image",
                                        image: sampleImages.url,
                                    },
                                ]),
                            ],
                        });
                        console.log("LLM Image URL Test Result:", result);
                        (0, vitest_1.expect)(result.type).toBe("assistant");
                        (0, vitest_1.expect)(typeof result.value).toBe("object");
                    });
                }
                if (testFlags.fileInput || testFlags.all) {
                    (0, vitest_1.test)("LLM with image file input", async () => {
                        const llm = new __1.LLM(model);
                        const schema = zod_1.z.object({
                            description: zod_1.z.string(),
                            colors: zod_1.z.array(zod_1.z.string()),
                            text_content: zod_1.z.string().optional(),
                        });
                        const base64Image = await readImageFile(sampleImages.localPath);
                        const result = await llm.generate({
                            schema,
                            messages: [
                                (0, __1.userMessage)("Describe what you see in this image in detail"),
                                (0, __1.userMessage)([
                                    {
                                        type: "image",
                                        image: base64Image,
                                    },
                                ]),
                            ],
                        });
                        console.log("LLM Image File Test Result:", result);
                        (0, vitest_1.expect)(result.type).toBe("assistant");
                        (0, vitest_1.expect)(typeof result.value).toBe("object");
                    });
                }
                if (testFlags.florenceUrl || testFlags.all) {
                    (0, vitest_1.test)("Vision Agent with Florence-2 tools (URL input)", async () => {
                        const visionAgent = new __1.Agent({
                            name: "VisionAgent",
                            model,
                            description: "An agent that can analyze images using the Florence-2 vision model",
                            instructions: [
                                "You can analyze images using advanced computer vision capabilities.",
                                "Use the imageCaption tool to generate a page caption",
                                "After that use the ocr tool to extract and return details from the image",
                            ],
                            tools: {
                                imageCaption: florence2Tools.imageCaption,
                                ocr: florence2Tools.ocr,
                            },
                        });
                        const result = await visionAgent.generate({
                            messages: [
                                (0, __1.userMessage)(`I have an image at ${sampleImages.url}. First use the imageCaption tool with imageUrl=${sampleImages.url} to generate a caption, then use the ocr tool with imageUrl=${sampleImages.url} to extract any text.`),
                            ],
                        });
                        console.log("Vision Agent URL Test Result:", result);
                        (0, vitest_1.expect)(result.type).toBe("assistant");
                        (0, vitest_1.expect)(result.value).toBeDefined();
                    });
                }
                if (testFlags.florenceFile || testFlags.all) {
                    (0, vitest_1.test)("Vision Agent with Florence-2 tools (file input)", async () => {
                        const visionAgent = new __1.Agent({
                            name: "VisionAgent",
                            model,
                            description: "An agent that can analyze images using the Florence-2 vision model",
                            instructions: [
                                "Use the imageCaption tool to generate a page caption",
                                "After that use the ocr tool to extract and return details from the image",
                            ],
                            tools: {
                                imageCaption: florence2Tools.imageCaption,
                                ocr: florence2Tools.ocr,
                            },
                        });
                        const imagePath = sampleImages.localPath;
                        const result = await visionAgent.generate({
                            messages: [
                                (0, __1.userMessage)(`I have an image stored locally. Use the imageCaption tool to generate a caption from our imagePath="${imagePath}" and use the ocr tool to extract any text from the same path`),
                            ],
                        });
                        console.log("Vision Agent File Test Result:", result);
                        (0, vitest_1.expect)(result.type).toBe("assistant");
                        (0, vitest_1.expect)(result.value).toBeDefined();
                    });
                }
                if (testFlags.workflow || testFlags.all) {
                    (0, vitest_1.test)("Complete Workflow with Vision and Content Agents", async () => {
                        const visionAgent = new __1.Agent({
                            name: "VisionAgent",
                            model,
                            description: "An agent that can analyze images using the Florence-2 vision model",
                            instructions: [
                                "Use the imageCaption tool to generate a page caption",
                                "After that use the ocr tool to extract and return details from the image",
                            ],
                            tools: {
                                imageCaption: florence2Tools.imageCaption,
                                ocr: florence2Tools.ocr,
                            },
                        });
                        const contentAgent = new __1.Agent({
                            name: "ContentCreator",
                            model,
                            description: "An agent that creates content based on image analysis",
                            instructions: [
                                "You create high-quality content based on image analysis from the vision agent.",
                                "Generate creative and engaging content that incorporates the image analysis.",
                            ],
                        });
                        const goal = [
                            (0, __1.userMessage)(`Analyze the image from imageUrl=${sampleImages.url} and create engaging content based on it`),
                        ];
                        const imageContentWorkflow = new __1.Workflow({
                            goal: goal,
                            agents: [visionAgent, contentAgent],
                            model,
                        });
                        const result = await imageContentWorkflow.run();
                        console.log("Workflow Test Result:", result);
                        (0, vitest_1.expect)(result).toBeDefined();
                        (0, vitest_1.expect)(result.content).toBeDefined();
                    });
                }
            });
        });
    });
}
//# sourceMappingURL=vision.test.js.map