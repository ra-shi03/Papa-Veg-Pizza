export const buildPaginationOptions = (query) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

/** User text used inside a RegExp: matched literally, so it cannot change the pattern (or hang it). */
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildPaginatedResult =({ docs, total, page, limit }) => {
    const totalPages = Math.ceil(total / limit) || 1;

    return {
        data: docs,
        meta: {
            total,
            page,
            limit,
            totalPages
        }
    };
};

