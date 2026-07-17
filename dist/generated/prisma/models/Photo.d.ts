import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
/**
 * Model Photo
 *
 */
export type PhotoModel = runtime.Types.Result.DefaultSelection<Prisma.$PhotoPayload>;
export type AggregatePhoto = {
    _count: PhotoCountAggregateOutputType | null;
    _avg: PhotoAvgAggregateOutputType | null;
    _sum: PhotoSumAggregateOutputType | null;
    _min: PhotoMinAggregateOutputType | null;
    _max: PhotoMaxAggregateOutputType | null;
};
export type PhotoAvgAggregateOutputType = {
    price: number | null;
    width: number | null;
    height: number | null;
};
export type PhotoSumAggregateOutputType = {
    price: number | null;
    width: number | null;
    height: number | null;
};
export type PhotoMinAggregateOutputType = {
    id: string | null;
    title: string | null;
    description: string | null;
    photographer: string | null;
    price: number | null;
    type: $Enums.AssetType | null;
    width: number | null;
    height: number | null;
    format: string | null;
    originalKey: string | null;
    thumbKey: string | null;
    watermarkKey: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    deletedAt: Date | null;
};
export type PhotoMaxAggregateOutputType = {
    id: string | null;
    title: string | null;
    description: string | null;
    photographer: string | null;
    price: number | null;
    type: $Enums.AssetType | null;
    width: number | null;
    height: number | null;
    format: string | null;
    originalKey: string | null;
    thumbKey: string | null;
    watermarkKey: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    deletedAt: Date | null;
};
export type PhotoCountAggregateOutputType = {
    id: number;
    title: number;
    description: number;
    photographer: number;
    price: number;
    type: number;
    width: number;
    height: number;
    format: number;
    originalKey: number;
    thumbKey: number;
    watermarkKey: number;
    createdAt: number;
    updatedAt: number;
    deletedAt: number;
    _all: number;
};
export type PhotoAvgAggregateInputType = {
    price?: true;
    width?: true;
    height?: true;
};
export type PhotoSumAggregateInputType = {
    price?: true;
    width?: true;
    height?: true;
};
export type PhotoMinAggregateInputType = {
    id?: true;
    title?: true;
    description?: true;
    photographer?: true;
    price?: true;
    type?: true;
    width?: true;
    height?: true;
    format?: true;
    originalKey?: true;
    thumbKey?: true;
    watermarkKey?: true;
    createdAt?: true;
    updatedAt?: true;
    deletedAt?: true;
};
export type PhotoMaxAggregateInputType = {
    id?: true;
    title?: true;
    description?: true;
    photographer?: true;
    price?: true;
    type?: true;
    width?: true;
    height?: true;
    format?: true;
    originalKey?: true;
    thumbKey?: true;
    watermarkKey?: true;
    createdAt?: true;
    updatedAt?: true;
    deletedAt?: true;
};
export type PhotoCountAggregateInputType = {
    id?: true;
    title?: true;
    description?: true;
    photographer?: true;
    price?: true;
    type?: true;
    width?: true;
    height?: true;
    format?: true;
    originalKey?: true;
    thumbKey?: true;
    watermarkKey?: true;
    createdAt?: true;
    updatedAt?: true;
    deletedAt?: true;
    _all?: true;
};
export type PhotoAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Photo to aggregate.
     */
    where?: Prisma.PhotoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Photos to fetch.
     */
    orderBy?: Prisma.PhotoOrderByWithRelationInput | Prisma.PhotoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.PhotoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Photos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Photos.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Photos
    **/
    _count?: true | PhotoCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: PhotoAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: PhotoSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: PhotoMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: PhotoMaxAggregateInputType;
};
export type GetPhotoAggregateType<T extends PhotoAggregateArgs> = {
    [P in keyof T & keyof AggregatePhoto]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregatePhoto[P]> : Prisma.GetScalarType<T[P], AggregatePhoto[P]>;
};
export type PhotoGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PhotoWhereInput;
    orderBy?: Prisma.PhotoOrderByWithAggregationInput | Prisma.PhotoOrderByWithAggregationInput[];
    by: Prisma.PhotoScalarFieldEnum[] | Prisma.PhotoScalarFieldEnum;
    having?: Prisma.PhotoScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PhotoCountAggregateInputType | true;
    _avg?: PhotoAvgAggregateInputType;
    _sum?: PhotoSumAggregateInputType;
    _min?: PhotoMinAggregateInputType;
    _max?: PhotoMaxAggregateInputType;
};
export type PhotoGroupByOutputType = {
    id: string;
    title: string;
    description: string | null;
    photographer: string;
    price: number;
    type: $Enums.AssetType;
    width: number | null;
    height: number | null;
    format: string | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    _count: PhotoCountAggregateOutputType | null;
    _avg: PhotoAvgAggregateOutputType | null;
    _sum: PhotoSumAggregateOutputType | null;
    _min: PhotoMinAggregateOutputType | null;
    _max: PhotoMaxAggregateOutputType | null;
};
export type GetPhotoGroupByPayload<T extends PhotoGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<PhotoGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof PhotoGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], PhotoGroupByOutputType[P]> : Prisma.GetScalarType<T[P], PhotoGroupByOutputType[P]>;
}>>;
export type PhotoWhereInput = {
    AND?: Prisma.PhotoWhereInput | Prisma.PhotoWhereInput[];
    OR?: Prisma.PhotoWhereInput[];
    NOT?: Prisma.PhotoWhereInput | Prisma.PhotoWhereInput[];
    id?: Prisma.StringFilter<"Photo"> | string;
    title?: Prisma.StringFilter<"Photo"> | string;
    description?: Prisma.StringNullableFilter<"Photo"> | string | null;
    photographer?: Prisma.StringFilter<"Photo"> | string;
    price?: Prisma.IntFilter<"Photo"> | number;
    type?: Prisma.EnumAssetTypeFilter<"Photo"> | $Enums.AssetType;
    width?: Prisma.IntNullableFilter<"Photo"> | number | null;
    height?: Prisma.IntNullableFilter<"Photo"> | number | null;
    format?: Prisma.StringNullableFilter<"Photo"> | string | null;
    originalKey?: Prisma.StringFilter<"Photo"> | string;
    thumbKey?: Prisma.StringFilter<"Photo"> | string;
    watermarkKey?: Prisma.StringFilter<"Photo"> | string;
    createdAt?: Prisma.DateTimeFilter<"Photo"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Photo"> | Date | string;
    deletedAt?: Prisma.DateTimeNullableFilter<"Photo"> | Date | string | null;
    keywords?: Prisma.KeywordListRelationFilter;
    cartItems?: Prisma.CartItemListRelationFilter;
    favorites?: Prisma.FavoriteListRelationFilter;
    orderItems?: Prisma.OrderItemListRelationFilter;
    downloads?: Prisma.DownloadListRelationFilter;
    photoKeywords?: Prisma.PhotoKeywordListRelationFilter;
};
export type PhotoOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    photographer?: Prisma.SortOrder;
    price?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    width?: Prisma.SortOrderInput | Prisma.SortOrder;
    height?: Prisma.SortOrderInput | Prisma.SortOrder;
    format?: Prisma.SortOrderInput | Prisma.SortOrder;
    originalKey?: Prisma.SortOrder;
    thumbKey?: Prisma.SortOrder;
    watermarkKey?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    deletedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    keywords?: Prisma.KeywordOrderByRelationAggregateInput;
    cartItems?: Prisma.CartItemOrderByRelationAggregateInput;
    favorites?: Prisma.FavoriteOrderByRelationAggregateInput;
    orderItems?: Prisma.OrderItemOrderByRelationAggregateInput;
    downloads?: Prisma.DownloadOrderByRelationAggregateInput;
    photoKeywords?: Prisma.PhotoKeywordOrderByRelationAggregateInput;
    _relevance?: Prisma.PhotoOrderByRelevanceInput;
};
export type PhotoWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.PhotoWhereInput | Prisma.PhotoWhereInput[];
    OR?: Prisma.PhotoWhereInput[];
    NOT?: Prisma.PhotoWhereInput | Prisma.PhotoWhereInput[];
    title?: Prisma.StringFilter<"Photo"> | string;
    description?: Prisma.StringNullableFilter<"Photo"> | string | null;
    photographer?: Prisma.StringFilter<"Photo"> | string;
    price?: Prisma.IntFilter<"Photo"> | number;
    type?: Prisma.EnumAssetTypeFilter<"Photo"> | $Enums.AssetType;
    width?: Prisma.IntNullableFilter<"Photo"> | number | null;
    height?: Prisma.IntNullableFilter<"Photo"> | number | null;
    format?: Prisma.StringNullableFilter<"Photo"> | string | null;
    originalKey?: Prisma.StringFilter<"Photo"> | string;
    thumbKey?: Prisma.StringFilter<"Photo"> | string;
    watermarkKey?: Prisma.StringFilter<"Photo"> | string;
    createdAt?: Prisma.DateTimeFilter<"Photo"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Photo"> | Date | string;
    deletedAt?: Prisma.DateTimeNullableFilter<"Photo"> | Date | string | null;
    keywords?: Prisma.KeywordListRelationFilter;
    cartItems?: Prisma.CartItemListRelationFilter;
    favorites?: Prisma.FavoriteListRelationFilter;
    orderItems?: Prisma.OrderItemListRelationFilter;
    downloads?: Prisma.DownloadListRelationFilter;
    photoKeywords?: Prisma.PhotoKeywordListRelationFilter;
}, "id">;
export type PhotoOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrderInput | Prisma.SortOrder;
    photographer?: Prisma.SortOrder;
    price?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    width?: Prisma.SortOrderInput | Prisma.SortOrder;
    height?: Prisma.SortOrderInput | Prisma.SortOrder;
    format?: Prisma.SortOrderInput | Prisma.SortOrder;
    originalKey?: Prisma.SortOrder;
    thumbKey?: Prisma.SortOrder;
    watermarkKey?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    deletedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.PhotoCountOrderByAggregateInput;
    _avg?: Prisma.PhotoAvgOrderByAggregateInput;
    _max?: Prisma.PhotoMaxOrderByAggregateInput;
    _min?: Prisma.PhotoMinOrderByAggregateInput;
    _sum?: Prisma.PhotoSumOrderByAggregateInput;
};
export type PhotoScalarWhereWithAggregatesInput = {
    AND?: Prisma.PhotoScalarWhereWithAggregatesInput | Prisma.PhotoScalarWhereWithAggregatesInput[];
    OR?: Prisma.PhotoScalarWhereWithAggregatesInput[];
    NOT?: Prisma.PhotoScalarWhereWithAggregatesInput | Prisma.PhotoScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Photo"> | string;
    title?: Prisma.StringWithAggregatesFilter<"Photo"> | string;
    description?: Prisma.StringNullableWithAggregatesFilter<"Photo"> | string | null;
    photographer?: Prisma.StringWithAggregatesFilter<"Photo"> | string;
    price?: Prisma.IntWithAggregatesFilter<"Photo"> | number;
    type?: Prisma.EnumAssetTypeWithAggregatesFilter<"Photo"> | $Enums.AssetType;
    width?: Prisma.IntNullableWithAggregatesFilter<"Photo"> | number | null;
    height?: Prisma.IntNullableWithAggregatesFilter<"Photo"> | number | null;
    format?: Prisma.StringNullableWithAggregatesFilter<"Photo"> | string | null;
    originalKey?: Prisma.StringWithAggregatesFilter<"Photo"> | string;
    thumbKey?: Prisma.StringWithAggregatesFilter<"Photo"> | string;
    watermarkKey?: Prisma.StringWithAggregatesFilter<"Photo"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Photo"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Photo"> | Date | string;
    deletedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"Photo"> | Date | string | null;
};
export type PhotoCreateInput = {
    id?: string;
    title: string;
    description?: string | null;
    photographer: string;
    price: number;
    type?: $Enums.AssetType;
    width?: number | null;
    height?: number | null;
    format?: string | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    keywords?: Prisma.KeywordCreateNestedManyWithoutPhotosInput;
    cartItems?: Prisma.CartItemCreateNestedManyWithoutPhotoInput;
    favorites?: Prisma.FavoriteCreateNestedManyWithoutPhotoInput;
    orderItems?: Prisma.OrderItemCreateNestedManyWithoutPhotoInput;
    downloads?: Prisma.DownloadCreateNestedManyWithoutPhotoInput;
    photoKeywords?: Prisma.PhotoKeywordCreateNestedManyWithoutPhotoInput;
};
export type PhotoUncheckedCreateInput = {
    id?: string;
    title: string;
    description?: string | null;
    photographer: string;
    price: number;
    type?: $Enums.AssetType;
    width?: number | null;
    height?: number | null;
    format?: string | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    keywords?: Prisma.KeywordUncheckedCreateNestedManyWithoutPhotosInput;
    cartItems?: Prisma.CartItemUncheckedCreateNestedManyWithoutPhotoInput;
    favorites?: Prisma.FavoriteUncheckedCreateNestedManyWithoutPhotoInput;
    orderItems?: Prisma.OrderItemUncheckedCreateNestedManyWithoutPhotoInput;
    downloads?: Prisma.DownloadUncheckedCreateNestedManyWithoutPhotoInput;
    photoKeywords?: Prisma.PhotoKeywordUncheckedCreateNestedManyWithoutPhotoInput;
};
export type PhotoUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    keywords?: Prisma.KeywordUpdateManyWithoutPhotosNestedInput;
    cartItems?: Prisma.CartItemUpdateManyWithoutPhotoNestedInput;
    favorites?: Prisma.FavoriteUpdateManyWithoutPhotoNestedInput;
    orderItems?: Prisma.OrderItemUpdateManyWithoutPhotoNestedInput;
    downloads?: Prisma.DownloadUpdateManyWithoutPhotoNestedInput;
    photoKeywords?: Prisma.PhotoKeywordUpdateManyWithoutPhotoNestedInput;
};
export type PhotoUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    keywords?: Prisma.KeywordUncheckedUpdateManyWithoutPhotosNestedInput;
    cartItems?: Prisma.CartItemUncheckedUpdateManyWithoutPhotoNestedInput;
    favorites?: Prisma.FavoriteUncheckedUpdateManyWithoutPhotoNestedInput;
    orderItems?: Prisma.OrderItemUncheckedUpdateManyWithoutPhotoNestedInput;
    downloads?: Prisma.DownloadUncheckedUpdateManyWithoutPhotoNestedInput;
    photoKeywords?: Prisma.PhotoKeywordUncheckedUpdateManyWithoutPhotoNestedInput;
};
export type PhotoCreateManyInput = {
    id?: string;
    title: string;
    description?: string | null;
    photographer: string;
    price: number;
    type?: $Enums.AssetType;
    width?: number | null;
    height?: number | null;
    format?: string | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
};
export type PhotoUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type PhotoUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
export type PhotoOrderByRelevanceInput = {
    fields: Prisma.PhotoOrderByRelevanceFieldEnum | Prisma.PhotoOrderByRelevanceFieldEnum[];
    sort: Prisma.SortOrder;
    search: string;
};
export type PhotoCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    photographer?: Prisma.SortOrder;
    price?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    width?: Prisma.SortOrder;
    height?: Prisma.SortOrder;
    format?: Prisma.SortOrder;
    originalKey?: Prisma.SortOrder;
    thumbKey?: Prisma.SortOrder;
    watermarkKey?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    deletedAt?: Prisma.SortOrder;
};
export type PhotoAvgOrderByAggregateInput = {
    price?: Prisma.SortOrder;
    width?: Prisma.SortOrder;
    height?: Prisma.SortOrder;
};
export type PhotoMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    photographer?: Prisma.SortOrder;
    price?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    width?: Prisma.SortOrder;
    height?: Prisma.SortOrder;
    format?: Prisma.SortOrder;
    originalKey?: Prisma.SortOrder;
    thumbKey?: Prisma.SortOrder;
    watermarkKey?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    deletedAt?: Prisma.SortOrder;
};
export type PhotoMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    description?: Prisma.SortOrder;
    photographer?: Prisma.SortOrder;
    price?: Prisma.SortOrder;
    type?: Prisma.SortOrder;
    width?: Prisma.SortOrder;
    height?: Prisma.SortOrder;
    format?: Prisma.SortOrder;
    originalKey?: Prisma.SortOrder;
    thumbKey?: Prisma.SortOrder;
    watermarkKey?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    deletedAt?: Prisma.SortOrder;
};
export type PhotoSumOrderByAggregateInput = {
    price?: Prisma.SortOrder;
    width?: Prisma.SortOrder;
    height?: Prisma.SortOrder;
};
export type PhotoListRelationFilter = {
    every?: Prisma.PhotoWhereInput;
    some?: Prisma.PhotoWhereInput;
    none?: Prisma.PhotoWhereInput;
};
export type PhotoOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type PhotoScalarRelationFilter = {
    is?: Prisma.PhotoWhereInput;
    isNot?: Prisma.PhotoWhereInput;
};
export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type EnumAssetTypeFieldUpdateOperationsInput = {
    set?: $Enums.AssetType;
};
export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type PhotoCreateNestedManyWithoutKeywordsInput = {
    create?: Prisma.XOR<Prisma.PhotoCreateWithoutKeywordsInput, Prisma.PhotoUncheckedCreateWithoutKeywordsInput> | Prisma.PhotoCreateWithoutKeywordsInput[] | Prisma.PhotoUncheckedCreateWithoutKeywordsInput[];
    connectOrCreate?: Prisma.PhotoCreateOrConnectWithoutKeywordsInput | Prisma.PhotoCreateOrConnectWithoutKeywordsInput[];
    connect?: Prisma.PhotoWhereUniqueInput | Prisma.PhotoWhereUniqueInput[];
};
export type PhotoUncheckedCreateNestedManyWithoutKeywordsInput = {
    create?: Prisma.XOR<Prisma.PhotoCreateWithoutKeywordsInput, Prisma.PhotoUncheckedCreateWithoutKeywordsInput> | Prisma.PhotoCreateWithoutKeywordsInput[] | Prisma.PhotoUncheckedCreateWithoutKeywordsInput[];
    connectOrCreate?: Prisma.PhotoCreateOrConnectWithoutKeywordsInput | Prisma.PhotoCreateOrConnectWithoutKeywordsInput[];
    connect?: Prisma.PhotoWhereUniqueInput | Prisma.PhotoWhereUniqueInput[];
};
export type PhotoUpdateManyWithoutKeywordsNestedInput = {
    create?: Prisma.XOR<Prisma.PhotoCreateWithoutKeywordsInput, Prisma.PhotoUncheckedCreateWithoutKeywordsInput> | Prisma.PhotoCreateWithoutKeywordsInput[] | Prisma.PhotoUncheckedCreateWithoutKeywordsInput[];
    connectOrCreate?: Prisma.PhotoCreateOrConnectWithoutKeywordsInput | Prisma.PhotoCreateOrConnectWithoutKeywordsInput[];
    upsert?: Prisma.PhotoUpsertWithWhereUniqueWithoutKeywordsInput | Prisma.PhotoUpsertWithWhereUniqueWithoutKeywordsInput[];
    set?: Prisma.PhotoWhereUniqueInput | Prisma.PhotoWhereUniqueInput[];
    disconnect?: Prisma.PhotoWhereUniqueInput | Prisma.PhotoWhereUniqueInput[];
    delete?: Prisma.PhotoWhereUniqueInput | Prisma.PhotoWhereUniqueInput[];
    connect?: Prisma.PhotoWhereUniqueInput | Prisma.PhotoWhereUniqueInput[];
    update?: Prisma.PhotoUpdateWithWhereUniqueWithoutKeywordsInput | Prisma.PhotoUpdateWithWhereUniqueWithoutKeywordsInput[];
    updateMany?: Prisma.PhotoUpdateManyWithWhereWithoutKeywordsInput | Prisma.PhotoUpdateManyWithWhereWithoutKeywordsInput[];
    deleteMany?: Prisma.PhotoScalarWhereInput | Prisma.PhotoScalarWhereInput[];
};
export type PhotoUncheckedUpdateManyWithoutKeywordsNestedInput = {
    create?: Prisma.XOR<Prisma.PhotoCreateWithoutKeywordsInput, Prisma.PhotoUncheckedCreateWithoutKeywordsInput> | Prisma.PhotoCreateWithoutKeywordsInput[] | Prisma.PhotoUncheckedCreateWithoutKeywordsInput[];
    connectOrCreate?: Prisma.PhotoCreateOrConnectWithoutKeywordsInput | Prisma.PhotoCreateOrConnectWithoutKeywordsInput[];
    upsert?: Prisma.PhotoUpsertWithWhereUniqueWithoutKeywordsInput | Prisma.PhotoUpsertWithWhereUniqueWithoutKeywordsInput[];
    set?: Prisma.PhotoWhereUniqueInput | Prisma.PhotoWhereUniqueInput[];
    disconnect?: Prisma.PhotoWhereUniqueInput | Prisma.PhotoWhereUniqueInput[];
    delete?: Prisma.PhotoWhereUniqueInput | Prisma.PhotoWhereUniqueInput[];
    connect?: Prisma.PhotoWhereUniqueInput | Prisma.PhotoWhereUniqueInput[];
    update?: Prisma.PhotoUpdateWithWhereUniqueWithoutKeywordsInput | Prisma.PhotoUpdateWithWhereUniqueWithoutKeywordsInput[];
    updateMany?: Prisma.PhotoUpdateManyWithWhereWithoutKeywordsInput | Prisma.PhotoUpdateManyWithWhereWithoutKeywordsInput[];
    deleteMany?: Prisma.PhotoScalarWhereInput | Prisma.PhotoScalarWhereInput[];
};
export type PhotoCreateNestedOneWithoutCartItemsInput = {
    create?: Prisma.XOR<Prisma.PhotoCreateWithoutCartItemsInput, Prisma.PhotoUncheckedCreateWithoutCartItemsInput>;
    connectOrCreate?: Prisma.PhotoCreateOrConnectWithoutCartItemsInput;
    connect?: Prisma.PhotoWhereUniqueInput;
};
export type PhotoUpdateOneRequiredWithoutCartItemsNestedInput = {
    create?: Prisma.XOR<Prisma.PhotoCreateWithoutCartItemsInput, Prisma.PhotoUncheckedCreateWithoutCartItemsInput>;
    connectOrCreate?: Prisma.PhotoCreateOrConnectWithoutCartItemsInput;
    upsert?: Prisma.PhotoUpsertWithoutCartItemsInput;
    connect?: Prisma.PhotoWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.PhotoUpdateToOneWithWhereWithoutCartItemsInput, Prisma.PhotoUpdateWithoutCartItemsInput>, Prisma.PhotoUncheckedUpdateWithoutCartItemsInput>;
};
export type PhotoCreateNestedOneWithoutFavoritesInput = {
    create?: Prisma.XOR<Prisma.PhotoCreateWithoutFavoritesInput, Prisma.PhotoUncheckedCreateWithoutFavoritesInput>;
    connectOrCreate?: Prisma.PhotoCreateOrConnectWithoutFavoritesInput;
    connect?: Prisma.PhotoWhereUniqueInput;
};
export type PhotoUpdateOneRequiredWithoutFavoritesNestedInput = {
    create?: Prisma.XOR<Prisma.PhotoCreateWithoutFavoritesInput, Prisma.PhotoUncheckedCreateWithoutFavoritesInput>;
    connectOrCreate?: Prisma.PhotoCreateOrConnectWithoutFavoritesInput;
    upsert?: Prisma.PhotoUpsertWithoutFavoritesInput;
    connect?: Prisma.PhotoWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.PhotoUpdateToOneWithWhereWithoutFavoritesInput, Prisma.PhotoUpdateWithoutFavoritesInput>, Prisma.PhotoUncheckedUpdateWithoutFavoritesInput>;
};
export type PhotoCreateNestedOneWithoutOrderItemsInput = {
    create?: Prisma.XOR<Prisma.PhotoCreateWithoutOrderItemsInput, Prisma.PhotoUncheckedCreateWithoutOrderItemsInput>;
    connectOrCreate?: Prisma.PhotoCreateOrConnectWithoutOrderItemsInput;
    connect?: Prisma.PhotoWhereUniqueInput;
};
export type PhotoUpdateOneRequiredWithoutOrderItemsNestedInput = {
    create?: Prisma.XOR<Prisma.PhotoCreateWithoutOrderItemsInput, Prisma.PhotoUncheckedCreateWithoutOrderItemsInput>;
    connectOrCreate?: Prisma.PhotoCreateOrConnectWithoutOrderItemsInput;
    upsert?: Prisma.PhotoUpsertWithoutOrderItemsInput;
    connect?: Prisma.PhotoWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.PhotoUpdateToOneWithWhereWithoutOrderItemsInput, Prisma.PhotoUpdateWithoutOrderItemsInput>, Prisma.PhotoUncheckedUpdateWithoutOrderItemsInput>;
};
export type PhotoCreateNestedOneWithoutDownloadsInput = {
    create?: Prisma.XOR<Prisma.PhotoCreateWithoutDownloadsInput, Prisma.PhotoUncheckedCreateWithoutDownloadsInput>;
    connectOrCreate?: Prisma.PhotoCreateOrConnectWithoutDownloadsInput;
    connect?: Prisma.PhotoWhereUniqueInput;
};
export type PhotoUpdateOneRequiredWithoutDownloadsNestedInput = {
    create?: Prisma.XOR<Prisma.PhotoCreateWithoutDownloadsInput, Prisma.PhotoUncheckedCreateWithoutDownloadsInput>;
    connectOrCreate?: Prisma.PhotoCreateOrConnectWithoutDownloadsInput;
    upsert?: Prisma.PhotoUpsertWithoutDownloadsInput;
    connect?: Prisma.PhotoWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.PhotoUpdateToOneWithWhereWithoutDownloadsInput, Prisma.PhotoUpdateWithoutDownloadsInput>, Prisma.PhotoUncheckedUpdateWithoutDownloadsInput>;
};
export type PhotoCreateNestedOneWithoutPhotoKeywordsInput = {
    create?: Prisma.XOR<Prisma.PhotoCreateWithoutPhotoKeywordsInput, Prisma.PhotoUncheckedCreateWithoutPhotoKeywordsInput>;
    connectOrCreate?: Prisma.PhotoCreateOrConnectWithoutPhotoKeywordsInput;
    connect?: Prisma.PhotoWhereUniqueInput;
};
export type PhotoUpdateOneRequiredWithoutPhotoKeywordsNestedInput = {
    create?: Prisma.XOR<Prisma.PhotoCreateWithoutPhotoKeywordsInput, Prisma.PhotoUncheckedCreateWithoutPhotoKeywordsInput>;
    connectOrCreate?: Prisma.PhotoCreateOrConnectWithoutPhotoKeywordsInput;
    upsert?: Prisma.PhotoUpsertWithoutPhotoKeywordsInput;
    connect?: Prisma.PhotoWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.PhotoUpdateToOneWithWhereWithoutPhotoKeywordsInput, Prisma.PhotoUpdateWithoutPhotoKeywordsInput>, Prisma.PhotoUncheckedUpdateWithoutPhotoKeywordsInput>;
};
export type PhotoCreateWithoutKeywordsInput = {
    id?: string;
    title: string;
    description?: string | null;
    photographer: string;
    price: number;
    type?: $Enums.AssetType;
    width?: number | null;
    height?: number | null;
    format?: string | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    cartItems?: Prisma.CartItemCreateNestedManyWithoutPhotoInput;
    favorites?: Prisma.FavoriteCreateNestedManyWithoutPhotoInput;
    orderItems?: Prisma.OrderItemCreateNestedManyWithoutPhotoInput;
    downloads?: Prisma.DownloadCreateNestedManyWithoutPhotoInput;
    photoKeywords?: Prisma.PhotoKeywordCreateNestedManyWithoutPhotoInput;
};
export type PhotoUncheckedCreateWithoutKeywordsInput = {
    id?: string;
    title: string;
    description?: string | null;
    photographer: string;
    price: number;
    type?: $Enums.AssetType;
    width?: number | null;
    height?: number | null;
    format?: string | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    cartItems?: Prisma.CartItemUncheckedCreateNestedManyWithoutPhotoInput;
    favorites?: Prisma.FavoriteUncheckedCreateNestedManyWithoutPhotoInput;
    orderItems?: Prisma.OrderItemUncheckedCreateNestedManyWithoutPhotoInput;
    downloads?: Prisma.DownloadUncheckedCreateNestedManyWithoutPhotoInput;
    photoKeywords?: Prisma.PhotoKeywordUncheckedCreateNestedManyWithoutPhotoInput;
};
export type PhotoCreateOrConnectWithoutKeywordsInput = {
    where: Prisma.PhotoWhereUniqueInput;
    create: Prisma.XOR<Prisma.PhotoCreateWithoutKeywordsInput, Prisma.PhotoUncheckedCreateWithoutKeywordsInput>;
};
export type PhotoUpsertWithWhereUniqueWithoutKeywordsInput = {
    where: Prisma.PhotoWhereUniqueInput;
    update: Prisma.XOR<Prisma.PhotoUpdateWithoutKeywordsInput, Prisma.PhotoUncheckedUpdateWithoutKeywordsInput>;
    create: Prisma.XOR<Prisma.PhotoCreateWithoutKeywordsInput, Prisma.PhotoUncheckedCreateWithoutKeywordsInput>;
};
export type PhotoUpdateWithWhereUniqueWithoutKeywordsInput = {
    where: Prisma.PhotoWhereUniqueInput;
    data: Prisma.XOR<Prisma.PhotoUpdateWithoutKeywordsInput, Prisma.PhotoUncheckedUpdateWithoutKeywordsInput>;
};
export type PhotoUpdateManyWithWhereWithoutKeywordsInput = {
    where: Prisma.PhotoScalarWhereInput;
    data: Prisma.XOR<Prisma.PhotoUpdateManyMutationInput, Prisma.PhotoUncheckedUpdateManyWithoutKeywordsInput>;
};
export type PhotoScalarWhereInput = {
    AND?: Prisma.PhotoScalarWhereInput | Prisma.PhotoScalarWhereInput[];
    OR?: Prisma.PhotoScalarWhereInput[];
    NOT?: Prisma.PhotoScalarWhereInput | Prisma.PhotoScalarWhereInput[];
    id?: Prisma.StringFilter<"Photo"> | string;
    title?: Prisma.StringFilter<"Photo"> | string;
    description?: Prisma.StringNullableFilter<"Photo"> | string | null;
    photographer?: Prisma.StringFilter<"Photo"> | string;
    price?: Prisma.IntFilter<"Photo"> | number;
    type?: Prisma.EnumAssetTypeFilter<"Photo"> | $Enums.AssetType;
    width?: Prisma.IntNullableFilter<"Photo"> | number | null;
    height?: Prisma.IntNullableFilter<"Photo"> | number | null;
    format?: Prisma.StringNullableFilter<"Photo"> | string | null;
    originalKey?: Prisma.StringFilter<"Photo"> | string;
    thumbKey?: Prisma.StringFilter<"Photo"> | string;
    watermarkKey?: Prisma.StringFilter<"Photo"> | string;
    createdAt?: Prisma.DateTimeFilter<"Photo"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Photo"> | Date | string;
    deletedAt?: Prisma.DateTimeNullableFilter<"Photo"> | Date | string | null;
};
export type PhotoCreateWithoutCartItemsInput = {
    id?: string;
    title: string;
    description?: string | null;
    photographer: string;
    price: number;
    type?: $Enums.AssetType;
    width?: number | null;
    height?: number | null;
    format?: string | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    keywords?: Prisma.KeywordCreateNestedManyWithoutPhotosInput;
    favorites?: Prisma.FavoriteCreateNestedManyWithoutPhotoInput;
    orderItems?: Prisma.OrderItemCreateNestedManyWithoutPhotoInput;
    downloads?: Prisma.DownloadCreateNestedManyWithoutPhotoInput;
    photoKeywords?: Prisma.PhotoKeywordCreateNestedManyWithoutPhotoInput;
};
export type PhotoUncheckedCreateWithoutCartItemsInput = {
    id?: string;
    title: string;
    description?: string | null;
    photographer: string;
    price: number;
    type?: $Enums.AssetType;
    width?: number | null;
    height?: number | null;
    format?: string | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    keywords?: Prisma.KeywordUncheckedCreateNestedManyWithoutPhotosInput;
    favorites?: Prisma.FavoriteUncheckedCreateNestedManyWithoutPhotoInput;
    orderItems?: Prisma.OrderItemUncheckedCreateNestedManyWithoutPhotoInput;
    downloads?: Prisma.DownloadUncheckedCreateNestedManyWithoutPhotoInput;
    photoKeywords?: Prisma.PhotoKeywordUncheckedCreateNestedManyWithoutPhotoInput;
};
export type PhotoCreateOrConnectWithoutCartItemsInput = {
    where: Prisma.PhotoWhereUniqueInput;
    create: Prisma.XOR<Prisma.PhotoCreateWithoutCartItemsInput, Prisma.PhotoUncheckedCreateWithoutCartItemsInput>;
};
export type PhotoUpsertWithoutCartItemsInput = {
    update: Prisma.XOR<Prisma.PhotoUpdateWithoutCartItemsInput, Prisma.PhotoUncheckedUpdateWithoutCartItemsInput>;
    create: Prisma.XOR<Prisma.PhotoCreateWithoutCartItemsInput, Prisma.PhotoUncheckedCreateWithoutCartItemsInput>;
    where?: Prisma.PhotoWhereInput;
};
export type PhotoUpdateToOneWithWhereWithoutCartItemsInput = {
    where?: Prisma.PhotoWhereInput;
    data: Prisma.XOR<Prisma.PhotoUpdateWithoutCartItemsInput, Prisma.PhotoUncheckedUpdateWithoutCartItemsInput>;
};
export type PhotoUpdateWithoutCartItemsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    keywords?: Prisma.KeywordUpdateManyWithoutPhotosNestedInput;
    favorites?: Prisma.FavoriteUpdateManyWithoutPhotoNestedInput;
    orderItems?: Prisma.OrderItemUpdateManyWithoutPhotoNestedInput;
    downloads?: Prisma.DownloadUpdateManyWithoutPhotoNestedInput;
    photoKeywords?: Prisma.PhotoKeywordUpdateManyWithoutPhotoNestedInput;
};
export type PhotoUncheckedUpdateWithoutCartItemsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    keywords?: Prisma.KeywordUncheckedUpdateManyWithoutPhotosNestedInput;
    favorites?: Prisma.FavoriteUncheckedUpdateManyWithoutPhotoNestedInput;
    orderItems?: Prisma.OrderItemUncheckedUpdateManyWithoutPhotoNestedInput;
    downloads?: Prisma.DownloadUncheckedUpdateManyWithoutPhotoNestedInput;
    photoKeywords?: Prisma.PhotoKeywordUncheckedUpdateManyWithoutPhotoNestedInput;
};
export type PhotoCreateWithoutFavoritesInput = {
    id?: string;
    title: string;
    description?: string | null;
    photographer: string;
    price: number;
    type?: $Enums.AssetType;
    width?: number | null;
    height?: number | null;
    format?: string | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    keywords?: Prisma.KeywordCreateNestedManyWithoutPhotosInput;
    cartItems?: Prisma.CartItemCreateNestedManyWithoutPhotoInput;
    orderItems?: Prisma.OrderItemCreateNestedManyWithoutPhotoInput;
    downloads?: Prisma.DownloadCreateNestedManyWithoutPhotoInput;
    photoKeywords?: Prisma.PhotoKeywordCreateNestedManyWithoutPhotoInput;
};
export type PhotoUncheckedCreateWithoutFavoritesInput = {
    id?: string;
    title: string;
    description?: string | null;
    photographer: string;
    price: number;
    type?: $Enums.AssetType;
    width?: number | null;
    height?: number | null;
    format?: string | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    keywords?: Prisma.KeywordUncheckedCreateNestedManyWithoutPhotosInput;
    cartItems?: Prisma.CartItemUncheckedCreateNestedManyWithoutPhotoInput;
    orderItems?: Prisma.OrderItemUncheckedCreateNestedManyWithoutPhotoInput;
    downloads?: Prisma.DownloadUncheckedCreateNestedManyWithoutPhotoInput;
    photoKeywords?: Prisma.PhotoKeywordUncheckedCreateNestedManyWithoutPhotoInput;
};
export type PhotoCreateOrConnectWithoutFavoritesInput = {
    where: Prisma.PhotoWhereUniqueInput;
    create: Prisma.XOR<Prisma.PhotoCreateWithoutFavoritesInput, Prisma.PhotoUncheckedCreateWithoutFavoritesInput>;
};
export type PhotoUpsertWithoutFavoritesInput = {
    update: Prisma.XOR<Prisma.PhotoUpdateWithoutFavoritesInput, Prisma.PhotoUncheckedUpdateWithoutFavoritesInput>;
    create: Prisma.XOR<Prisma.PhotoCreateWithoutFavoritesInput, Prisma.PhotoUncheckedCreateWithoutFavoritesInput>;
    where?: Prisma.PhotoWhereInput;
};
export type PhotoUpdateToOneWithWhereWithoutFavoritesInput = {
    where?: Prisma.PhotoWhereInput;
    data: Prisma.XOR<Prisma.PhotoUpdateWithoutFavoritesInput, Prisma.PhotoUncheckedUpdateWithoutFavoritesInput>;
};
export type PhotoUpdateWithoutFavoritesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    keywords?: Prisma.KeywordUpdateManyWithoutPhotosNestedInput;
    cartItems?: Prisma.CartItemUpdateManyWithoutPhotoNestedInput;
    orderItems?: Prisma.OrderItemUpdateManyWithoutPhotoNestedInput;
    downloads?: Prisma.DownloadUpdateManyWithoutPhotoNestedInput;
    photoKeywords?: Prisma.PhotoKeywordUpdateManyWithoutPhotoNestedInput;
};
export type PhotoUncheckedUpdateWithoutFavoritesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    keywords?: Prisma.KeywordUncheckedUpdateManyWithoutPhotosNestedInput;
    cartItems?: Prisma.CartItemUncheckedUpdateManyWithoutPhotoNestedInput;
    orderItems?: Prisma.OrderItemUncheckedUpdateManyWithoutPhotoNestedInput;
    downloads?: Prisma.DownloadUncheckedUpdateManyWithoutPhotoNestedInput;
    photoKeywords?: Prisma.PhotoKeywordUncheckedUpdateManyWithoutPhotoNestedInput;
};
export type PhotoCreateWithoutOrderItemsInput = {
    id?: string;
    title: string;
    description?: string | null;
    photographer: string;
    price: number;
    type?: $Enums.AssetType;
    width?: number | null;
    height?: number | null;
    format?: string | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    keywords?: Prisma.KeywordCreateNestedManyWithoutPhotosInput;
    cartItems?: Prisma.CartItemCreateNestedManyWithoutPhotoInput;
    favorites?: Prisma.FavoriteCreateNestedManyWithoutPhotoInput;
    downloads?: Prisma.DownloadCreateNestedManyWithoutPhotoInput;
    photoKeywords?: Prisma.PhotoKeywordCreateNestedManyWithoutPhotoInput;
};
export type PhotoUncheckedCreateWithoutOrderItemsInput = {
    id?: string;
    title: string;
    description?: string | null;
    photographer: string;
    price: number;
    type?: $Enums.AssetType;
    width?: number | null;
    height?: number | null;
    format?: string | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    keywords?: Prisma.KeywordUncheckedCreateNestedManyWithoutPhotosInput;
    cartItems?: Prisma.CartItemUncheckedCreateNestedManyWithoutPhotoInput;
    favorites?: Prisma.FavoriteUncheckedCreateNestedManyWithoutPhotoInput;
    downloads?: Prisma.DownloadUncheckedCreateNestedManyWithoutPhotoInput;
    photoKeywords?: Prisma.PhotoKeywordUncheckedCreateNestedManyWithoutPhotoInput;
};
export type PhotoCreateOrConnectWithoutOrderItemsInput = {
    where: Prisma.PhotoWhereUniqueInput;
    create: Prisma.XOR<Prisma.PhotoCreateWithoutOrderItemsInput, Prisma.PhotoUncheckedCreateWithoutOrderItemsInput>;
};
export type PhotoUpsertWithoutOrderItemsInput = {
    update: Prisma.XOR<Prisma.PhotoUpdateWithoutOrderItemsInput, Prisma.PhotoUncheckedUpdateWithoutOrderItemsInput>;
    create: Prisma.XOR<Prisma.PhotoCreateWithoutOrderItemsInput, Prisma.PhotoUncheckedCreateWithoutOrderItemsInput>;
    where?: Prisma.PhotoWhereInput;
};
export type PhotoUpdateToOneWithWhereWithoutOrderItemsInput = {
    where?: Prisma.PhotoWhereInput;
    data: Prisma.XOR<Prisma.PhotoUpdateWithoutOrderItemsInput, Prisma.PhotoUncheckedUpdateWithoutOrderItemsInput>;
};
export type PhotoUpdateWithoutOrderItemsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    keywords?: Prisma.KeywordUpdateManyWithoutPhotosNestedInput;
    cartItems?: Prisma.CartItemUpdateManyWithoutPhotoNestedInput;
    favorites?: Prisma.FavoriteUpdateManyWithoutPhotoNestedInput;
    downloads?: Prisma.DownloadUpdateManyWithoutPhotoNestedInput;
    photoKeywords?: Prisma.PhotoKeywordUpdateManyWithoutPhotoNestedInput;
};
export type PhotoUncheckedUpdateWithoutOrderItemsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    keywords?: Prisma.KeywordUncheckedUpdateManyWithoutPhotosNestedInput;
    cartItems?: Prisma.CartItemUncheckedUpdateManyWithoutPhotoNestedInput;
    favorites?: Prisma.FavoriteUncheckedUpdateManyWithoutPhotoNestedInput;
    downloads?: Prisma.DownloadUncheckedUpdateManyWithoutPhotoNestedInput;
    photoKeywords?: Prisma.PhotoKeywordUncheckedUpdateManyWithoutPhotoNestedInput;
};
export type PhotoCreateWithoutDownloadsInput = {
    id?: string;
    title: string;
    description?: string | null;
    photographer: string;
    price: number;
    type?: $Enums.AssetType;
    width?: number | null;
    height?: number | null;
    format?: string | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    keywords?: Prisma.KeywordCreateNestedManyWithoutPhotosInput;
    cartItems?: Prisma.CartItemCreateNestedManyWithoutPhotoInput;
    favorites?: Prisma.FavoriteCreateNestedManyWithoutPhotoInput;
    orderItems?: Prisma.OrderItemCreateNestedManyWithoutPhotoInput;
    photoKeywords?: Prisma.PhotoKeywordCreateNestedManyWithoutPhotoInput;
};
export type PhotoUncheckedCreateWithoutDownloadsInput = {
    id?: string;
    title: string;
    description?: string | null;
    photographer: string;
    price: number;
    type?: $Enums.AssetType;
    width?: number | null;
    height?: number | null;
    format?: string | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    keywords?: Prisma.KeywordUncheckedCreateNestedManyWithoutPhotosInput;
    cartItems?: Prisma.CartItemUncheckedCreateNestedManyWithoutPhotoInput;
    favorites?: Prisma.FavoriteUncheckedCreateNestedManyWithoutPhotoInput;
    orderItems?: Prisma.OrderItemUncheckedCreateNestedManyWithoutPhotoInput;
    photoKeywords?: Prisma.PhotoKeywordUncheckedCreateNestedManyWithoutPhotoInput;
};
export type PhotoCreateOrConnectWithoutDownloadsInput = {
    where: Prisma.PhotoWhereUniqueInput;
    create: Prisma.XOR<Prisma.PhotoCreateWithoutDownloadsInput, Prisma.PhotoUncheckedCreateWithoutDownloadsInput>;
};
export type PhotoUpsertWithoutDownloadsInput = {
    update: Prisma.XOR<Prisma.PhotoUpdateWithoutDownloadsInput, Prisma.PhotoUncheckedUpdateWithoutDownloadsInput>;
    create: Prisma.XOR<Prisma.PhotoCreateWithoutDownloadsInput, Prisma.PhotoUncheckedCreateWithoutDownloadsInput>;
    where?: Prisma.PhotoWhereInput;
};
export type PhotoUpdateToOneWithWhereWithoutDownloadsInput = {
    where?: Prisma.PhotoWhereInput;
    data: Prisma.XOR<Prisma.PhotoUpdateWithoutDownloadsInput, Prisma.PhotoUncheckedUpdateWithoutDownloadsInput>;
};
export type PhotoUpdateWithoutDownloadsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    keywords?: Prisma.KeywordUpdateManyWithoutPhotosNestedInput;
    cartItems?: Prisma.CartItemUpdateManyWithoutPhotoNestedInput;
    favorites?: Prisma.FavoriteUpdateManyWithoutPhotoNestedInput;
    orderItems?: Prisma.OrderItemUpdateManyWithoutPhotoNestedInput;
    photoKeywords?: Prisma.PhotoKeywordUpdateManyWithoutPhotoNestedInput;
};
export type PhotoUncheckedUpdateWithoutDownloadsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    keywords?: Prisma.KeywordUncheckedUpdateManyWithoutPhotosNestedInput;
    cartItems?: Prisma.CartItemUncheckedUpdateManyWithoutPhotoNestedInput;
    favorites?: Prisma.FavoriteUncheckedUpdateManyWithoutPhotoNestedInput;
    orderItems?: Prisma.OrderItemUncheckedUpdateManyWithoutPhotoNestedInput;
    photoKeywords?: Prisma.PhotoKeywordUncheckedUpdateManyWithoutPhotoNestedInput;
};
export type PhotoCreateWithoutPhotoKeywordsInput = {
    id?: string;
    title: string;
    description?: string | null;
    photographer: string;
    price: number;
    type?: $Enums.AssetType;
    width?: number | null;
    height?: number | null;
    format?: string | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    keywords?: Prisma.KeywordCreateNestedManyWithoutPhotosInput;
    cartItems?: Prisma.CartItemCreateNestedManyWithoutPhotoInput;
    favorites?: Prisma.FavoriteCreateNestedManyWithoutPhotoInput;
    orderItems?: Prisma.OrderItemCreateNestedManyWithoutPhotoInput;
    downloads?: Prisma.DownloadCreateNestedManyWithoutPhotoInput;
};
export type PhotoUncheckedCreateWithoutPhotoKeywordsInput = {
    id?: string;
    title: string;
    description?: string | null;
    photographer: string;
    price: number;
    type?: $Enums.AssetType;
    width?: number | null;
    height?: number | null;
    format?: string | null;
    originalKey: string;
    thumbKey: string;
    watermarkKey: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
    keywords?: Prisma.KeywordUncheckedCreateNestedManyWithoutPhotosInput;
    cartItems?: Prisma.CartItemUncheckedCreateNestedManyWithoutPhotoInput;
    favorites?: Prisma.FavoriteUncheckedCreateNestedManyWithoutPhotoInput;
    orderItems?: Prisma.OrderItemUncheckedCreateNestedManyWithoutPhotoInput;
    downloads?: Prisma.DownloadUncheckedCreateNestedManyWithoutPhotoInput;
};
export type PhotoCreateOrConnectWithoutPhotoKeywordsInput = {
    where: Prisma.PhotoWhereUniqueInput;
    create: Prisma.XOR<Prisma.PhotoCreateWithoutPhotoKeywordsInput, Prisma.PhotoUncheckedCreateWithoutPhotoKeywordsInput>;
};
export type PhotoUpsertWithoutPhotoKeywordsInput = {
    update: Prisma.XOR<Prisma.PhotoUpdateWithoutPhotoKeywordsInput, Prisma.PhotoUncheckedUpdateWithoutPhotoKeywordsInput>;
    create: Prisma.XOR<Prisma.PhotoCreateWithoutPhotoKeywordsInput, Prisma.PhotoUncheckedCreateWithoutPhotoKeywordsInput>;
    where?: Prisma.PhotoWhereInput;
};
export type PhotoUpdateToOneWithWhereWithoutPhotoKeywordsInput = {
    where?: Prisma.PhotoWhereInput;
    data: Prisma.XOR<Prisma.PhotoUpdateWithoutPhotoKeywordsInput, Prisma.PhotoUncheckedUpdateWithoutPhotoKeywordsInput>;
};
export type PhotoUpdateWithoutPhotoKeywordsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    keywords?: Prisma.KeywordUpdateManyWithoutPhotosNestedInput;
    cartItems?: Prisma.CartItemUpdateManyWithoutPhotoNestedInput;
    favorites?: Prisma.FavoriteUpdateManyWithoutPhotoNestedInput;
    orderItems?: Prisma.OrderItemUpdateManyWithoutPhotoNestedInput;
    downloads?: Prisma.DownloadUpdateManyWithoutPhotoNestedInput;
};
export type PhotoUncheckedUpdateWithoutPhotoKeywordsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    keywords?: Prisma.KeywordUncheckedUpdateManyWithoutPhotosNestedInput;
    cartItems?: Prisma.CartItemUncheckedUpdateManyWithoutPhotoNestedInput;
    favorites?: Prisma.FavoriteUncheckedUpdateManyWithoutPhotoNestedInput;
    orderItems?: Prisma.OrderItemUncheckedUpdateManyWithoutPhotoNestedInput;
    downloads?: Prisma.DownloadUncheckedUpdateManyWithoutPhotoNestedInput;
};
export type PhotoUpdateWithoutKeywordsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    cartItems?: Prisma.CartItemUpdateManyWithoutPhotoNestedInput;
    favorites?: Prisma.FavoriteUpdateManyWithoutPhotoNestedInput;
    orderItems?: Prisma.OrderItemUpdateManyWithoutPhotoNestedInput;
    downloads?: Prisma.DownloadUpdateManyWithoutPhotoNestedInput;
    photoKeywords?: Prisma.PhotoKeywordUpdateManyWithoutPhotoNestedInput;
};
export type PhotoUncheckedUpdateWithoutKeywordsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    cartItems?: Prisma.CartItemUncheckedUpdateManyWithoutPhotoNestedInput;
    favorites?: Prisma.FavoriteUncheckedUpdateManyWithoutPhotoNestedInput;
    orderItems?: Prisma.OrderItemUncheckedUpdateManyWithoutPhotoNestedInput;
    downloads?: Prisma.DownloadUncheckedUpdateManyWithoutPhotoNestedInput;
    photoKeywords?: Prisma.PhotoKeywordUncheckedUpdateManyWithoutPhotoNestedInput;
};
export type PhotoUncheckedUpdateManyWithoutKeywordsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    photographer?: Prisma.StringFieldUpdateOperationsInput | string;
    price?: Prisma.IntFieldUpdateOperationsInput | number;
    type?: Prisma.EnumAssetTypeFieldUpdateOperationsInput | $Enums.AssetType;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    format?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    originalKey?: Prisma.StringFieldUpdateOperationsInput | string;
    thumbKey?: Prisma.StringFieldUpdateOperationsInput | string;
    watermarkKey?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    deletedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
};
/**
 * Count Type PhotoCountOutputType
 */
