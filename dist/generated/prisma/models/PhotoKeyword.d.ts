import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
/**
 * Model PhotoKeyword
 *
 */
export type PhotoKeywordModel = runtime.Types.Result.DefaultSelection<Prisma.$PhotoKeywordPayload>;
export type AggregatePhotoKeyword = {
    _count: PhotoKeywordCountAggregateOutputType | null;
    _min: PhotoKeywordMinAggregateOutputType | null;
    _max: PhotoKeywordMaxAggregateOutputType | null;
};
export type PhotoKeywordMinAggregateOutputType = {
    id: string | null;
    photoId: string | null;
    keywordId: string | null;
};
export type PhotoKeywordMaxAggregateOutputType = {
    id: string | null;
    photoId: string | null;
    keywordId: string | null;
};
export type PhotoKeywordCountAggregateOutputType = {
    id: number;
    photoId: number;
    keywordId: number;
    _all: number;
};
export type PhotoKeywordMinAggregateInputType = {
    id?: true;
    photoId?: true;
    keywordId?: true;
};
export type PhotoKeywordMaxAggregateInputType = {
    id?: true;
    photoId?: true;
    keywordId?: true;
};
export type PhotoKeywordCountAggregateInputType = {
    id?: true;
    photoId?: true;
    keywordId?: true;
    _all?: true;
};
export type PhotoKeywordAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which PhotoKeyword to aggregate.
     */
    where?: Prisma.PhotoKeywordWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PhotoKeywords to fetch.
     */
    orderBy?: Prisma.PhotoKeywordOrderByWithRelationInput | Prisma.PhotoKeywordOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.PhotoKeywordWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PhotoKeywords from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PhotoKeywords.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned PhotoKeywords
    **/
    _count?: true | PhotoKeywordCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: PhotoKeywordMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: PhotoKeywordMaxAggregateInputType;
};
export type GetPhotoKeywordAggregateType<T extends PhotoKeywordAggregateArgs> = {
    [P in keyof T & keyof AggregatePhotoKeyword]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregatePhotoKeyword[P]> : Prisma.GetScalarType<T[P], AggregatePhotoKeyword[P]>;
};
export type PhotoKeywordGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PhotoKeywordWhereInput;
    orderBy?: Prisma.PhotoKeywordOrderByWithAggregationInput | Prisma.PhotoKeywordOrderByWithAggregationInput[];
    by: Prisma.PhotoKeywordScalarFieldEnum[] | Prisma.PhotoKeywordScalarFieldEnum;
    having?: Prisma.PhotoKeywordScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PhotoKeywordCountAggregateInputType | true;
    _min?: PhotoKeywordMinAggregateInputType;
    _max?: PhotoKeywordMaxAggregateInputType;
};
export type PhotoKeywordGroupByOutputType = {
    id: string;
    photoId: string;
    keywordId: string;
    _count: PhotoKeywordCountAggregateOutputType | null;
    _min: PhotoKeywordMinAggregateOutputType | null;
    _max: PhotoKeywordMaxAggregateOutputType | null;
};
export type GetPhotoKeywordGroupByPayload<T extends PhotoKeywordGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<PhotoKeywordGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof PhotoKeywordGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], PhotoKeywordGroupByOutputType[P]> : Prisma.GetScalarType<T[P], PhotoKeywordGroupByOutputType[P]>;
}>>;
export type PhotoKeywordWhereInput = {
    AND?: Prisma.PhotoKeywordWhereInput | Prisma.PhotoKeywordWhereInput[];
    OR?: Prisma.PhotoKeywordWhereInput[];
    NOT?: Prisma.PhotoKeywordWhereInput | Prisma.PhotoKeywordWhereInput[];
    id?: Prisma.StringFilter<"PhotoKeyword"> | string;
    photoId?: Prisma.StringFilter<"PhotoKeyword"> | string;
    keywordId?: Prisma.StringFilter<"PhotoKeyword"> | string;
    photo?: Prisma.XOR<Prisma.PhotoScalarRelationFilter, Prisma.PhotoWhereInput>;
    keyword?: Prisma.XOR<Prisma.KeywordScalarRelationFilter, Prisma.KeywordWhereInput>;
};
export type PhotoKeywordOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    photoId?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    photo?: Prisma.PhotoOrderByWithRelationInput;
    keyword?: Prisma.KeywordOrderByWithRelationInput;
    _relevance?: Prisma.PhotoKeywordOrderByRelevanceInput;
};
export type PhotoKeywordWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    photoId_keywordId?: Prisma.PhotoKeywordPhotoIdKeywordIdCompoundUniqueInput;
    AND?: Prisma.PhotoKeywordWhereInput | Prisma.PhotoKeywordWhereInput[];
    OR?: Prisma.PhotoKeywordWhereInput[];
    NOT?: Prisma.PhotoKeywordWhereInput | Prisma.PhotoKeywordWhereInput[];
    photoId?: Prisma.StringFilter<"PhotoKeyword"> | string;
    keywordId?: Prisma.StringFilter<"PhotoKeyword"> | string;
    photo?: Prisma.XOR<Prisma.PhotoScalarRelationFilter, Prisma.PhotoWhereInput>;
    keyword?: Prisma.XOR<Prisma.KeywordScalarRelationFilter, Prisma.KeywordWhereInput>;
}, "id" | "photoId_keywordId">;
export type PhotoKeywordOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    photoId?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
    _count?: Prisma.PhotoKeywordCountOrderByAggregateInput;
    _max?: Prisma.PhotoKeywordMaxOrderByAggregateInput;
    _min?: Prisma.PhotoKeywordMinOrderByAggregateInput;
};
export type PhotoKeywordScalarWhereWithAggregatesInput = {
    AND?: Prisma.PhotoKeywordScalarWhereWithAggregatesInput | Prisma.PhotoKeywordScalarWhereWithAggregatesInput[];
    OR?: Prisma.PhotoKeywordScalarWhereWithAggregatesInput[];
    NOT?: Prisma.PhotoKeywordScalarWhereWithAggregatesInput | Prisma.PhotoKeywordScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"PhotoKeyword"> | string;
    photoId?: Prisma.StringWithAggregatesFilter<"PhotoKeyword"> | string;
    keywordId?: Prisma.StringWithAggregatesFilter<"PhotoKeyword"> | string;
};
export type PhotoKeywordCreateInput = {
    id?: string;
    photo: Prisma.PhotoCreateNestedOneWithoutPhotoKeywordsInput;
    keyword: Prisma.KeywordCreateNestedOneWithoutPhotoKeywordsInput;
};
export type PhotoKeywordUncheckedCreateInput = {
    id?: string;
    photoId: string;
    keywordId: string;
};
export type PhotoKeywordUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    photo?: Prisma.PhotoUpdateOneRequiredWithoutPhotoKeywordsNestedInput;
    keyword?: Prisma.KeywordUpdateOneRequiredWithoutPhotoKeywordsNestedInput;
};
export type PhotoKeywordUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    photoId?: Prisma.StringFieldUpdateOperationsInput | string;
    keywordId?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type PhotoKeywordCreateManyInput = {
    id?: string;
    photoId: string;
    keywordId: string;
};
export type PhotoKeywordUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type PhotoKeywordUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    photoId?: Prisma.StringFieldUpdateOperationsInput | string;
    keywordId?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type PhotoKeywordListRelationFilter = {
    every?: Prisma.PhotoKeywordWhereInput;
    some?: Prisma.PhotoKeywordWhereInput;
    none?: Prisma.PhotoKeywordWhereInput;
};
export type PhotoKeywordOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type PhotoKeywordOrderByRelevanceInput = {
    fields: Prisma.PhotoKeywordOrderByRelevanceFieldEnum | Prisma.PhotoKeywordOrderByRelevanceFieldEnum[];
    sort: Prisma.SortOrder;
    search: string;
};
export type PhotoKeywordPhotoIdKeywordIdCompoundUniqueInput = {
    photoId: string;
    keywordId: string;
};
export type PhotoKeywordCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    photoId?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
};
export type PhotoKeywordMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    photoId?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
};
export type PhotoKeywordMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    photoId?: Prisma.SortOrder;
    keywordId?: Prisma.SortOrder;
};
export type PhotoKeywordCreateNestedManyWithoutPhotoInput = {
    create?: Prisma.XOR<Prisma.PhotoKeywordCreateWithoutPhotoInput, Prisma.PhotoKeywordUncheckedCreateWithoutPhotoInput> | Prisma.PhotoKeywordCreateWithoutPhotoInput[] | Prisma.PhotoKeywordUncheckedCreateWithoutPhotoInput[];
    connectOrCreate?: Prisma.PhotoKeywordCreateOrConnectWithoutPhotoInput | Prisma.PhotoKeywordCreateOrConnectWithoutPhotoInput[];
    createMany?: Prisma.PhotoKeywordCreateManyPhotoInputEnvelope;
    connect?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
};
export type PhotoKeywordUncheckedCreateNestedManyWithoutPhotoInput = {
    create?: Prisma.XOR<Prisma.PhotoKeywordCreateWithoutPhotoInput, Prisma.PhotoKeywordUncheckedCreateWithoutPhotoInput> | Prisma.PhotoKeywordCreateWithoutPhotoInput[] | Prisma.PhotoKeywordUncheckedCreateWithoutPhotoInput[];
    connectOrCreate?: Prisma.PhotoKeywordCreateOrConnectWithoutPhotoInput | Prisma.PhotoKeywordCreateOrConnectWithoutPhotoInput[];
    createMany?: Prisma.PhotoKeywordCreateManyPhotoInputEnvelope;
    connect?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
};
export type PhotoKeywordUpdateManyWithoutPhotoNestedInput = {
    create?: Prisma.XOR<Prisma.PhotoKeywordCreateWithoutPhotoInput, Prisma.PhotoKeywordUncheckedCreateWithoutPhotoInput> | Prisma.PhotoKeywordCreateWithoutPhotoInput[] | Prisma.PhotoKeywordUncheckedCreateWithoutPhotoInput[];
    connectOrCreate?: Prisma.PhotoKeywordCreateOrConnectWithoutPhotoInput | Prisma.PhotoKeywordCreateOrConnectWithoutPhotoInput[];
    upsert?: Prisma.PhotoKeywordUpsertWithWhereUniqueWithoutPhotoInput | Prisma.PhotoKeywordUpsertWithWhereUniqueWithoutPhotoInput[];
    createMany?: Prisma.PhotoKeywordCreateManyPhotoInputEnvelope;
    set?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
    disconnect?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
    delete?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
    connect?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
    update?: Prisma.PhotoKeywordUpdateWithWhereUniqueWithoutPhotoInput | Prisma.PhotoKeywordUpdateWithWhereUniqueWithoutPhotoInput[];
    updateMany?: Prisma.PhotoKeywordUpdateManyWithWhereWithoutPhotoInput | Prisma.PhotoKeywordUpdateManyWithWhereWithoutPhotoInput[];
    deleteMany?: Prisma.PhotoKeywordScalarWhereInput | Prisma.PhotoKeywordScalarWhereInput[];
};
export type PhotoKeywordUncheckedUpdateManyWithoutPhotoNestedInput = {
    create?: Prisma.XOR<Prisma.PhotoKeywordCreateWithoutPhotoInput, Prisma.PhotoKeywordUncheckedCreateWithoutPhotoInput> | Prisma.PhotoKeywordCreateWithoutPhotoInput[] | Prisma.PhotoKeywordUncheckedCreateWithoutPhotoInput[];
    connectOrCreate?: Prisma.PhotoKeywordCreateOrConnectWithoutPhotoInput | Prisma.PhotoKeywordCreateOrConnectWithoutPhotoInput[];
    upsert?: Prisma.PhotoKeywordUpsertWithWhereUniqueWithoutPhotoInput | Prisma.PhotoKeywordUpsertWithWhereUniqueWithoutPhotoInput[];
    createMany?: Prisma.PhotoKeywordCreateManyPhotoInputEnvelope;
    set?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
    disconnect?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
    delete?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
    connect?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
    update?: Prisma.PhotoKeywordUpdateWithWhereUniqueWithoutPhotoInput | Prisma.PhotoKeywordUpdateWithWhereUniqueWithoutPhotoInput[];
    updateMany?: Prisma.PhotoKeywordUpdateManyWithWhereWithoutPhotoInput | Prisma.PhotoKeywordUpdateManyWithWhereWithoutPhotoInput[];
    deleteMany?: Prisma.PhotoKeywordScalarWhereInput | Prisma.PhotoKeywordScalarWhereInput[];
};
export type PhotoKeywordCreateNestedManyWithoutKeywordInput = {
    create?: Prisma.XOR<Prisma.PhotoKeywordCreateWithoutKeywordInput, Prisma.PhotoKeywordUncheckedCreateWithoutKeywordInput> | Prisma.PhotoKeywordCreateWithoutKeywordInput[] | Prisma.PhotoKeywordUncheckedCreateWithoutKeywordInput[];
    connectOrCreate?: Prisma.PhotoKeywordCreateOrConnectWithoutKeywordInput | Prisma.PhotoKeywordCreateOrConnectWithoutKeywordInput[];
    createMany?: Prisma.PhotoKeywordCreateManyKeywordInputEnvelope;
    connect?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
};
export type PhotoKeywordUncheckedCreateNestedManyWithoutKeywordInput = {
    create?: Prisma.XOR<Prisma.PhotoKeywordCreateWithoutKeywordInput, Prisma.PhotoKeywordUncheckedCreateWithoutKeywordInput> | Prisma.PhotoKeywordCreateWithoutKeywordInput[] | Prisma.PhotoKeywordUncheckedCreateWithoutKeywordInput[];
    connectOrCreate?: Prisma.PhotoKeywordCreateOrConnectWithoutKeywordInput | Prisma.PhotoKeywordCreateOrConnectWithoutKeywordInput[];
    createMany?: Prisma.PhotoKeywordCreateManyKeywordInputEnvelope;
    connect?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
};
export type PhotoKeywordUpdateManyWithoutKeywordNestedInput = {
    create?: Prisma.XOR<Prisma.PhotoKeywordCreateWithoutKeywordInput, Prisma.PhotoKeywordUncheckedCreateWithoutKeywordInput> | Prisma.PhotoKeywordCreateWithoutKeywordInput[] | Prisma.PhotoKeywordUncheckedCreateWithoutKeywordInput[];
    connectOrCreate?: Prisma.PhotoKeywordCreateOrConnectWithoutKeywordInput | Prisma.PhotoKeywordCreateOrConnectWithoutKeywordInput[];
    upsert?: Prisma.PhotoKeywordUpsertWithWhereUniqueWithoutKeywordInput | Prisma.PhotoKeywordUpsertWithWhereUniqueWithoutKeywordInput[];
    createMany?: Prisma.PhotoKeywordCreateManyKeywordInputEnvelope;
    set?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
    disconnect?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
    delete?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
    connect?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
    update?: Prisma.PhotoKeywordUpdateWithWhereUniqueWithoutKeywordInput | Prisma.PhotoKeywordUpdateWithWhereUniqueWithoutKeywordInput[];
    updateMany?: Prisma.PhotoKeywordUpdateManyWithWhereWithoutKeywordInput | Prisma.PhotoKeywordUpdateManyWithWhereWithoutKeywordInput[];
    deleteMany?: Prisma.PhotoKeywordScalarWhereInput | Prisma.PhotoKeywordScalarWhereInput[];
};
export type PhotoKeywordUncheckedUpdateManyWithoutKeywordNestedInput = {
    create?: Prisma.XOR<Prisma.PhotoKeywordCreateWithoutKeywordInput, Prisma.PhotoKeywordUncheckedCreateWithoutKeywordInput> | Prisma.PhotoKeywordCreateWithoutKeywordInput[] | Prisma.PhotoKeywordUncheckedCreateWithoutKeywordInput[];
    connectOrCreate?: Prisma.PhotoKeywordCreateOrConnectWithoutKeywordInput | Prisma.PhotoKeywordCreateOrConnectWithoutKeywordInput[];
    upsert?: Prisma.PhotoKeywordUpsertWithWhereUniqueWithoutKeywordInput | Prisma.PhotoKeywordUpsertWithWhereUniqueWithoutKeywordInput[];
    createMany?: Prisma.PhotoKeywordCreateManyKeywordInputEnvelope;
    set?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
    disconnect?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
    delete?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
    connect?: Prisma.PhotoKeywordWhereUniqueInput | Prisma.PhotoKeywordWhereUniqueInput[];
    update?: Prisma.PhotoKeywordUpdateWithWhereUniqueWithoutKeywordInput | Prisma.PhotoKeywordUpdateWithWhereUniqueWithoutKeywordInput[];
    updateMany?: Prisma.PhotoKeywordUpdateManyWithWhereWithoutKeywordInput | Prisma.PhotoKeywordUpdateManyWithWhereWithoutKeywordInput[];
    deleteMany?: Prisma.PhotoKeywordScalarWhereInput | Prisma.PhotoKeywordScalarWhereInput[];
};
export type PhotoKeywordCreateWithoutPhotoInput = {
    id?: string;
    keyword: Prisma.KeywordCreateNestedOneWithoutPhotoKeywordsInput;
};
export type PhotoKeywordUncheckedCreateWithoutPhotoInput = {
    id?: string;
    keywordId: string;
};
export type PhotoKeywordCreateOrConnectWithoutPhotoInput = {
    where: Prisma.PhotoKeywordWhereUniqueInput;
    create: Prisma.XOR<Prisma.PhotoKeywordCreateWithoutPhotoInput, Prisma.PhotoKeywordUncheckedCreateWithoutPhotoInput>;
};
export type PhotoKeywordCreateManyPhotoInputEnvelope = {
    data: Prisma.PhotoKeywordCreateManyPhotoInput | Prisma.PhotoKeywordCreateManyPhotoInput[];
    skipDuplicates?: boolean;
};
export type PhotoKeywordUpsertWithWhereUniqueWithoutPhotoInput = {
    where: Prisma.PhotoKeywordWhereUniqueInput;
    update: Prisma.XOR<Prisma.PhotoKeywordUpdateWithoutPhotoInput, Prisma.PhotoKeywordUncheckedUpdateWithoutPhotoInput>;
    create: Prisma.XOR<Prisma.PhotoKeywordCreateWithoutPhotoInput, Prisma.PhotoKeywordUncheckedCreateWithoutPhotoInput>;
};
export type PhotoKeywordUpdateWithWhereUniqueWithoutPhotoInput = {
    where: Prisma.PhotoKeywordWhereUniqueInput;
    data: Prisma.XOR<Prisma.PhotoKeywordUpdateWithoutPhotoInput, Prisma.PhotoKeywordUncheckedUpdateWithoutPhotoInput>;
};
export type PhotoKeywordUpdateManyWithWhereWithoutPhotoInput = {
    where: Prisma.PhotoKeywordScalarWhereInput;
    data: Prisma.XOR<Prisma.PhotoKeywordUpdateManyMutationInput, Prisma.PhotoKeywordUncheckedUpdateManyWithoutPhotoInput>;
};
export type PhotoKeywordScalarWhereInput = {
    AND?: Prisma.PhotoKeywordScalarWhereInput | Prisma.PhotoKeywordScalarWhereInput[];
    OR?: Prisma.PhotoKeywordScalarWhereInput[];
    NOT?: Prisma.PhotoKeywordScalarWhereInput | Prisma.PhotoKeywordScalarWhereInput[];
    id?: Prisma.StringFilter<"PhotoKeyword"> | string;
    photoId?: Prisma.StringFilter<"PhotoKeyword"> | string;
    keywordId?: Prisma.StringFilter<"PhotoKeyword"> | string;
};
export type PhotoKeywordCreateWithoutKeywordInput = {
    id?: string;
    photo: Prisma.PhotoCreateNestedOneWithoutPhotoKeywordsInput;
};
export type PhotoKeywordUncheckedCreateWithoutKeywordInput = {
    id?: string;
    photoId: string;
};
export type PhotoKeywordCreateOrConnectWithoutKeywordInput = {
    where: Prisma.PhotoKeywordWhereUniqueInput;
    create: Prisma.XOR<Prisma.PhotoKeywordCreateWithoutKeywordInput, Prisma.PhotoKeywordUncheckedCreateWithoutKeywordInput>;
};
export type PhotoKeywordCreateManyKeywordInputEnvelope = {
    data: Prisma.PhotoKeywordCreateManyKeywordInput | Prisma.PhotoKeywordCreateManyKeywordInput[];
    skipDuplicates?: boolean;
};
export type PhotoKeywordUpsertWithWhereUniqueWithoutKeywordInput = {
    where: Prisma.PhotoKeywordWhereUniqueInput;
    update: Prisma.XOR<Prisma.PhotoKeywordUpdateWithoutKeywordInput, Prisma.PhotoKeywordUncheckedUpdateWithoutKeywordInput>;
    create: Prisma.XOR<Prisma.PhotoKeywordCreateWithoutKeywordInput, Prisma.PhotoKeywordUncheckedCreateWithoutKeywordInput>;
};
export type PhotoKeywordUpdateWithWhereUniqueWithoutKeywordInput = {
    where: Prisma.PhotoKeywordWhereUniqueInput;
    data: Prisma.XOR<Prisma.PhotoKeywordUpdateWithoutKeywordInput, Prisma.PhotoKeywordUncheckedUpdateWithoutKeywordInput>;
};
export type PhotoKeywordUpdateManyWithWhereWithoutKeywordInput = {
    where: Prisma.PhotoKeywordScalarWhereInput;
    data: Prisma.XOR<Prisma.PhotoKeywordUpdateManyMutationInput, Prisma.PhotoKeywordUncheckedUpdateManyWithoutKeywordInput>;
};
export type PhotoKeywordCreateManyPhotoInput = {
    id?: string;
    keywordId: string;
};
export type PhotoKeywordUpdateWithoutPhotoInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    keyword?: Prisma.KeywordUpdateOneRequiredWithoutPhotoKeywordsNestedInput;
};
export type PhotoKeywordUncheckedUpdateWithoutPhotoInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    keywordId?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type PhotoKeywordUncheckedUpdateManyWithoutPhotoInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    keywordId?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type PhotoKeywordCreateManyKeywordInput = {
    id?: string;
    photoId: string;
};
export type PhotoKeywordUpdateWithoutKeywordInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    photo?: Prisma.PhotoUpdateOneRequiredWithoutPhotoKeywordsNestedInput;
};
export type PhotoKeywordUncheckedUpdateWithoutKeywordInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    photoId?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type PhotoKeywordUncheckedUpdateManyWithoutKeywordInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    photoId?: Prisma.StringFieldUpdateOperationsInput | string;
};
export type PhotoKeywordSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    photoId?: boolean;
    keywordId?: boolean;
    photo?: boolean | Prisma.PhotoDefaultArgs<ExtArgs>;
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["photoKeyword"]>;
export type PhotoKeywordSelectScalar = {
    id?: boolean;
    photoId?: boolean;
    keywordId?: boolean;
};
export type PhotoKeywordOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "photoId" | "keywordId", ExtArgs["result"]["photoKeyword"]>;
export type PhotoKeywordInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    photo?: boolean | Prisma.PhotoDefaultArgs<ExtArgs>;
    keyword?: boolean | Prisma.KeywordDefaultArgs<ExtArgs>;
};
export type $PhotoKeywordPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "PhotoKeyword";
    objects: {
        photo: Prisma.$PhotoPayload<ExtArgs>;
        keyword: Prisma.$KeywordPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        photoId: string;
        keywordId: string;
    }, ExtArgs["result"]["photoKeyword"]>;
    composites: {};
};
export type PhotoKeywordGetPayload<S extends boolean | null | undefined | PhotoKeywordDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$PhotoKeywordPayload, S>;
export type PhotoKeywordCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<PhotoKeywordFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: PhotoKeywordCountAggregateInputType | true;
};
export interface PhotoKeywordDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['PhotoKeyword'];
        meta: {
            name: 'PhotoKeyword';
        };
    };
    /**
     * Find zero or one PhotoKeyword that matches the filter.
     * @param {PhotoKeywordFindUniqueArgs} args - Arguments to find a PhotoKeyword
     * @example
     * // Get one PhotoKeyword
     * const photoKeyword = await prisma.photoKeyword.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PhotoKeywordFindUniqueArgs>(args: Prisma.SelectSubset<T, PhotoKeywordFindUniqueArgs<ExtArgs>>): Prisma.Prisma__PhotoKeywordClient<runtime.Types.Result.GetResult<Prisma.$PhotoKeywordPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one PhotoKeyword that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PhotoKeywordFindUniqueOrThrowArgs} args - Arguments to find a PhotoKeyword
     * @example
     * // Get one PhotoKeyword
     * const photoKeyword = await prisma.photoKeyword.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PhotoKeywordFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, PhotoKeywordFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__PhotoKeywordClient<runtime.Types.Result.GetResult<Prisma.$PhotoKeywordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first PhotoKeyword that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoKeywordFindFirstArgs} args - Arguments to find a PhotoKeyword
     * @example
     * // Get one PhotoKeyword
     * const photoKeyword = await prisma.photoKeyword.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PhotoKeywordFindFirstArgs>(args?: Prisma.SelectSubset<T, PhotoKeywordFindFirstArgs<ExtArgs>>): Prisma.Prisma__PhotoKeywordClient<runtime.Types.Result.GetResult<Prisma.$PhotoKeywordPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first PhotoKeyword that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoKeywordFindFirstOrThrowArgs} args - Arguments to find a PhotoKeyword
     * @example
     * // Get one PhotoKeyword
     * const photoKeyword = await prisma.photoKeyword.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PhotoKeywordFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, PhotoKeywordFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__PhotoKeywordClient<runtime.Types.Result.GetResult<Prisma.$PhotoKeywordPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more PhotoKeywords that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoKeywordFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PhotoKeywords
     * const photoKeywords = await prisma.photoKeyword.findMany()
     *
     * // Get first 10 PhotoKeywords
     * const photoKeywords = await prisma.photoKeyword.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const photoKeywordWithIdOnly = await prisma.photoKeyword.findMany({ select: { id: true } })
     *
     */
    findMany<T extends PhotoKeywordFindManyArgs>(args?: Prisma.SelectSubset<T, PhotoKeywordFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PhotoKeywordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a PhotoKeyword.
     * @param {PhotoKeywordCreateArgs} args - Arguments to create a PhotoKeyword.
     * @example
     * // Create one PhotoKeyword
     * const PhotoKeyword = await prisma.photoKeyword.create({
     *   data: {
     *     // ... data to create a PhotoKeyword
     *   }
     * })
     *
     */
    create<T extends PhotoKeywordCreateArgs>(args: Prisma.SelectSubset<T, PhotoKeywordCreateArgs<ExtArgs>>): Prisma.Prisma__PhotoKeywordClient<runtime.Types.Result.GetResult<Prisma.$PhotoKeywordPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many PhotoKeywords.
     * @param {PhotoKeywordCreateManyArgs} args - Arguments to create many PhotoKeywords.
     * @example
     * // Create many PhotoKeywords
     * const photoKeyword = await prisma.photoKeyword.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends PhotoKeywordCreateManyArgs>(args?: Prisma.SelectSubset<T, PhotoKeywordCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Delete a PhotoKeyword.
     * @param {PhotoKeywordDeleteArgs} args - Arguments to delete one PhotoKeyword.
     * @example
     * // Delete one PhotoKeyword
     * const PhotoKeyword = await prisma.photoKeyword.delete({
     *   where: {
     *     // ... filter to delete one PhotoKeyword
     *   }
     * })
     *
     */
    delete<T extends PhotoKeywordDeleteArgs>(args: Prisma.SelectSubset<T, PhotoKeywordDeleteArgs<ExtArgs>>): Prisma.Prisma__PhotoKeywordClient<runtime.Types.Result.GetResult<Prisma.$PhotoKeywordPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one PhotoKeyword.
     * @param {PhotoKeywordUpdateArgs} args - Arguments to update one PhotoKeyword.
     * @example
     * // Update one PhotoKeyword
     * const photoKeyword = await prisma.photoKeyword.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends PhotoKeywordUpdateArgs>(args: Prisma.SelectSubset<T, PhotoKeywordUpdateArgs<ExtArgs>>): Prisma.Prisma__PhotoKeywordClient<runtime.Types.Result.GetResult<Prisma.$PhotoKeywordPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more PhotoKeywords.
     * @param {PhotoKeywordDeleteManyArgs} args - Arguments to filter PhotoKeywords to delete.
     * @example
     * // Delete a few PhotoKeywords
     * const { count } = await prisma.photoKeyword.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends PhotoKeywordDeleteManyArgs>(args?: Prisma.SelectSubset<T, PhotoKeywordDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more PhotoKeywords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoKeywordUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PhotoKeywords
     * const photoKeyword = await prisma.photoKeyword.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends PhotoKeywordUpdateManyArgs>(args: Prisma.SelectSubset<T, PhotoKeywordUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create or update one PhotoKeyword.
     * @param {PhotoKeywordUpsertArgs} args - Arguments to update or create a PhotoKeyword.
     * @example
     * // Update or create a PhotoKeyword
     * const photoKeyword = await prisma.photoKeyword.upsert({
     *   create: {
     *     // ... data to create a PhotoKeyword
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PhotoKeyword we want to update
     *   }
     * })
     */
    upsert<T extends PhotoKeywordUpsertArgs>(args: Prisma.SelectSubset<T, PhotoKeywordUpsertArgs<ExtArgs>>): Prisma.Prisma__PhotoKeywordClient<runtime.Types.Result.GetResult<Prisma.$PhotoKeywordPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of PhotoKeywords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoKeywordCountArgs} args - Arguments to filter PhotoKeywords to count.
     * @example
     * // Count the number of PhotoKeywords
     * const count = await prisma.photoKeyword.count({
     *   where: {
     *     // ... the filter for the PhotoKeywords we want to count
     *   }
     * })
    **/
    count<T extends PhotoKeywordCountArgs>(args?: Prisma.Subset<T, PhotoKeywordCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], PhotoKeywordCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a PhotoKeyword.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoKeywordAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PhotoKeywordAggregateArgs>(args: Prisma.Subset<T, PhotoKeywordAggregateArgs>): Prisma.PrismaPromise<GetPhotoKeywordAggregateType<T>>;
    /**
     * Group by PhotoKeyword.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoKeywordGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<T extends PhotoKeywordGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: PhotoKeywordGroupByArgs['orderBy'];
    } : {
        orderBy?: PhotoKeywordGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, PhotoKeywordGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPhotoKeywordGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the PhotoKeyword model
     */
    readonly fields: PhotoKeywordFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for PhotoKeyword.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__PhotoKeywordClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    photo<T extends Prisma.PhotoDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.PhotoDefaultArgs<ExtArgs>>): Prisma.Prisma__PhotoClient<runtime.Types.Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    keyword<T extends Prisma.KeywordDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.KeywordDefaultArgs<ExtArgs>>): Prisma.Prisma__KeywordClient<runtime.Types.Result.GetResult<Prisma.$KeywordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
/**
 * Fields of the PhotoKeyword model
 */
export interface PhotoKeywordFieldRefs {
    readonly id: Prisma.FieldRef<"PhotoKeyword", 'String'>;
    readonly photoId: Prisma.FieldRef<"PhotoKeyword", 'String'>;
    readonly keywordId: Prisma.FieldRef<"PhotoKeyword", 'String'>;
}
/**
 * PhotoKeyword findUnique
 */
export type PhotoKeywordFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PhotoKeyword
     */
    select?: Prisma.PhotoKeywordSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PhotoKeyword
     */
    omit?: Prisma.PhotoKeywordOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoKeywordInclude<ExtArgs> | null;
    /**
     * Filter, which PhotoKeyword to fetch.
     */
    where: Prisma.PhotoKeywordWhereUniqueInput;
};
/**
 * PhotoKeyword findUniqueOrThrow
 */
