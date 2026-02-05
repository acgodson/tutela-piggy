export declare const isBrowser: boolean;
export declare const isNode: boolean;
export declare const ENV: {
    IS_BROWSER: boolean;
    IS_NODE: boolean;
    HAS_FS: boolean;
    HAS_PATH: boolean;
    IS_DEV: boolean;
    IS_TEST: boolean;
    IS_PRODUCTION: boolean;
};
export declare function safeRequire(moduleName: string): any;
export declare function safeImport(moduleName: string): Promise<any>;
//# sourceMappingURL=environment.d.ts.map