export type PhotoCountOutputType = {
    keywords: number;
    cartItems: number;
    favorites: number;
    orderItems: number;
    downloads: number;
    photoKeywords: number;
};
export type PhotoCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    keywords?: boolean | PhotoCountOutputTypeCountKeywordsArgs;
    cartItems?: boolean | PhotoCountOutputTypeCountCartItemsArgs;
    favorites?: boolean | PhotoCountOutputTypeCountFavoritesArgs;
    orderItems?: boolean | PhotoCountOutputTypeCountOrderItemsArgs;
    downloads?: boolean | PhotoCountOutputTypeCountDownloadsArgs;
    photoKeywords?: boolean | PhotoCountOutputTypeCountPhotoKeywordsArgs;
};
/**
 * PhotoCountOutputType without action
 */
export type PhotoCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PhotoCountOutputType
     */
    select?: Prisma.PhotoCountOutputTypeSelect<ExtArgs> | null;
};
/**
 * PhotoCountOutputType without action
 */
export type PhotoCountOutputTypeCountKeywordsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.KeywordWhereInput;
};
/**
 * PhotoCountOutputType without action
 */
export type PhotoCountOutputTypeCountCartItemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CartItemWhereInput;
};
/**
 * PhotoCountOutputType without action
 */
export type PhotoCountOutputTypeCountFavoritesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.FavoriteWhereInput;
};
/**
 * PhotoCountOutputType without action
 */
export type PhotoCountOutputTypeCountOrderItemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.OrderItemWhereInput;
};
/**
 * PhotoCountOutputType without action
 */
export type PhotoCountOutputTypeCountDownloadsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.DownloadWhereInput;
};
/**
 * PhotoCountOutputType without action
 */
export type PhotoCountOutputTypeCountPhotoKeywordsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PhotoKeywordWhereInput;
};
export type PhotoSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    title?: boolean;
    description?: boolean;
    photographer?: boolean;
    price?: boolean;
    type?: boolean;
    width?: boolean;
    height?: boolean;
    format?: boolean;
    originalKey?: boolean;
    thumbKey?: boolean;
    watermarkKey?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    deletedAt?: boolean;
    keywords?: boolean | Prisma.Photo$keywordsArgs<ExtArgs>;
    cartItems?: boolean | Prisma.Photo$cartItemsArgs<ExtArgs>;
    favorites?: boolean | Prisma.Photo$favoritesArgs<ExtArgs>;
    orderItems?: boolean | Prisma.Photo$orderItemsArgs<ExtArgs>;
    downloads?: boolean | Prisma.Photo$downloadsArgs<ExtArgs>;
    photoKeywords?: boolean | Prisma.Photo$photoKeywordsArgs<ExtArgs>;
    _count?: boolean | Prisma.PhotoCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["photo"]>;
