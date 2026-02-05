import type { Agent } from "../agent";
import type { ModelProvider, UserContentAttachments } from "../llm";
import { UserModelMessage } from "../llm/llm.types";
export type WorkflowOptions = {
    goal: string | UserModelMessage[];
    agents: Agent[];
    model: ModelProvider;
    config?: {
        maxIterations?: number;
        temperature?: number;
    };
};
export interface AgentAction {
    type: "request" | "complete" | "followup" | "response";
    from: string;
    to: string;
    content: string;
    metadata?: {
        dependencies?: {
            agentName: string;
            task: string;
        }[];
        isTaskComplete?: boolean;
        attachments?: UserContentAttachments[];
        originalTask?: string;
        originalFrom?: string;
    };
}
export interface ContextItem {
    role: string;
    content: unknown;
}
export interface WorkflowResponse {
    content: string;
    context: ContextItem[];
}
export declare enum ActionResponseType {
    FOLLOWUP = "FOLLOWUP:",
    ANSWER = "ANSWER:",
    COMPLETE = "COMPLETE:"
}
export interface RawTask {
    instructions: string[];
    attachments: UserContentAttachments[];
    dependencies: string[];
}
export interface WorkflowTask extends Omit<RawTask, "dependencies"> {
    agentName: string;
    dependencies: {
        agentName: string;
        task: string;
    }[];
}
//# sourceMappingURL=workflow.types.d.ts.map