export type PhotoKeywordFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PhotoKeyword
     */
    select?: Prisma.PhotoKeywordSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PhotoKeyword
     */
    omit?: Prisma.PhotoKeywordOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoKeywordInclude<ExtArgs> | null;
    /**
     * Filter, which PhotoKeyword to fetch.
     */
    where: Prisma.PhotoKeywordWhereUniqueInput;
};
/**
 * PhotoKeyword findFirst
 */
export type PhotoKeywordFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PhotoKeyword
     */
    select?: Prisma.PhotoKeywordSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PhotoKeyword
     */
    omit?: Prisma.PhotoKeywordOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoKeywordInclude<ExtArgs> | null;
    /**
     * Filter, which PhotoKeyword to fetch.
     */
    where?: Prisma.PhotoKeywordWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PhotoKeywords to fetch.
     */
    orderBy?: Prisma.PhotoKeywordOrderByWithRelationInput | Prisma.PhotoKeywordOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for PhotoKeywords.
     */
    cursor?: Prisma.PhotoKeywordWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PhotoKeywords from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PhotoKeywords.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of PhotoKeywords.
     */
    distinct?: Prisma.PhotoKeywordScalarFieldEnum | Prisma.PhotoKeywordScalarFieldEnum[];
};
/**
 * PhotoKeyword findFirstOrThrow
 */