export type PhotoSelectScalar = {
    id?: boolean;
    title?: boolean;
    description?: boolean;
    photographer?: boolean;
    price?: boolean;
    type?: boolean;
    width?: boolean;
    height?: boolean;
    format?: boolean;
    originalKey?: boolean;
    thumbKey?: boolean;
    watermarkKey?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    deletedAt?: boolean;
};
export type PhotoOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "title" | "description" | "photographer" | "price" | "type" | "width" | "height" | "format" | "originalKey" | "thumbKey" | "watermarkKey" | "createdAt" | "updatedAt" | "deletedAt", ExtArgs["result"]["photo"]>;
export type PhotoInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    keywords?: boolean | Prisma.Photo$keywordsArgs<ExtArgs>;
    cartItems?: boolean | Prisma.Photo$cartItemsArgs<ExtArgs>;
    favorites?: boolean | Prisma.Photo$favoritesArgs<ExtArgs>;
    orderItems?: boolean | Prisma.Photo$orderItemsArgs<ExtArgs>;
    downloads?: boolean | Prisma.Photo$downloadsArgs<ExtArgs>;
    photoKeywords?: boolean | Prisma.Photo$photoKeywordsArgs<ExtArgs>;
    _count?: boolean | Prisma.PhotoCountOutputTypeDefaultArgs<ExtArgs>;
};
export type $PhotoPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Photo";
    objects: {
        keywords: Prisma.$KeywordPayload<ExtArgs>[];
        cartItems: Prisma.$CartItemPayload<ExtArgs>[];
        favorites: Prisma.$FavoritePayload<ExtArgs>[];
        orderItems: Prisma.$OrderItemPayload<ExtArgs>[];
        downloads: Prisma.$DownloadPayload<ExtArgs>[];
        photoKeywords: Prisma.$PhotoKeywordPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        title: string;
        description: string | null;
        photographer: string;
        price: number;
        type: $Enums.AssetType;
        width: number | null;
        height: number | null;
        format: string | null;
        originalKey: string;
        thumbKey: string;
        watermarkKey: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }, ExtArgs["result"]["photo"]>;
    composites: {};
};
export type PhotoGetPayload<S extends boolean | null | undefined | PhotoDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$PhotoPayload, S>;
export type PhotoCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<PhotoFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: PhotoCountAggregateInputType | true;
};
export interface PhotoDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Photo'];
        meta: {
            name: 'Photo';
        };
    };
    /**
     * Find zero or one Photo that matches the filter.
     * @param {PhotoFindUniqueArgs} args - Arguments to find a Photo
     * @example
     * // Get one Photo
     * const photo = await prisma.photo.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PhotoFindUniqueArgs>(args: Prisma.SelectSubset<T, PhotoFindUniqueArgs<ExtArgs>>): Prisma.Prisma__PhotoClient<runtime.Types.Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one Photo that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PhotoFindUniqueOrThrowArgs} args - Arguments to find a Photo
     * @example
     * // Get one Photo
     * const photo = await prisma.photo.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PhotoFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, PhotoFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__PhotoClient<runtime.Types.Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Photo that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoFindFirstArgs} args - Arguments to find a Photo
     * @example
     * // Get one Photo
     * const photo = await prisma.photo.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PhotoFindFirstArgs>(args?: Prisma.SelectSubset<T, PhotoFindFirstArgs<ExtArgs>>): Prisma.Prisma__PhotoClient<runtime.Types.Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Photo that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoFindFirstOrThrowArgs} args - Arguments to find a Photo
     * @example
     * // Get one Photo
     * const photo = await prisma.photo.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PhotoFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, PhotoFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__PhotoClient<runtime.Types.Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more Photos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Photos
     * const photos = await prisma.photo.findMany()
     *
     * // Get first 10 Photos
     * const photos = await prisma.photo.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const photoWithIdOnly = await prisma.photo.findMany({ select: { id: true } })
     *
     */
    findMany<T extends PhotoFindManyArgs>(args?: Prisma.SelectSubset<T, PhotoFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a Photo.
     * @param {PhotoCreateArgs} args - Arguments to create a Photo.
     * @example
     * // Create one Photo
     * const Photo = await prisma.photo.create({
     *   data: {
     *     // ... data to create a Photo
     *   }
     * })
     *
     */
    create<T extends PhotoCreateArgs>(args: Prisma.SelectSubset<T, PhotoCreateArgs<ExtArgs>>): Prisma.Prisma__PhotoClient<runtime.Types.Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many Photos.
     * @param {PhotoCreateManyArgs} args - Arguments to create many Photos.
     * @example
     * // Create many Photos
     * const photo = await prisma.photo.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends PhotoCreateManyArgs>(args?: Prisma.SelectSubset<T, PhotoCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Delete a Photo.
     * @param {PhotoDeleteArgs} args - Arguments to delete one Photo.
     * @example
     * // Delete one Photo
     * const Photo = await prisma.photo.delete({
     *   where: {
     *     // ... filter to delete one Photo
     *   }
     * })
     *
     */
    delete<T extends PhotoDeleteArgs>(args: Prisma.SelectSubset<T, PhotoDeleteArgs<ExtArgs>>): Prisma.Prisma__PhotoClient<runtime.Types.Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one Photo.
     * @param {PhotoUpdateArgs} args - Arguments to update one Photo.
     * @example
     * // Update one Photo
     * const photo = await prisma.photo.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends PhotoUpdateArgs>(args: Prisma.SelectSubset<T, PhotoUpdateArgs<ExtArgs>>): Prisma.Prisma__PhotoClient<runtime.Types.Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more Photos.
     * @param {PhotoDeleteManyArgs} args - Arguments to filter Photos to delete.
     * @example
     * // Delete a few Photos
     * const { count } = await prisma.photo.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends PhotoDeleteManyArgs>(args?: Prisma.SelectSubset<T, PhotoDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Photos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Photos
     * const photo = await prisma.photo.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends PhotoUpdateManyArgs>(args: Prisma.SelectSubset<T, PhotoUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create or update one Photo.
     * @param {PhotoUpsertArgs} args - Arguments to update or create a Photo.
     * @example
     * // Update or create a Photo
     * const photo = await prisma.photo.upsert({
     *   create: {
     *     // ... data to create a Photo
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Photo we want to update
     *   }
     * })
     */
    upsert<T extends PhotoUpsertArgs>(args: Prisma.SelectSubset<T, PhotoUpsertArgs<ExtArgs>>): Prisma.Prisma__PhotoClient<runtime.Types.Result.GetResult<Prisma.$PhotoPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of Photos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoCountArgs} args - Arguments to filter Photos to count.
     * @example
     * // Count the number of Photos
     * const count = await prisma.photo.count({
     *   where: {
     *     // ... the filter for the Photos we want to count
     *   }
     * })
    **/
    count<T extends PhotoCountArgs>(args?: Prisma.Subset<T, PhotoCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], PhotoCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a Photo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PhotoAggregateArgs>(args: Prisma.Subset<T, PhotoAggregateArgs>): Prisma.PrismaPromise<GetPhotoAggregateType<T>>;
    /**
     * Group by Photo.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PhotoGroupByArgs} args - Group by arguments.
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
    groupBy<T extends PhotoGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: PhotoGroupByArgs['orderBy'];
    } : {
        orderBy?: PhotoGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, PhotoGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPhotoGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Photo model
     */
    readonly fields: PhotoFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for Photo.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__PhotoClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    keywords<T extends Prisma.Photo$keywordsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Photo$keywordsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$KeywordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    cartItems<T extends Prisma.Photo$cartItemsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Photo$cartItemsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CartItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    favorites<T extends Prisma.Photo$favoritesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Photo$favoritesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$FavoritePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    orderItems<T extends Prisma.Photo$orderItemsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Photo$orderItemsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$OrderItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    downloads<T extends Prisma.Photo$downloadsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Photo$downloadsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$DownloadPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    photoKeywords<T extends Prisma.Photo$photoKeywordsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Photo$photoKeywordsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PhotoKeywordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
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
 * Fields of the Photo model
 */
export interface PhotoFieldRefs {
    readonly id: Prisma.FieldRef<"Photo", 'String'>;
    readonly title: Prisma.FieldRef<"Photo", 'String'>;
    readonly description: Prisma.FieldRef<"Photo", 'String'>;
    readonly photographer: Prisma.FieldRef<"Photo", 'String'>;
    readonly price: Prisma.FieldRef<"Photo", 'Int'>;
    readonly type: Prisma.FieldRef<"Photo", 'AssetType'>;
    readonly width: Prisma.FieldRef<"Photo", 'Int'>;
    readonly height: Prisma.FieldRef<"Photo", 'Int'>;
    readonly format: Prisma.FieldRef<"Photo", 'String'>;
    readonly originalKey: Prisma.FieldRef<"Photo", 'String'>;
    readonly thumbKey: Prisma.FieldRef<"Photo", 'String'>;
    readonly watermarkKey: Prisma.FieldRef<"Photo", 'String'>;
    readonly createdAt: Prisma.FieldRef<"Photo", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Photo", 'DateTime'>;
    readonly deletedAt: Prisma.FieldRef<"Photo", 'DateTime'>;
}
/**
 * Photo findUnique
 */
export type PhotoFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: Prisma.PhotoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Photo
     */
    omit?: Prisma.PhotoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoInclude<ExtArgs> | null;
    /**
     * Filter, which Photo to fetch.
     */
    where: Prisma.PhotoWhereUniqueInput;
};
/**
 * Photo findUniqueOrThrow
 */
export type PhotoFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: Prisma.PhotoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Photo
     */
    omit?: Prisma.PhotoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoInclude<ExtArgs> | null;
    /**
     * Filter, which Photo to fetch.
     */
    where: Prisma.PhotoWhereUniqueInput;
};
/**
 * Photo findFirst
 */
export type PhotoFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: Prisma.PhotoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Photo
     */
    omit?: Prisma.PhotoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoInclude<ExtArgs> | null;
    /**
     * Filter, which Photo to fetch.
     */
    where?: Prisma.PhotoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Photos to fetch.
     */
    orderBy?: Prisma.PhotoOrderByWithRelationInput | Prisma.PhotoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Photos.
     */
    cursor?: Prisma.PhotoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Photos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Photos.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Photos.
     */
    distinct?: Prisma.PhotoScalarFieldEnum | Prisma.PhotoScalarFieldEnum[];
};
/**
 * Photo findFirstOrThrow
 */
