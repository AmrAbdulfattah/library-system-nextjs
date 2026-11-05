
import {
    CategoryRepository,
    CreateCategoryData,
    UpdateCategoryData
} from "../DAL/repositories/category.repository";

import {
    AppError,
    isUniqueViolation
} from "../lib/api-error";

export class CategoryService {
    constructor(
        private readonly categoryRepository: CategoryRepository
    ) {}

    async getAll(
        pageNumber: number = 1,
        pageSize: number = 10
    ) {
        return await this.categoryRepository.getAll(
            pageNumber,
            pageSize
        );
    }

    async getById(id: number) {
        const category =
            await this.categoryRepository.getById(id);

        if (!category) {
            throw new AppError(
                404,
                "Category not found"
            );
        }

        return category;
    }

    async add(data: CreateCategoryData) {
        const name = data.name.trim();

        if (!name || name.length > 255) {
            throw new AppError(
                400,
                "Category name must be between 1 and 255 characters"
            );
        }

        const exists =
            await this.categoryRepository.existsByName(name);

        if (exists) {
            throw new AppError(
                409,
                "Category already exists"
            );
        }

        try {
            const category = await this.categoryRepository.add({
                name,
                createdBy: data.createdBy ?? null
            });

            if (!category) {
                throw new AppError(
                    409,
                    "Category already exists"
                );
            }

            return category;
        } catch (error) {
            if (isUniqueViolation(error)) {
                throw new AppError(
                    409,
                    "Category already exists"
                );
            }

            throw error;
        }
    }

    async update(
        id: number,
        data: UpdateCategoryData
    ) {
        const name = data.name.trim();

        if (!name || name.length > 255) {
            throw new AppError(
                400,
                "Category name must be between 1 and 255 characters"
            );
        }

        await this.getById(id);

        const exists =
            await this.categoryRepository.existsByName(
                name,
                id
            );

        if (exists) {
            throw new AppError(
                409,
                "Category already exists"
            );
        }

        try {
            const category =
                await this.categoryRepository.update(
                    id,
                    {
                        name,
                        updatedBy: data.updatedBy ?? null
                    }
                );

            if (!category) {
                throw new AppError(
                    404,
                    "Category not found"
                );
            }

            return category;
        } catch (error) {
            if (isUniqueViolation(error)) {
                throw new AppError(
                    409,
                    "Category already exists"
                );
            }

            throw error;
        }
    }

    async softDelete(
        id: number,
        updatedBy: string | null = null
    ) {
        await this.getById(id);

        const hasBooks =
            await this.categoryRepository.hasActiveBooks(id);

        if (hasBooks) {
            throw new AppError(
                409,
                "Cannot delete category because it has active books"
            );
        }

        const category =
            await this.categoryRepository.softDelete(
                id,
                updatedBy
            );

        if (!category) {
            throw new AppError(
                404,
                "Category not found"
            );
        }
    }
}