export type PhotoKeywordFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PhotoKeyword
     */
    select?: Prisma.PhotoKeywordSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PhotoKeyword
     */
    omit?: Prisma.PhotoKeywordOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoKeywordInclude<ExtArgs> | null;
    /**
     * Filter, which PhotoKeyword to fetch.
     */
    where?: Prisma.PhotoKeywordWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PhotoKeywords to fetch.
     */
    orderBy?: Prisma.PhotoKeywordOrderByWithRelationInput | Prisma.PhotoKeywordOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for PhotoKeywords.
     */
    cursor?: Prisma.PhotoKeywordWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PhotoKeywords from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PhotoKeywords.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of PhotoKeywords.
     */
    distinct?: Prisma.PhotoKeywordScalarFieldEnum | Prisma.PhotoKeywordScalarFieldEnum[];
};
/**
 * PhotoKeyword findMany
 */
export type PhotoKeywordFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PhotoKeyword
     */
    select?: Prisma.PhotoKeywordSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PhotoKeyword
     */
    omit?: Prisma.PhotoKeywordOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoKeywordInclude<ExtArgs> | null;
    /**
     * Filter, which PhotoKeywords to fetch.
     */
    where?: Prisma.PhotoKeywordWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PhotoKeywords to fetch.
     */
    orderBy?: Prisma.PhotoKeywordOrderByWithRelationInput | Prisma.PhotoKeywordOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing PhotoKeywords.
     */
    cursor?: Prisma.PhotoKeywordWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PhotoKeywords from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PhotoKeywords.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of PhotoKeywords.
     */
    distinct?: Prisma.PhotoKeywordScalarFieldEnum | Prisma.PhotoKeywordScalarFieldEnum[];
};
/**
 * PhotoKeyword create
 */
