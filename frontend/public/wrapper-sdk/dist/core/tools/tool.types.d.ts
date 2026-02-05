import type { Tool } from "ai";
import type { z } from "zod";
export type { Tool, ToolExecutionOptions } from "ai";
export type ToolParams<INPUT = any, OUTPUT = any> = {
    description: string;
    inputSchema: z.ZodSchema<INPUT>;
    execute?: (input: INPUT, options?: any) => OUTPUT | Promise<OUTPUT>;
    inputExamples?: Array<{
        input: INPUT;
    }>;
};
export type ToolSet = Record<string, Tool<any, any>>;
//# sourceMappingURL=tool.types.d.ts.map