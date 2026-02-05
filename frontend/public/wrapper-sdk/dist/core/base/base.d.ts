import "dotenv/config";
import pino from "pino";
export declare const logger: pino.Logger<never, boolean>;
export type MODULE = "agent" | "llm" | "tools" | "server" | "workflow" | "custom-model";
export declare class Base {
    private logger;
    private module;
    constructor(module: MODULE);
    info(message: string, ...args: unknown[]): void;
}
//# sourceMappingURL=base.d.ts.map