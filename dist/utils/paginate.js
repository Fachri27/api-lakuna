export function getPagination(query) {
    const page = Math.max(1, parseInt(query.page || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(query.limit || "20"))); // Max 100 items per page
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
//# sourceMappingURL=paginate.js.map