export type PhotoKeywordCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PhotoKeyword
     */
    select?: Prisma.PhotoKeywordSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PhotoKeyword
     */
    omit?: Prisma.PhotoKeywordOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoKeywordInclude<ExtArgs> | null;
    /**
     * The data needed to create a PhotoKeyword.
     */
    data: Prisma.XOR<Prisma.PhotoKeywordCreateInput, Prisma.PhotoKeywordUncheckedCreateInput>;
};
/**
 * PhotoKeyword createMany
 */
export type PhotoKeywordCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many PhotoKeywords.
     */
    data: Prisma.PhotoKeywordCreateManyInput | Prisma.PhotoKeywordCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * PhotoKeyword update
 */
export type PhotoKeywordUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PhotoKeyword
     */
    select?: Prisma.PhotoKeywordSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PhotoKeyword
     */
    omit?: Prisma.PhotoKeywordOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoKeywordInclude<ExtArgs> | null;
    /**
     * The data needed to update a PhotoKeyword.
     */
    data: Prisma.XOR<Prisma.PhotoKeywordUpdateInput, Prisma.PhotoKeywordUncheckedUpdateInput>;
    /**
     * Choose, which PhotoKeyword to update.
     */
    where: Prisma.PhotoKeywordWhereUniqueInput;
};
/**
 * PhotoKeyword updateMany
 */
