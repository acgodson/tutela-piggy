"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedactorService = exports.defaultSensitivePatterns = void 0;
const custom_model_1 = require("../../core/custom-model");
const tools_1 = require("../../core/tools");
const helpers_1 = require("./helpers");
const zod_1 = require("zod");
exports.defaultSensitivePatterns = [
    {
        type: "label",
        patterns: [
            "personal information",
            "given name",
            "given names",
            "name(s)",
            "family name",
            "surname",
            "last name",
            "first name",
            "dob",
            "date of birth",
            "address",
            "phone",
            "email",
            "ssn",
            "social security",
            "passport",
            "id number",
            "license",
        ],
    },
    {
        type: "regex",
        patterns: [
            "\\b[A-Z]{2}\\d{6}\\b",
            "\\b\\d{3}-\\d{2}-\\d{4}\\b",
            "\\b[A-Z][a-z]+\\s[A-Z][a-z]+\\b",
            "\\b[A-Z]+\\s[A-Z]+\\b",
            "\\b\\d{1,2}/\\d{1,2}/\\d{2,4}\\b",
            "\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b",
        ],
    },
];
const createRedactorService = (config) => {
    const modelProvider = {
        provider: "custom",
        id: "florence-2-large",
        endpoint: config.endpoint,
        apiKey: undefined,
    };
    const customModel = new custom_model_1.CustomModel(modelProvider);
    return new tools_1.Tool({
        name: "content_redactor",
        description: "Redacts sensitive information from document based on Florence OCR results",
        parameters: zod_1.z.object({
            imageUrl: zod_1.z
                .string()
                .optional()
                .describe("URL of the image to redact"),
            imagePath: zod_1.z
                .string()
                .optional()
                .describe("Path to the image to redact"),
            customPatterns: zod_1.z
                .array(zod_1.z.string())
                .optional()
                .describe("Additional patterns to redact"),
            outputPath: zod_1.z
                .string()
                .optional()
                .describe("Path to save the redacted document"),
        }),
        provider: "custom",
        execute: async ({ imageUrl, imagePath, customPatterns, outputPath, }) => {
            try {
                if (!imageUrl && !imagePath) {
                    throw new Error("Either imageUrl or imagePath must be provided");
                }
                console.log("Getting OCR regions from Florence...");
                let attachment;
                if (imagePath) {
                    attachment = {
                        type: "file",
                        data: `path:${imagePath}`,
                        mimeType: "image/jpeg",
                    };
                }
                else {
                    attachment = {
                        type: "image",
                        image: imageUrl,
                    };
                }
                const ocrResult = await customModel.generate({
                    task: "<OCR_WITH_REGION>",
                    attachments: [attachment],
                });
                console.log("Processing OCR results for sensitive information...");
                const redactionAreas = (0, helpers_1.processSensitiveInformation)(ocrResult, [
                    ...exports.defaultSensitivePatterns,
                    ...(customPatterns || []).map((p) => ({
                        type: "custom",
                        patterns: [p],
                    })),
                ]);
                console.log(`Applying ${redactionAreas.length} redactions to document...`);
                const redactedImagePath = await (0, helpers_1.applyRedactions)(imageUrl || imagePath, redactionAreas, outputPath);
                return {
                    redactionCount: redactionAreas.length,
                    redactedImagePath,
                    sensitiveCategories: (0, helpers_1.getSensitiveCategories)(redactionAreas),
                    success: true,
                };
            }
            catch (error) {
                console.error("Error in redaction service:", error);
                return {
                    error: `Redaction failed: ${error.message}`,
                    success: false,
                };
            }
        },
    });
};
exports.createRedactorService = createRedactorService;
//# sourceMappingURL=service.js.map