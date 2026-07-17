import { prisma } from "../../config/db.js";
// GET /categories
export async function getCategoriesService(query) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const where = query.search
        ? {
            name: {
                contains: query.search,
            },
        }
        : {};
    const [categories, total] = await Promise.all([
        prisma.category.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                name: "asc",
            },
        }),
        prisma.category.count({ where }),
    ]);
    return {
        data: categories,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
// GET /categories/:id
export async function getCategoryByIdService(id) {
    const category = await prisma.category.findUnique({
        where: { id },
        include: {
            photoCategories: {
                include: {
                    photo: {
                        select: {
                            id: true,
                            title: true,
                            thumbKey: true,
                        },
                    },
                },
            },
        },
    });
    return category;
}
// POST /categories
export async function createCategoryService(data) {
    const category = await prisma.category.create({
        data: {
            name: data.name.trim(),
            description: data.description?.trim() || null,
        },
    });
    return category;
}
// PATCH /categories/:id
export async function updateCategoryService(id, data) {
    const category = await prisma.category.update({
        where: { id },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.description !== undefined && {
                description: data.description || null,
            }),
        },
    });
    return category;
}
// DELETE /categories/:id
export async function deleteCategoryService(id) {
    await prisma.category.delete({
        where: { id },
    });
}
//# sourceMappingURL=category.service.js.map