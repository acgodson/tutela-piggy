"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSensitiveInformation = processSensitiveInformation;
exports.applyRedactions = applyRedactions;
exports.getSensitiveCategories = getSensitiveCategories;
const file_adapter_1 = require("../../file-adapter");
const jimp_1 = require("jimp");
function processSensitiveInformation(ocrResult, patterns) {
    const redactionAreas = [];
    let ocrData = null;
    if (ocrResult && ocrResult["<OCR_WITH_REGION>"]) {
        ocrData = ocrResult["<OCR_WITH_REGION>"];
    }
    else if (ocrResult &&
        ocrResult.value &&
        ocrResult.value["<OCR_WITH_REGION>"]) {
        if (ocrResult.value["<OCR_WITH_REGION>"]["<OCR_WITH_REGION>"]) {
            ocrData = ocrResult.value["<OCR_WITH_REGION>"]["<OCR_WITH_REGION>"];
        }
        else {
            ocrData = ocrResult.value["<OCR_WITH_REGION>"];
        }
    }
    else if (ocrResult &&
        ocrResult.rawResponse &&
        ocrResult.rawResponse.result &&
        ocrResult.rawResponse.result["<OCR_WITH_REGION>"]) {
        ocrData = ocrResult.rawResponse.result["<OCR_WITH_REGION>"];
    }
    if (!ocrData) {
        console.warn("Invalid OCR result format:", ocrResult);
        return [];
    }
    const quadBoxes = ocrData.quad_boxes || [];
    const labels = ocrData.labels || [];
    console.log(`OCR found ${labels.length} text elements`);
    const labelIndices = new Set();
    const valuesToRedact = new Set();
    for (let i = 0; i < labels.length; i++) {
        const text = labels[i];
        if (!text)
            continue;
        const cleanedText = text.replace(/^<\/s>/, "").trim();
        const lowerText = cleanedText.toLowerCase();
        const labelPatterns = patterns.find((p) => p.type === "label")?.patterns || [];
        const isLabelMatch = labelPatterns.some((pattern) => lowerText.includes(pattern.toLowerCase()));
        if (isLabelMatch) {
            labelIndices.add(i);
            const area = quadBoxes[i];
            if (!area)
                continue;
            const labelX1 = area[0];
            const labelY1 = area[1];
            const labelX2 = area[2];
            const labelY2 = area[5];
            let bestMatchIndex = -1;
            let smallestDistance = Infinity;
            for (let j = 0; j < labels.length; j++) {
                if (i === j)
                    continue;
                const valueArea = quadBoxes[j];
                if (!valueArea)
                    continue;
                const valueX1 = valueArea[0];
                const valueY1 = valueArea[1];
                const onSameRow = Math.abs(valueY1 - labelY1) < 30;
                const isBelow = valueY1 > labelY2 && Math.abs(valueX1 - labelX1) < 50;
                if (onSameRow && valueX1 > labelX2) {
                    const distance = valueX1 - labelX2;
                    if (distance < smallestDistance) {
                        smallestDistance = distance;
                        bestMatchIndex = j;
                    }
                }
                else if (isBelow) {
                    const distance = valueY1 - labelY2;
                    if (distance < smallestDistance) {
                        smallestDistance = distance;
                        bestMatchIndex = j;
                    }
                }
            }
            if (bestMatchIndex !== -1) {
                valuesToRedact.add(bestMatchIndex);
                console.log(`Found associated value for "${cleanedText}": "${labels[bestMatchIndex]}"`);
            }
        }
    }
    for (let i = 0; i < labels.length; i++) {
        if (labelIndices.has(i))
            continue;
        const text = labels[i];
        const area = quadBoxes[i];
        if (!text || !area)
            continue;
        const cleanedText = text.replace(/^<\/s>/, "").trim();
        const regexPatterns = patterns.find((p) => p.type === "regex")?.patterns || [];
        const isRegexMatch = regexPatterns.some((pattern) => {
            const regex = new RegExp(pattern, "i");
            return regex.test(cleanedText);
        });
        const customPatterns = patterns
            .filter((p) => p.type === "custom")
            .flatMap((p) => p.patterns);
        const isCustomMatch = customPatterns.some((pattern) => cleanedText.toLowerCase().includes(pattern.toLowerCase()));
        if (isRegexMatch || isCustomMatch || valuesToRedact.has(i)) {
            redactionAreas.push({
                area,
                text: cleanedText,
                type: valuesToRedact.has(i)
                    ? "associated_value"
                    : isRegexMatch
                        ? "regex"
                        : "custom",
            });
        }
    }
    console.log(`Found ${redactionAreas.length} areas to redact: ${JSON.stringify(redactionAreas.map((r) => r.text))}`);
    return redactionAreas;
}
async function applyRedactions(imagePath, redactionAreas, outputPath) {
    try {
        const isUrl = imagePath.startsWith("http");
        const ext = (0, file_adapter_1.getExtension)(isUrl ? new URL(imagePath).pathname : imagePath);
        if (ext === ".pdf") {
            throw new Error("PDF redaction not yet implemented");
        }
        else {
            const imageData = await (0, file_adapter_1.readFile)(imagePath);
            const image = await jimp_1.Jimp.read(imageData);
            for (const redaction of redactionAreas) {
                const { area } = redaction;
                if (area && area.length >= 8) {
                    const xs = [area[0], area[2], area[4], area[6]];
                    const ys = [area[1], area[3], area[5], area[7]];
                    const minX = Math.min(...xs);
                    const minY = Math.min(...ys);
                    const width = Math.max(...xs) - minX;
                    const height = Math.max(...ys) - minY;
                    image.scan(minX, minY, width, height, function (x, y, idx) {
                        this.bitmap.data[idx + 0] = 0;
                        this.bitmap.data[idx + 1] = 0;
                        this.bitmap.data[idx + 2] = 0;
                    });
                }
            }
            const outputFilePath = outputPath || `redacted_${Date.now()}${ext}`;
            if (typeof window !== "undefined") {
                return new Promise((resolve, reject) => {
                    image
                        .getBase64("image/jpeg")
                        .then((dataUrl) => {
                        resolve({
                            dataUrl,
                            filename: outputFilePath,
                        });
                    })
                        .catch(reject);
                });
            }
            else {
                const buffer = await image.getBuffer("image/jpeg");
                await (0, file_adapter_1.writeFile)(outputFilePath, buffer);
                return outputFilePath;
            }
        }
    }
    catch (error) {
        console.error("Error applying redactions:", error);
        throw error;
    }
}
function getSensitiveCategories(redactionAreas) {
    const categories = {};
    for (const redaction of redactionAreas) {
        const type = redaction.type || "unknown";
        categories[type] = (categories[type] || 0) + 1;
    }
    return categories;
}
//# sourceMappingURL=helpers.js.map