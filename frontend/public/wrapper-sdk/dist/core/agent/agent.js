"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const functions_1 = require("../../functions");
const base_1 = require("../base");
const llm_1 = require("../llm");
class Agent extends base_1.Base {
    _config;
    _llm;
    constructor(config) {
        super("agent");
        this._config = config;
        this._llm = new llm_1.LLM(config.model);
    }
    get name() {
        return this._config.name;
    }
    get description() {
        return this._config.description;
    }
    get instructions() {
        return this._config.instructions;
    }
    async generate(args) {
        const _messages = [
            (0, functions_1.systemMessage)(this.description),
            ...(this.instructions?.map(functions_1.systemMessage) ?? []),
            ...(args.messages ?? []),
        ];
        const response = await this._llm.generate({
            ...args,
            tools: this._config.tools,
            messages: _messages,
            temperature: this._config.temperature,
        }, true);
        return response;
    }
}
exports.Agent = Agent;
//# sourceMappingURL=agent.js.map