export type PhotoFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: Prisma.PhotoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Photo
     */
    omit?: Prisma.PhotoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoInclude<ExtArgs> | null;
    /**
     * Filter, which Photo to fetch.
     */
    where?: Prisma.PhotoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Photos to fetch.
     */
    orderBy?: Prisma.PhotoOrderByWithRelationInput | Prisma.PhotoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Photos.
     */
    cursor?: Prisma.PhotoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Photos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Photos.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Photos.
     */
    distinct?: Prisma.PhotoScalarFieldEnum | Prisma.PhotoScalarFieldEnum[];
};
/**
 * Photo findMany
 */
export type PhotoFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: Prisma.PhotoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Photo
     */
    omit?: Prisma.PhotoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoInclude<ExtArgs> | null;
    /**
     * Filter, which Photos to fetch.
     */
    where?: Prisma.PhotoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Photos to fetch.
     */
    orderBy?: Prisma.PhotoOrderByWithRelationInput | Prisma.PhotoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Photos.
     */
    cursor?: Prisma.PhotoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Photos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Photos.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Photos.
     */
    distinct?: Prisma.PhotoScalarFieldEnum | Prisma.PhotoScalarFieldEnum[];
};
/**
 * Photo create
 */
export type PhotoCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: Prisma.PhotoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Photo
     */
    omit?: Prisma.PhotoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoInclude<ExtArgs> | null;
    /**
     * The data needed to create a Photo.
     */
    data: Prisma.XOR<Prisma.PhotoCreateInput, Prisma.PhotoUncheckedCreateInput>;
};
/**
 * Photo createMany
 */
