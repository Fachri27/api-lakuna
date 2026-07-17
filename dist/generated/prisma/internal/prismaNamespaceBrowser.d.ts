import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models.js';
export type * from './prismaNamespace.js';
export declare const Decimal: any;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const DbNull: any;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: any;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: any;
export declare const ModelName: {
    readonly User: "User";
    readonly Photo: "Photo";
    readonly Keyword: "Keyword";
    readonly CartItem: "CartItem";
    readonly Favorite: "Favorite";
    readonly Order: "Order";
    readonly OrderItem: "OrderItem";
    readonly Download: "Download";
    readonly Subscription: "Subscription";
    readonly RefreshToken: "RefreshToken";
    readonly PhotoKeyword: "PhotoKeyword";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: any;
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const UserScalarFieldEnum: {
    readonly id: "id";
    readonly username: "username";
    readonly email: "email";
    readonly password: "password";
    readonly realName: "realName";
    readonly role: "role";
    readonly newsletter: "newsletter";
    readonly avatarKey: "avatarKey";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
    readonly deletedAt: "deletedAt";
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const PhotoScalarFieldEnum: {
    readonly id: "id";
    readonly title: "title";
    readonly description: "description";
    readonly photographer: "photographer";
    readonly price: "price";
    readonly type: "type";
    readonly width: "width";
    readonly height: "height";
    readonly format: "format";
    readonly originalKey: "originalKey";
    readonly thumbKey: "thumbKey";
    readonly watermarkKey: "watermarkKey";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
    readonly deletedAt: "deletedAt";
};
export type PhotoScalarFieldEnum = (typeof PhotoScalarFieldEnum)[keyof typeof PhotoScalarFieldEnum];
export declare const KeywordScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
};
export type KeywordScalarFieldEnum = (typeof KeywordScalarFieldEnum)[keyof typeof KeywordScalarFieldEnum];
export declare const CartItemScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly photoId: "photoId";
    readonly license: "license";
    readonly createdAt: "createdAt";
};
export type CartItemScalarFieldEnum = (typeof CartItemScalarFieldEnum)[keyof typeof CartItemScalarFieldEnum];
export declare const FavoriteScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly photoId: "photoId";
    readonly createdAt: "createdAt";
};
export type FavoriteScalarFieldEnum = (typeof FavoriteScalarFieldEnum)[keyof typeof FavoriteScalarFieldEnum];
export declare const OrderScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly total: "total";
    readonly status: "status";
    readonly midtransOrderId: "midtransOrderId";
    readonly midtransToken: "midtransToken";
    readonly paidAt: "paidAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type OrderScalarFieldEnum = (typeof OrderScalarFieldEnum)[keyof typeof OrderScalarFieldEnum];
export declare const OrderItemScalarFieldEnum: {
    readonly id: "id";
    readonly orderId: "orderId";
    readonly photoId: "photoId";
    readonly license: "license";
    readonly price: "price";
};
export type OrderItemScalarFieldEnum = (typeof OrderItemScalarFieldEnum)[keyof typeof OrderItemScalarFieldEnum];
export declare const DownloadScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly photoId: "photoId";
    readonly downloadedAt: "downloadedAt";
};
export type DownloadScalarFieldEnum = (typeof DownloadScalarFieldEnum)[keyof typeof DownloadScalarFieldEnum];
export declare const SubscriptionScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly quota: "quota";
    readonly used: "used";
    readonly billing: "billing";
    readonly payOption: "payOption";
    readonly price: "price";
    readonly status: "status";
    readonly startedAt: "startedAt";
    readonly expiresAt: "expiresAt";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type SubscriptionScalarFieldEnum = (typeof SubscriptionScalarFieldEnum)[keyof typeof SubscriptionScalarFieldEnum];
