export declare function readFile(path: string, options?: object): Promise<ArrayBuffer | Buffer>;
export declare function writeFile(path: string, data: any, options?: {
    mimeType?: string;
}): Promise<string>;
export declare function getExtension(path: string): string;
export declare function getDirname(path: string): string;
export declare function fileExists(path: string): Promise<boolean>;
export declare const fs: {};
export declare const path: {};
//# sourceMappingURL=file-adapter.d.ts.map