import { NextFunction, Request, Response } from "express";
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    constructor(statusCode: number, code: string, message: string);
}
export declare function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>>;
//# sourceMappingURL=errorHandler.d.ts.map