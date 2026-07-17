import * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "./prismaNamespace.js";
export type LogOptions<ClientOptions extends Prisma.PrismaClientOptions> = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never;
export interface PrismaClientConstructor {
    /**
   * ## Prisma Client
   *
   * Type-safe database client for TypeScript
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */
    new <Options extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions, LogOpts extends LogOptions<Options> = LogOptions<Options>, OmitOpts extends Prisma.PrismaClientOptions['omit'] = Options extends {
        omit: infer U;
    } ? U : Prisma.PrismaClientOptions['omit'], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs>(options: Prisma.Subset<Options, Prisma.PrismaClientOptions>): PrismaClient<LogOpts, OmitOpts, ExtArgs>;
}
/**
 * ## Prisma Client
 *
 * Type-safe database client for TypeScript
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export interface PrismaClient<in LogOpts extends Prisma.LogLevel = never, in out OmitOpts extends Prisma.PrismaClientOptions['omit'] = undefined, in out ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['other'];
    };
    $on<V extends LogOpts>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;
    /**
     * Connect with the database
     */
    $connect(): runtime.Types.Utils.JsPromise<void>;
    /**
     * Disconnect from the database
     */
    $disconnect(): runtime.Types.Utils.JsPromise<void>;
    /**
       * Executes a prepared raw query and returns the number of affected rows.
       * @example
       * ```
       * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
       * ```
       *
       * Read more in our [docs](https://pris.ly/d/raw-queries).
       */
    $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;
    /**
     * Executes a raw query and returns the number of affected rows.
     * Susceptible to SQL injections, see documentation.
     * @example
     * ```
     * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
     * ```
     *
     * Read more in our [docs](https://pris.ly/d/raw-queries).
     */
    $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;
    /**
     * Performs a prepared raw query and returns the `SELECT` data.
     * @example
     * ```
     * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
     * ```
     *
     * Read more in our [docs](https://pris.ly/d/raw-queries).
     */
    $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;
    /**
     * Performs a raw query and returns the `SELECT` data.
     * Susceptible to SQL injections, see documentation.
     * @example
     * ```
     * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
     * ```
     *
     * Read more in our [docs](https://pris.ly/d/raw-queries).
     */
    $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;
    /**
     * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
     * @example
     * ```
     * const [george, bob, alice] = await prisma.$transaction([
     *   prisma.user.create({ data: { name: 'George' } }),
     *   prisma.user.create({ data: { name: 'Bob' } }),
     *   prisma.user.create({ data: { name: 'Alice' } }),
     * ])
     * ```
     *
     * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
     */
    $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;
    $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => runtime.Types.Utils.JsPromise<R>, options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<R>;
    $extends: runtime.Types.Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<OmitOpts>, ExtArgs, runtime.Types.Utils.Call<Prisma.TypeMapCb<OmitOpts>, {
        extArgs: ExtArgs;
    }>>;
    /**
 * `prisma.user`: Exposes CRUD operations for the **User** model.
  * Example usage:
  * ```ts
  * // Fetch zero or more Users
  * const users = await prisma.user.findMany()
  * ```
  */
    get user(): Prisma.UserDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.photo`: Exposes CRUD operations for the **Photo** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Photos
      * const photos = await prisma.photo.findMany()
      * ```
      */
    get photo(): Prisma.PhotoDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.keyword`: Exposes CRUD operations for the **Keyword** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Keywords
      * const keywords = await prisma.keyword.findMany()
      * ```
      */
    get keyword(): Prisma.KeywordDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.cartItem`: Exposes CRUD operations for the **CartItem** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more CartItems
      * const cartItems = await prisma.cartItem.findMany()
      * ```
      */
    get cartItem(): Prisma.CartItemDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.favorite`: Exposes CRUD operations for the **Favorite** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Favorites
      * const favorites = await prisma.favorite.findMany()
      * ```
      */
    get favorite(): Prisma.FavoriteDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.order`: Exposes CRUD operations for the **Order** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Orders
      * const orders = await prisma.order.findMany()
      * ```
      */
    get order(): Prisma.OrderDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.orderItem`: Exposes CRUD operations for the **OrderItem** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more OrderItems
      * const orderItems = await prisma.orderItem.findMany()
      * ```
      */
    get orderItem(): Prisma.OrderItemDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.download`: Exposes CRUD operations for the **Download** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Downloads
      * const downloads = await prisma.download.findMany()
      * ```
      */
    get download(): Prisma.DownloadDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.subscription`: Exposes CRUD operations for the **Subscription** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Subscriptions
      * const subscriptions = await prisma.subscription.findMany()
      * ```
      */
    get subscription(): Prisma.SubscriptionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.refreshToken`: Exposes CRUD operations for the **RefreshToken** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more RefreshTokens
      * const refreshTokens = await prisma.refreshToken.findMany()
      * ```
      */
    get refreshToken(): Prisma.RefreshTokenDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.photoKeyword`: Exposes CRUD operations for the **PhotoKeyword** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more PhotoKeywords
      * const photoKeywords = await prisma.photoKeyword.findMany()
      * ```
      */
    get photoKeyword(): Prisma.PhotoKeywordDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
}
export declare function getPrismaClientClass(): PrismaClientConstructor;
//# sourceMappingURL=class.d.ts.map