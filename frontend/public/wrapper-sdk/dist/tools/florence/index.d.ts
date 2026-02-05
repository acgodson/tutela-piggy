import { Tool } from "../../core/tools";
import { z } from "zod";
export declare function Florence2Tools(endpoint: string, apiKey?: string): {
    imageCaption: Tool<z.ZodObject<{
        imageUrl: z.ZodOptional<z.ZodString>;
        imagePath: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        imageUrl?: string | undefined;
        imagePath?: string | undefined;
    }, {
        imageUrl?: string | undefined;
        imagePath?: string | undefined;
    }>>;
    detailedCaption: Tool<z.ZodObject<{
        imageUrl: z.ZodOptional<z.ZodString>;
        imagePath: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        imageUrl?: string | undefined;
        imagePath?: string | undefined;
    }, {
        imageUrl?: string | undefined;
        imagePath?: string | undefined;
    }>>;
    ocr: Tool<z.ZodObject<{
        imageUrl: z.ZodOptional<z.ZodString>;
        imagePath: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        imageUrl?: string | undefined;
        imagePath?: string | undefined;
    }, {
        imageUrl?: string | undefined;
        imagePath?: string | undefined;
    }>>;
    ocrWithRegion: Tool<z.ZodObject<{
        imageUrl: z.ZodOptional<z.ZodString>;
        imagePath: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        imageUrl?: string | undefined;
        imagePath?: string | undefined;
    }, {
        imageUrl?: string | undefined;
        imagePath?: string | undefined;
    }>>;
    objectDetection: Tool<z.ZodObject<{
        imageUrl: z.ZodOptional<z.ZodString>;
        imagePath: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        imageUrl?: string | undefined;
        imagePath?: string | undefined;
    }, {
        imageUrl?: string | undefined;
        imagePath?: string | undefined;
    }>>;
    phraseGrounding: Tool<z.ZodObject<{
        imageUrl: z.ZodOptional<z.ZodString>;
        imagePath: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        imageUrl?: string | undefined;
        imagePath?: string | undefined;
    }, {
        imageUrl?: string | undefined;
        imagePath?: string | undefined;
    }>>;
    referringExpressionSegmentation: Tool<z.ZodObject<{
        imageUrl: z.ZodOptional<z.ZodString>;
        imagePath: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        imageUrl?: string | undefined;
        imagePath?: string | undefined;
    }, {
        imageUrl?: string | undefined;
        imagePath?: string | undefined;
    }>>;
};
//# sourceMappingURL=index.d.ts.map