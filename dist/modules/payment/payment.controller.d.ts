import type { Request, Response, NextFunction } from "express";
export declare function webhookController(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
export declare function getPaymentStatusController(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function checkOrderStatusController(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function checkSubscriptionPaymentController(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=payment.controller.d.ts.map