export type PhotoKeywordUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update PhotoKeywords.
     */
    data: Prisma.XOR<Prisma.PhotoKeywordUpdateManyMutationInput, Prisma.PhotoKeywordUncheckedUpdateManyInput>;
    /**
     * Filter which PhotoKeywords to update
     */
    where?: Prisma.PhotoKeywordWhereInput;
    /**
     * Limit how many PhotoKeywords to update.
     */
    limit?: number;
};
/**
 * PhotoKeyword upsert
 */
export type PhotoKeywordUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PhotoKeyword
     */
    select?: Prisma.PhotoKeywordSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PhotoKeyword
     */
    omit?: Prisma.PhotoKeywordOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoKeywordInclude<ExtArgs> | null;
    /**
     * The filter to search for the PhotoKeyword to update in case it exists.
     */
    where: Prisma.PhotoKeywordWhereUniqueInput;
    /**
     * In case the PhotoKeyword found by the `where` argument doesn't exist, create a new PhotoKeyword with this data.
     */
    create: Prisma.XOR<Prisma.PhotoKeywordCreateInput, Prisma.PhotoKeywordUncheckedCreateInput>;
    /**
     * In case the PhotoKeyword was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.PhotoKeywordUpdateInput, Prisma.PhotoKeywordUncheckedUpdateInput>;
};
/**
 * PhotoKeyword delete
 */
export type PhotoKeywordDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PhotoKeyword
     */
    select?: Prisma.PhotoKeywordSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PhotoKeyword
     */
    omit?: Prisma.PhotoKeywordOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoKeywordInclude<ExtArgs> | null;
    /**
     * Filter which PhotoKeyword to delete.
     */
    where: Prisma.PhotoKeywordWhereUniqueInput;
};
/**
 * PhotoKeyword deleteMany
 */
export type PhotoKeywordDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which PhotoKeywords to delete
     */
    where?: Prisma.PhotoKeywordWhereInput;
    /**
     * Limit how many PhotoKeywords to delete.
     */
    limit?: number;
};
/**
 * PhotoKeyword without action
 */
export type PhotoKeywordDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PhotoKeyword
     */
    select?: Prisma.PhotoKeywordSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PhotoKeyword
     */
    omit?: Prisma.PhotoKeywordOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoKeywordInclude<ExtArgs> | null;
};
//# sourceMappingURL=PhotoKeyword.d.ts.map