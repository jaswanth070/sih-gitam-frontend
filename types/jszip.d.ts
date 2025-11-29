declare module "jszip" {
  export default class JSZip {
    constructor(options?: unknown)
    file(name: string, data: ArrayBuffer | Blob | string, options?: unknown): JSZip
    generateAsync(options: { type: "blob" }): Promise<Blob>
  }
}
