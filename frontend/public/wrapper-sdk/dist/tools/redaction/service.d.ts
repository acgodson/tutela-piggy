import { Tool } from "../../core/tools";
import { z } from "zod";
export declare const defaultSensitivePatterns: {
    type: string;
    patterns: string[];
}[];
export declare const createRedactorService: (config: {
    endpoint: string;
}) => Tool<z.ZodObject<{
    imageUrl: z.ZodOptional<z.ZodString>;
    imagePath: z.ZodOptional<z.ZodString>;
    customPatterns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    outputPath: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    imageUrl?: string | undefined;
    imagePath?: string | undefined;
    customPatterns?: string[] | undefined;
    outputPath?: string | undefined;
}, {
    imageUrl?: string | undefined;
    imagePath?: string | undefined;
    customPatterns?: string[] | undefined;
    outputPath?: string | undefined;
}>>;
//# sourceMappingURL=service.d.ts.map