import { Response } from "express";
export declare function sendResponse<T>(res: Response, data: T, statusCode: 200): Response<any, Record<string, any>>;
export declare function sendPaginated<T>(res: Response, data: T[], meta: {
    page: number;
    limit: number;
    total: number;
}): Response<any, Record<string, any>>;
//# sourceMappingURL=response.d.ts.map