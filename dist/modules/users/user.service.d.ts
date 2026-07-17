type updateUserInput = {
    userId: string;
    username?: string;
    realName?: string;
    newsletter?: boolean;
};
type updateAvatars = {
    userId: string;
    file: Express.Multer.File;
};
export declare function getAllUsersService(query: {
    page?: string;
    limit?: string;
}): Promise<{
    users: {
        id: string;
        username: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
    }[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare function updateUserService(data: updateUserInput): Promise<{
    id: string;
    username: string;
    email: string;
    realName: string | null;
    role: import(".prisma/client").$Enums.Role;
    newsletter: boolean;
    avatarKey: string | null;
}>;
export declare function getMeService(userId: string): Promise<any>;
export declare function updateAvatarMeService(data: updateAvatars): Promise<{
    id: string;
    username: string;
    avatarKey: string | null;
}>;
export declare function deleteMeService(data: {
    userId: string;
    accessToken?: string;
}): Promise<{
    id: string;
    username: string;
    email: string;
    password: string;
    realName: string | null;
    role: import(".prisma/client").$Enums.Role;
    newsletter: boolean;
    avatarKey: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}>;
export declare function updateUserRoleService(userId: string, role: "USER" | "ADMIN"): Promise<{
    id: string;
    username: string;
    email: string;
    role: import(".prisma/client").$Enums.Role;
}>;
export {};
//# sourceMappingURL=user.service.d.ts.map