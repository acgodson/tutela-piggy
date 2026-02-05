"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = exports.isNode = exports.isBrowser = void 0;
exports.safeRequire = safeRequire;
exports.safeImport = safeImport;
const safeCheck = (checkFn, fallback) => {
    try {
        return checkFn();
    }
    catch (e) {
        return fallback;
    }
};
exports.isBrowser = safeCheck(() => typeof window !== "undefined" &&
    window !== null &&
    typeof window.document !== "undefined" &&
    window.document !== null, false);
exports.isNode = safeCheck(() => {
    if (typeof process === "undefined" || process === null)
        return false;
    if (typeof process.versions === "undefined" || process.versions === null)
        return false;
    return (typeof process.versions.node !== "undefined" &&
        process.versions.node !== null);
}, false);
const getProcessEnv = (key) => {
    try {
        if (typeof process === "undefined" || process === null)
            return undefined;
        if (typeof process.env === "undefined" || process.env === null)
            return undefined;
        return process.env[key];
    }
    catch (e) {
        return undefined;
    }
};
exports.ENV = {
    IS_BROWSER: exports.isBrowser,
    IS_NODE: exports.isNode,
    HAS_FS: exports.isNode,
    HAS_PATH: exports.isNode,
    IS_DEV: getProcessEnv("NODE_ENV") === "development",
    IS_TEST: getProcessEnv("NODE_ENV") === "test",
    IS_PRODUCTION: getProcessEnv("NODE_ENV") === "production" ||
        (getProcessEnv("NODE_ENV") !== "development" &&
            getProcessEnv("NODE_ENV") !== "test"),
};
function safeRequire(moduleName) {
    if (!exports.isNode)
        return null;
    try {
        const req = safeCheck(() => {
            const requireFn = (0, eval)("require");
            return typeof requireFn === "function" ? requireFn : null;
        }, null);
        if (req === null)
            return null;
        return req(moduleName);
    }
    catch (error) {
        console.warn(`Failed to require ${moduleName}`, error);
        return null;
    }
}
async function safeImport(moduleName) {
    if (!exports.isNode)
        return null;
    try {
        return await Promise.resolve(`${moduleName}`).then(s => __importStar(require(s)));
    }
    catch (error) {
        console.warn(`Failed to import ${moduleName}`, error);
        return null;
    }
}
//# sourceMappingURL=environment.js.map