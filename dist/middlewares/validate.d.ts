import { NextFunction, Request, Response } from "express";
import { z } from "zod";
export declare function validate(schema: z.ZodTypeAny): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=validate.d.ts.map