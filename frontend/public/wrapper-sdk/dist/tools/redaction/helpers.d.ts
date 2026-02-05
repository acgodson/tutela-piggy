declare function processSensitiveInformation(ocrResult: any, patterns: any[]): any[];
declare function applyRedactions(imagePath: string, redactionAreas: any[], outputPath?: string): Promise<string | {
    dataUrl: string;
    filename: string;
}>;
declare function getSensitiveCategories(redactionAreas: any[]): Record<string, number>;
export { processSensitiveInformation, applyRedactions, getSensitiveCategories };
//# sourceMappingURL=helpers.d.ts.map