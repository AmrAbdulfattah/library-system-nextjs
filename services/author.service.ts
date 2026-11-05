import {
    AuthorRepository
} from "../DAL/repositories/author.repository";

import type {
    CreateAuthorData,
    UpdateAuthorData
} from "../DAL/repositories/author.repository";

import {
    AppError,
    isUniqueViolation
} from "../lib/api-error";

export class AuthorService {
    constructor(
        private readonly authorRepository: AuthorRepository
    ) {}

    async getAll(pageNumber = 1, pageSize = 10) {
        return this.authorRepository.getAll(
            pageNumber,
            pageSize
        );
    }

    async getById(id: number) {
        const author = await this.authorRepository.getById(id);

        if (!author) {
            throw new AppError(404, "Author not found");
        }

        return author;
    }

async add(data: CreateAuthorData) {
    const name = data.name.trim();

    if (!name || name.length > 255) {
        throw new AppError(
            400,
            "Author name must be between 1 and 255 characters"
        );
    }

    const exists = await this.authorRepository.existsByName(name);

    if (exists) {
        throw new AppError(
            409,
            "Author already exists"
        );
    }

    try {
        const author = await this.authorRepository.add({
            name,
            createdBy: data.createdBy ?? null
        });

        if (!author) {
            throw new AppError(
                409,
                "Author already exists"
            );
        }

        return author;
    } catch (error) {
        if (isUniqueViolation(error)) {
            throw new AppError(
                409,
                "Author already exists"
            );
        }

        throw error;
    }
}

    async update(id: number, data: UpdateAuthorData) {
        const name = data.name.trim();

        if (!name || name.length > 255) {
            throw new AppError(400, "Invalid author name");
        }

        await this.getById(id);

        const exists = await this.authorRepository.existsByName(
            name,
            id
        );

        if (exists) {
            throw new AppError(409, "Author already exists");
        }

        try {
            const author = await this.authorRepository.update(
                id,
                {
                    name,
                    updatedBy: data.updatedBy ?? null
                }
            );

            if (!author) {
                throw new AppError(404, "Author not found");
            }

            return author;
        } catch (error) {
            if (isUniqueViolation(error)) {
                throw new AppError(409, "Author already exists");
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
            await this.authorRepository.hasActiveBooks(id);

        if (hasBooks) {
            throw new AppError(
                409,
                "Cannot delete an author with active books"
            );
        }

        const author = await this.authorRepository.softDelete(
            id,
            updatedBy
        );

        if (!author) {
            throw new AppError(404, "Author not found");
        }

        return author;
    }
}