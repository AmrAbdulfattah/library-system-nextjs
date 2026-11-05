
import {
    BookRepository,
    type BookFilters,
    type UpdateBookData
} from "../DAL/repositories/book.repository";
import { isUniqueViolation } from "../lib/api-error";
import { AuthorRepository } from "../DAL/repositories/author.repository";
import { CategoryRepository } from "../DAL/repositories/category.repository";

import { ImageService } from "./image.service";
import { AppError } from "../lib/api-error";

type CreateBookData = {
    title: string;
    publicationYear: number;
    authorId: number;
    categoryId: number;
    createdBy?: string | null;
};

export class BookService {
    constructor(
        private readonly bookRepository: BookRepository,
        private readonly authorRepository: AuthorRepository,
        private readonly categoryRepository: CategoryRepository,
        private readonly imageService: ImageService
    ) {}

    // Get All with Pagination and Filtering
    async getAll(filters: BookFilters) {
        return await this.bookRepository.getAll(filters);
    }

    // Get Book By ID
    async getById(id: number) {
        const book = await this.bookRepository.getById(id);

        if (!book) {
            throw new AppError(404, "Book not found");
        }

        return book;
    }

    // Validate Author and Category
    private async validateRelations(
        authorId: number,
        categoryId: number
    ) {
        const [author, category] = await Promise.all([
            this.authorRepository.getById(authorId),
            this.categoryRepository.getById(categoryId)
        ]);

        if (!author) {
            throw new AppError(404, "Author not found");
        }

        if (!category) {
            throw new AppError(404, "Category not found");
        }
    }

    // Validate Book Data
    private validateBookData(data: {
        title: string;
        publicationYear: number;
        authorId: number;
        categoryId: number;
    }) {
        const title = data.title.trim();

        if (!title || title.length > 255) {
            throw new AppError(
                400,
                "Book title must be between 1 and 255 characters"
            );
        }

        if (
            !Number.isInteger(data.publicationYear) ||
            data.publicationYear < 1 ||
            data.publicationYear > new Date().getFullYear()
        ) {
            throw new AppError(
                400,
                "Invalid publication year"
            );
        }

        if (
            !Number.isSafeInteger(data.authorId) ||
            data.authorId <= 0
        ) {
            throw new AppError(400, "Invalid author ID");
        }

        if (
            !Number.isSafeInteger(data.categoryId) ||
            data.categoryId <= 0
        ) {
            throw new AppError(400, "Invalid category ID");
        }

        return title;
    }

    // Check PostgreSQL Foreign Key Violation
    private isForeignKeyViolation(error: unknown): boolean {
        let current: unknown = error;

        for (let i = 0; i < 10; i++) {
            if (
                current === null ||
                typeof current !== "object"
            ) {
                return false;
            }

            if (
                "code" in current &&
                current.code === "23503"
            ) {
                return true;
            }

            current = "cause" in current
                ? current.cause
                : null;
        }

        return false;
    }

   async add(data: CreateBookData, image: File) {
    const title = this.validateBookData(data);

    // Check duplicate title before uploading the image
    const titleExists =
        await this.bookRepository.existsByTitle(title);

    if (titleExists) {
        throw new AppError(
            409,
            "Book title already exists"
        );
    }

    // Validate author and category
    await this.validateRelations(
        data.authorId,
        data.categoryId
    );

    // Validate and upload image
    await this.imageService.validateImage(image);

    const imageUrl =
        await this.imageService.uploadImage(image);

    try {
        const book = await this.bookRepository.add({
            title,
            publicationYear: data.publicationYear,
            authorId: data.authorId,
            categoryId: data.categoryId,
            imageUrl,
            createdBy: data.createdBy ?? null
        });

        return book;

    } catch (error) {

        // Clean up uploaded image if database insert fails
        try {
            await this.imageService.deleteImage(imageUrl);
        } catch {
            console.error(
                "Failed to clean up uploaded image"
            );
        }

        if (isUniqueViolation(error)) {
            throw new AppError(
                409,
                "Book title already exists"
            );
        }

        if (this.isForeignKeyViolation(error)) {
            throw new AppError(
                409,
                "Author or category reference is no longer valid"
            );
        }

        throw error;
    }
}

    async update(id: number, data: UpdateBookData) {
    const title = this.validateBookData(data);

    await this.getById(id);

    // Check duplicate title, excluding current book
    const titleExists =
        await this.bookRepository.existsByTitle(
            title,
            id
        );

    if (titleExists) {
        throw new AppError(
            409,
            "Book title already exists"
        );
    }

    await this.validateRelations(
        data.authorId,
        data.categoryId
    );

    try {
        const book = await this.bookRepository.update(
            id,
            {
                title,
                publicationYear: data.publicationYear,
                authorId: data.authorId,
                categoryId: data.categoryId,
                updatedBy: data.updatedBy ?? null
            }
        );

        if (!book) {
            throw new AppError(
                404,
                "Book not found"
            );
        }

        return book;

    } catch (error) {

        if (isUniqueViolation(error)) {
            throw new AppError(
                409,
                "Book title already exists"
            );
        }

        if (this.isForeignKeyViolation(error)) {
            throw new AppError(
                409,
                "Author or category reference is no longer valid"
            );
        }

        throw error;
    }
}

    // Replace Existing Book Image
    async replaceImage(
        id: number,
        image: File,
        updatedBy: string | null = null
    ) {
        const existingBook = await this.getById(id);

        await this.imageService.validateImage(image);

        const newImageUrl =
            await this.imageService.uploadImage(image);

        let updatedBook;

        try {
            updatedBook = await this.bookRepository.updateImage(
                id,
                newImageUrl,
                existingBook.imageUrl,
                updatedBy
            );

            if (!updatedBook) {
                throw new AppError(
                    409,
                    "Book was modified or deleted. Please try again"
                );
            }
        } catch (error) {
            try {
                await this.imageService.deleteImage(newImageUrl);
            } catch {
                console.error(
                    "Failed to clean up new image"
                );
            }

            throw error;
        }

        // Delete old image only AFTER database update succeeds
        try {
            await this.imageService.deleteImage(
                existingBook.imageUrl
            );
        } catch {
            console.error(
                "Book image updated, but old image cleanup failed"
            );
        }

        return updatedBook;
    }

    // Soft Delete Book
    async softDelete(
        id: number,
        updatedBy: string | null = null
    ) {
        await this.getById(id);

        const book = await this.bookRepository.softDelete(
            id,
            updatedBy
        );

        if (!book) {
            throw new AppError(404, "Book not found");
        }
    }
}