export type PhotoCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many Photos.
     */
    data: Prisma.PhotoCreateManyInput | Prisma.PhotoCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * Photo update
 */
export type PhotoUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: Prisma.PhotoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Photo
     */
    omit?: Prisma.PhotoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoInclude<ExtArgs> | null;
    /**
     * The data needed to update a Photo.
     */
    data: Prisma.XOR<Prisma.PhotoUpdateInput, Prisma.PhotoUncheckedUpdateInput>;
    /**
     * Choose, which Photo to update.
     */
    where: Prisma.PhotoWhereUniqueInput;
};
/**
 * Photo updateMany
 */
export type PhotoUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update Photos.
     */
    data: Prisma.XOR<Prisma.PhotoUpdateManyMutationInput, Prisma.PhotoUncheckedUpdateManyInput>;
    /**
     * Filter which Photos to update
     */
    where?: Prisma.PhotoWhereInput;
    /**
     * Limit how many Photos to update.
     */
    limit?: number;
};
/**
 * Photo upsert
 */
export type PhotoUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: Prisma.PhotoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Photo
     */
    omit?: Prisma.PhotoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoInclude<ExtArgs> | null;
    /**
     * The filter to search for the Photo to update in case it exists.
     */
    where: Prisma.PhotoWhereUniqueInput;
    /**
     * In case the Photo found by the `where` argument doesn't exist, create a new Photo with this data.
     */
    create: Prisma.XOR<Prisma.PhotoCreateInput, Prisma.PhotoUncheckedCreateInput>;
    /**
     * In case the Photo was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.PhotoUpdateInput, Prisma.PhotoUncheckedUpdateInput>;
};
/**
 * Photo delete
 */
