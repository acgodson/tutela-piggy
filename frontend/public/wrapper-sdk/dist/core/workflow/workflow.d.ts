import type { WorkflowOptions, WorkflowResponse } from ".";
import { Base } from "../base/base";
export declare class Workflow extends Base {
    private agents;
    private defaultAgents;
    private addedAgents;
    private context;
    private actionQueue;
    private maxIterations;
    private temperature;
    private goal;
    constructor({ agents, model, goal, config }: WorkflowOptions);
    private getAgent;
    private parseTasks;
    private processActionItem;
    private processAgentResponse;
    run(): Promise<WorkflowResponse>;
}
//# sourceMappingURL=workflow.d.ts.map