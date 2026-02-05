import type { z } from "zod";
export declare function createTool<INPUT = any, OUTPUT = any>(params: {
    description: string;
    inputSchema: z.ZodSchema<INPUT>;
    execute?: (input: INPUT, options?: any) => OUTPUT | Promise<OUTPUT>;
    inputExamples?: Array<{
        input: INPUT;
    }>;
}): import("ai").Tool<unknown, unknown>;
//# sourceMappingURL=tool.d.ts.map