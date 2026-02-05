import type { AgentConfig, AgentGenerateParameters, AgentResponse } from ".";
import { Base } from "../base";
export declare class Agent extends Base {
    private _config;
    private _llm;
    constructor(config: AgentConfig);
    get name(): string;
    get description(): string;
    get instructions(): string[] | undefined;
    generate(args: AgentGenerateParameters): Promise<AgentResponse>;
}
//# sourceMappingURL=agent.d.ts.map