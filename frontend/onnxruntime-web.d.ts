declare module 'onnxruntime-web' {
  export const env: { wasm: { wasmPaths: string } };
  export class InferenceSession {
    static create(modelUrl: string, options?: any): Promise<InferenceSession>;
    run(feeds: Record<string, any>): Promise<Record<string, any>>;
  }
  export class Tensor<T extends string = any> {
    constructor(type: T, data: Float32Array | Int32Array | any, dims: number[]);
  }
}