export type PhotoDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: Prisma.PhotoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Photo
     */
    omit?: Prisma.PhotoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoInclude<ExtArgs> | null;
    /**
     * Filter which Photo to delete.
     */
    where: Prisma.PhotoWhereUniqueInput;
};
/**
 * Photo deleteMany
 */
export type PhotoDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Photos to delete
     */
    where?: Prisma.PhotoWhereInput;
    /**
     * Limit how many Photos to delete.
     */
    limit?: number;
};
/**
 * Photo.keywords
 */
export type Photo$keywordsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Keyword
     */
    select?: Prisma.KeywordSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Keyword
     */
    omit?: Prisma.KeywordOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.KeywordInclude<ExtArgs> | null;
    where?: Prisma.KeywordWhereInput;
    orderBy?: Prisma.KeywordOrderByWithRelationInput | Prisma.KeywordOrderByWithRelationInput[];
    cursor?: Prisma.KeywordWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.KeywordScalarFieldEnum | Prisma.KeywordScalarFieldEnum[];
};
/**
 * Photo.cartItems
 */
export type Photo$cartItemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CartItem
     */
    select?: Prisma.CartItemSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CartItem
     */
    omit?: Prisma.CartItemOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.CartItemInclude<ExtArgs> | null;
    where?: Prisma.CartItemWhereInput;
    orderBy?: Prisma.CartItemOrderByWithRelationInput | Prisma.CartItemOrderByWithRelationInput[];
    cursor?: Prisma.CartItemWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CartItemScalarFieldEnum | Prisma.CartItemScalarFieldEnum[];
};
/**
 * Photo.favorites
 */
