"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Florence2Tools = Florence2Tools;
const custom_model_1 = require("../../core/custom-model");
const tools_1 = require("../../core/tools");
const zod_1 = require("zod");
function createFlorence2Tool(config) {
    const customModel = new custom_model_1.CustomModel(config.modelProvider);
    const parametersSchema = config.requiresTextInput
        ? zod_1.z.object({
            imageUrl: zod_1.z
                .string()
                .optional()
                .describe("URL of the image to analyze"),
            imagePath: zod_1.z
                .string()
                .optional()
                .describe("Local file path to the image"),
            text: zod_1.z.string().describe("Text input for the model"),
        })
        : zod_1.z.object({
            imageUrl: zod_1.z
                .string()
                .optional()
                .describe("URL of the image to analyze"),
            imagePath: zod_1.z
                .string()
                .optional()
                .describe("Local file path to the image"),
        });
    const validateImageParams = (params) => {
        if (!params.imagePath && !params.imageUrl) {
            throw new Error("Either imagePath or imageUrl must be provided");
        }
    };
    return new tools_1.Tool({
        name: config.name,
        description: config.description,
        parameters: parametersSchema,
        provider: "custom",
        execute: async (params) => {
            try {
                validateImageParams(params);
                let attachment;
                if (params.imagePath) {
                    attachment = {
                        type: "file",
                        data: `path:${params.imagePath}`,
                        mimeType: "image/jpeg",
                    };
                }
                else {
                    attachment = {
                        type: "image",
                        image: params.imageUrl,
                    };
                }
                const response = await customModel.generate({
                    task: config.task,
                    attachments: [attachment],
                    text: "text" in params ? params.text : undefined,
                });
                return response.value;
            }
            catch (error) {
                throw new Error(`Error executing Florence-2 tool: ${error.message || error}`);
            }
        },
    });
}
function Florence2Tools(endpoint, apiKey) {
    const baseProvider = {
        provider: "custom",
        id: "florence-2-large",
        endpoint,
        apiKey,
    };
    return {
        imageCaption: createFlorence2Tool({
            name: "image_caption",
            description: "Generate a caption for an image",
            modelProvider: baseProvider,
            task: "<CAPTION>",
        }),
        detailedCaption: createFlorence2Tool({
            name: "detailed_image_caption",
            description: "Generate a detailed caption for an image",
            modelProvider: baseProvider,
            task: "<DETAILED_CAPTION>",
        }),
        ocr: createFlorence2Tool({
            name: "image_ocr",
            description: "Extract text from an image using OCR",
            modelProvider: baseProvider,
            task: "<OCR>",
        }),
        ocrWithRegion: createFlorence2Tool({
            name: "image_ocr_with_region",
            description: "Extract text and regions from an image using OCR",
            modelProvider: baseProvider,
            task: "<OCR_WITH_REGION>",
        }),
        objectDetection: createFlorence2Tool({
            name: "object_detection",
            description: "Detect objects in an image",
            modelProvider: baseProvider,
            task: "<OD>",
        }),
        phraseGrounding: createFlorence2Tool({
            name: "caption_to_phrase_grounding",
            description: "Ground phrases in an image based on a caption",
            modelProvider: baseProvider,
            task: "<CAPTION_TO_PHRASE_GROUNDING>",
            requiresTextInput: true,
        }),
        referringExpressionSegmentation: createFlorence2Tool({
            name: "referring_expression_segmentation",
            description: "Segment an image based on a referring expression",
            modelProvider: baseProvider,
            task: "<REFERRING_EXPRESSION_SEGMENTATION>",
            requiresTextInput: true,
        }),
    };
}
//# sourceMappingURL=index.js.map