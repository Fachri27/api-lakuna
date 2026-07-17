import { Request } from "express";
import { AuthenticatedUser } from "../types/express.js";
/**
 * Get authenticated user from request with proper typing
 */
export function getAuthUser(req: Request): AuthenticatedUser {
  return req.user as AuthenticatedUser;
}
