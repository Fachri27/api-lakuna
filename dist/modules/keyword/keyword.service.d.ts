import { GetKeywordsInput, CreateKeywordInput } from "./keyword.schema.js";
export declare function getKeywordsService(query: GetKeywordsInput): Promise<{
    data: {
        id: string;
        name: string;
    }[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare function getKeywordByIdService(id: string): Promise<{
    id: string;
    name: string;
}>;
export declare function createKeywordService(data: CreateKeywordInput): Promise<{
    id: string;
    name: string;
}>;
export declare function updateKeywordService(id: string, data: CreateKeywordInput): Promise<{
    id: string;
    name: string;
}>;
export declare function deleteKeywordService(id: string): Promise<{
    success: boolean;
}>;
//# sourceMappingURL=keyword.service.d.ts.map