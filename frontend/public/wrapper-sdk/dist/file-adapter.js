"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.path = exports.fs = void 0;
exports.readFile = readFile;
exports.writeFile = writeFile;
exports.getExtension = getExtension;
exports.getDirname = getDirname;
exports.fileExists = fileExists;
const environment_1 = require("./environment");
let fsPromises = null;
let pathModule = null;
let axiosModule = null;
const loadNodeModules = async () => {
    if (!environment_1.isNode)
        return;
    try {
        const fs = await (0, environment_1.safeImport)("fs");
        if (fs)
            fsPromises = fs.promises || null;
        pathModule = (await (0, environment_1.safeImport)("path")) || null;
        const axios = await (0, environment_1.safeImport)("axios");
        if (axios && axios.default)
            axiosModule = axios.default;
    }
    catch (error) {
        console.warn("Failed to load Node.js modules:", error);
    }
};
if (environment_1.isNode) {
    loadNodeModules();
}
async function readFile(path, options = {}) {
    if (path && path.startsWith("data:")) {
        if (environment_1.isNode) {
            const matches = path.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                throw new Error("Invalid data URL format");
            }
            const base64Data = matches[2];
            if (!base64Data) {
                throw new Error("Invalid base64 data in data URL");
            }
            return Buffer.from(base64Data, "base64");
        }
        else {
            try {
                const response = await fetch(path);
                return await response.arrayBuffer();
            }
            catch (error) {
                throw new Error(`Failed to fetch data URL: ${error.message || "Unknown error"}`);
            }
        }
    }
    if (path && (path.startsWith("http:") || path.startsWith("https:"))) {
        if (environment_1.isBrowser) {
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
                }
                return await response.arrayBuffer();
            }
            catch (error) {
                throw new Error(`Failed to fetch URL: ${error.message || "Unknown error"}`);
            }
        }
        else {
            if (!axiosModule) {
                try {
                    const axios = await (0, environment_1.safeImport)("axios");
                    axiosModule = axios?.default;
                    if (!axiosModule) {
                        throw new Error("Axios module not available");
                    }
                }
                catch (error) {
                    throw new Error(`Failed to load axios: ${error.message || "Unknown error"}`);
                }
            }
            try {
                const response = await axiosModule.get(path, {
                    responseType: "arraybuffer",
                    ...options,
                });
                return response.data;
            }
            catch (error) {
                throw new Error(`Failed to fetch: ${error.message || "Unknown error"}`);
            }
        }
    }
    if (environment_1.isNode) {
        if (!fsPromises) {
            try {
                const fs = await (0, environment_1.safeImport)("fs");
                if (!fs || !fs.promises) {
                    throw new Error("fs.promises not available");
                }
                fsPromises = fs.promises;
            }
            catch (error) {
                throw new Error(`fs module not available: ${error.message || "Unknown error"}`);
            }
        }
        try {
            return await fsPromises.readFile(path, options);
        }
        catch (error) {
            throw new Error(`Failed to read file: ${error.message || "Unknown error"}`);
        }
    }
    throw new Error("Local file paths can only be accessed in Node.js environment");
}
async function writeFile(path, data, options = {}) {
    if (environment_1.isNode) {
        if (!fsPromises) {
            try {
                const fs = await (0, environment_1.safeImport)("fs");
                if (!fs || !fs.promises) {
                    throw new Error("fs.promises not available");
                }
                fsPromises = fs.promises;
            }
            catch (error) {
                throw new Error(`fs module not available: ${error.message || "Unknown error"}`);
            }
        }
        try {
            await fsPromises.writeFile(path, data, options);
            return path;
        }
        catch (error) {
            throw new Error(`Failed to write file: ${error.message || "Unknown error"}`);
        }
    }
    else {
        let blob;
        if (data instanceof ArrayBuffer) {
            blob = new Blob([data], {
                type: options.mimeType || "application/octet-stream",
            });
        }
        else if (typeof data === "string") {
            blob = new Blob([data], {
                type: options.mimeType || "text/plain",
            });
        }
        else {
            try {
                blob = new Blob([data], {
                    type: options.mimeType || "application/octet-stream",
                });
            }
            catch (error) {
                throw new Error(`Failed to create Blob: ${error.message || "Unknown error"}`);
            }
        }
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (e) => reject(new Error(`FileReader error: ${e}`));
            reader.readAsDataURL(blob);
        });
    }
}
function getExtension(path) {
    if (!path)
        return "";
    const lastSlashIndex = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
    const lastDotIndex = path.lastIndexOf(".");
    if (lastDotIndex > lastSlashIndex && lastDotIndex !== -1) {
        return path.substring(lastDotIndex).toLowerCase();
    }
    return "";
}
function getDirname(path) {
    if (environment_1.isNode && pathModule) {
        return pathModule.dirname(path);
    }
    const lastSlashIndex = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
    return lastSlashIndex !== -1 ? path.substring(0, lastSlashIndex) : "";
}
async function fileExists(path) {
    if (!environment_1.isNode)
        return false;
    if (!fsPromises) {
        try {
            const fs = await (0, environment_1.safeImport)("fs");
            if (!fs || !fs.promises) {
                return false;
            }
            fsPromises = fs.promises;
        }
        catch {
            return false;
        }
    }
    try {
        await fsPromises.access(path);
        return true;
    }
    catch {
        return false;
    }
}
exports.fs = {};
exports.path = {};
//# sourceMappingURL=file-adapter.js.map