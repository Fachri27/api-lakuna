declare module "pdfkit" {
  export default class PDFDocument {
    constructor(options?: { size?: string | number; margin?: number; layout?: string });
    on(event: "data", callback: (chunk: Buffer) => void): this;
    on(event: "end", callback: () => void): this;
    on(event: "error", callback: (err: Error) => void): this;
    fontSize(size: number): this;
    text(content: string, x?: number, y?: number, options?: Record<string, unknown>): this;
    end(): void;
  }
}