export declare const RefreshTokenScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly token: "token";
    readonly expiresAt: "expiresAt";
    readonly createdAt: "createdAt";
};
export type RefreshTokenScalarFieldEnum = (typeof RefreshTokenScalarFieldEnum)[keyof typeof RefreshTokenScalarFieldEnum];
export declare const PhotoKeywordScalarFieldEnum: {
    readonly id: "id";
    readonly photoId: "photoId";
    readonly keywordId: "keywordId";
};
export type PhotoKeywordScalarFieldEnum = (typeof PhotoKeywordScalarFieldEnum)[keyof typeof PhotoKeywordScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const UserOrderByRelevanceFieldEnum: {
    readonly id: "id";
    readonly username: "username";
    readonly email: "email";
    readonly password: "password";
    readonly realName: "realName";
    readonly avatarKey: "avatarKey";
};
export type UserOrderByRelevanceFieldEnum = (typeof UserOrderByRelevanceFieldEnum)[keyof typeof UserOrderByRelevanceFieldEnum];
export declare const PhotoOrderByRelevanceFieldEnum: {
    readonly id: "id";
    readonly title: "title";
    readonly description: "description";
    readonly photographer: "photographer";
    readonly format: "format";
    readonly originalKey: "originalKey";
    readonly thumbKey: "thumbKey";
    readonly watermarkKey: "watermarkKey";
};
export type PhotoOrderByRelevanceFieldEnum = (typeof PhotoOrderByRelevanceFieldEnum)[keyof typeof PhotoOrderByRelevanceFieldEnum];
export declare const KeywordOrderByRelevanceFieldEnum: {
    readonly id: "id";
    readonly name: "name";
};
export type KeywordOrderByRelevanceFieldEnum = (typeof KeywordOrderByRelevanceFieldEnum)[keyof typeof KeywordOrderByRelevanceFieldEnum];
export declare const CartItemOrderByRelevanceFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly photoId: "photoId";
    readonly license: "license";
};
export type CartItemOrderByRelevanceFieldEnum = (typeof CartItemOrderByRelevanceFieldEnum)[keyof typeof CartItemOrderByRelevanceFieldEnum];
export declare const FavoriteOrderByRelevanceFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly photoId: "photoId";
};
export type FavoriteOrderByRelevanceFieldEnum = (typeof FavoriteOrderByRelevanceFieldEnum)[keyof typeof FavoriteOrderByRelevanceFieldEnum];
export declare const OrderOrderByRelevanceFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly midtransOrderId: "midtransOrderId";
    readonly midtransToken: "midtransToken";
};
export type OrderOrderByRelevanceFieldEnum = (typeof OrderOrderByRelevanceFieldEnum)[keyof typeof OrderOrderByRelevanceFieldEnum];
export declare const OrderItemOrderByRelevanceFieldEnum: {
    readonly id: "id";
    readonly orderId: "orderId";
    readonly photoId: "photoId";
    readonly license: "license";
};
export type OrderItemOrderByRelevanceFieldEnum = (typeof OrderItemOrderByRelevanceFieldEnum)[keyof typeof OrderItemOrderByRelevanceFieldEnum];
export declare const DownloadOrderByRelevanceFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly photoId: "photoId";
};
export type DownloadOrderByRelevanceFieldEnum = (typeof DownloadOrderByRelevanceFieldEnum)[keyof typeof DownloadOrderByRelevanceFieldEnum];
export declare const SubscriptionOrderByRelevanceFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly billing: "billing";
    readonly payOption: "payOption";
};
export type SubscriptionOrderByRelevanceFieldEnum = (typeof SubscriptionOrderByRelevanceFieldEnum)[keyof typeof SubscriptionOrderByRelevanceFieldEnum];
export declare const RefreshTokenOrderByRelevanceFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly token: "token";
};
export type RefreshTokenOrderByRelevanceFieldEnum = (typeof RefreshTokenOrderByRelevanceFieldEnum)[keyof typeof RefreshTokenOrderByRelevanceFieldEnum];
export declare const PhotoKeywordOrderByRelevanceFieldEnum: {
    readonly id: "id";
    readonly photoId: "photoId";
    readonly keywordId: "keywordId";
};
export type PhotoKeywordOrderByRelevanceFieldEnum = (typeof PhotoKeywordOrderByRelevanceFieldEnum)[keyof typeof PhotoKeywordOrderByRelevanceFieldEnum];
//# sourceMappingURL=prismaNamespaceBrowser.d.ts.map