export type Photo$favoritesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Favorite
     */
    select?: Prisma.FavoriteSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Favorite
     */
    omit?: Prisma.FavoriteOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.FavoriteInclude<ExtArgs> | null;
    where?: Prisma.FavoriteWhereInput;
    orderBy?: Prisma.FavoriteOrderByWithRelationInput | Prisma.FavoriteOrderByWithRelationInput[];
    cursor?: Prisma.FavoriteWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.FavoriteScalarFieldEnum | Prisma.FavoriteScalarFieldEnum[];
};
/**
 * Photo.orderItems
 */
export type Photo$orderItemsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OrderItem
     */
    select?: Prisma.OrderItemSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the OrderItem
     */
    omit?: Prisma.OrderItemOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.OrderItemInclude<ExtArgs> | null;
    where?: Prisma.OrderItemWhereInput;
    orderBy?: Prisma.OrderItemOrderByWithRelationInput | Prisma.OrderItemOrderByWithRelationInput[];
    cursor?: Prisma.OrderItemWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.OrderItemScalarFieldEnum | Prisma.OrderItemScalarFieldEnum[];
};
/**
 * Photo.downloads
 */
export type Photo$downloadsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Download
     */
    select?: Prisma.DownloadSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Download
     */
    omit?: Prisma.DownloadOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.DownloadInclude<ExtArgs> | null;
    where?: Prisma.DownloadWhereInput;
    orderBy?: Prisma.DownloadOrderByWithRelationInput | Prisma.DownloadOrderByWithRelationInput[];
    cursor?: Prisma.DownloadWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.DownloadScalarFieldEnum | Prisma.DownloadScalarFieldEnum[];
};
/**
 * Photo.photoKeywords
 */
export type Photo$photoKeywordsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
    where?: Prisma.PhotoKeywordWhereInput;
    orderBy?: Prisma.PhotoKeywordOrderByWithRelationInput | Prisma.PhotoKeywordOrderByWithRelationInput[];
    cursor?: Prisma.PhotoKeywordWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PhotoKeywordScalarFieldEnum | Prisma.PhotoKeywordScalarFieldEnum[];
};
/**
 * Photo without action
 */
export type PhotoDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Photo
     */
    select?: Prisma.PhotoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Photo
     */
    omit?: Prisma.PhotoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.PhotoInclude<ExtArgs> | null;
};
//# sourceMappingURL=Photo.d.ts.map