type RegisterInput = {
    email: string;
    username: string;
    password: string;
};
type LoginInput = {
    email: string;
    password: string;
};
export declare function registerService(data: RegisterInput): Promise<{
    id: string;
    username: string;
    email: string;
}>;
export declare function loginService(data: LoginInput): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        username: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
    };
}>;
export declare function logoutService(accessToken: string): Promise<boolean>;
export {};
//# sourceMappingURL=auth.service.d.ts.map