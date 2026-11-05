
import { del, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { AppError } from "../lib/api-error";

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
] as const;

type ImageType = (typeof ALLOWED_TYPES)[number];

const EXTENSIONS: Record<ImageType, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
};

export class ImageService {

    async validateImage(file: unknown): Promise<File> {
        if (!(file instanceof File)) {
            throw new AppError(
                400,
                "Image file is required"
            );
        }

        if (file.size === 0) {
            throw new AppError(
                400,
                "Image file cannot be empty"
            );
        }

        if (file.size > MAX_IMAGE_SIZE) {
            throw new AppError(
                413,
                "Image size cannot exceed 3 MB"
            );
        }

        if (
            !ALLOWED_TYPES.includes(
                file.type as ImageType
            )
        ) {
            throw new AppError(
                400,
                "Only JPG, PNG and WEBP images are allowed"
            );
        }

        const bytes = new Uint8Array(
            await file.slice(0, 12).arrayBuffer()
        );

        const isJpeg =
            bytes[0] === 0xff &&
            bytes[1] === 0xd8 &&
            bytes[2] === 0xff;

        const isPng =
            bytes.length >= 8 &&
            bytes[0] === 0x89 &&
            bytes[1] === 0x50 &&
            bytes[2] === 0x4e &&
            bytes[3] === 0x47 &&
            bytes[4] === 0x0d &&
            bytes[5] === 0x0a &&
            bytes[6] === 0x1a &&
            bytes[7] === 0x0a;

        const isWebp =
            bytes.length >= 12 &&
            String.fromCharCode(...bytes.slice(0, 4)) ===
                "RIFF" &&
            String.fromCharCode(...bytes.slice(8, 12)) ===
                "WEBP";

        const validSignature =
            (file.type === "image/jpeg" && isJpeg) ||
            (file.type === "image/png" && isPng) ||
            (file.type === "image/webp" && isWebp);

        if (!validSignature) {
            throw new AppError(
                400,
                "Invalid image file content"
            );
        }

        return file;
    }

    async uploadImage(file: unknown): Promise<string> {
        const image = await this.validateImage(file);

        const extension =
            EXTENSIONS[image.type as ImageType];

        const pathname =
            `books/${randomUUID()}.${extension}`;

        const blob = await put(pathname, image, {
            access: "public",
            addRandomSuffix: false,
            contentType: image.type
        });

        return blob.url;
    }

    async deleteImage(imageUrl: string): Promise<void> {
        if (!imageUrl) {
            return;
        }

        let url: URL;

        try {
            url = new URL(imageUrl);
        } catch {
            throw new AppError(
                400,
                "Invalid image URL"
            );
        }

        const isOurBlob =
            url.protocol === "https:" &&
            url.hostname.endsWith(
                ".public.blob.vercel-storage.com"
            ) &&
            url.pathname.startsWith("/books/") &&
            !url.username &&
            !url.password &&
            !url.search &&
            !url.hash;

        if (!isOurBlob) {
            throw new AppError(
                400,
                "Image is not managed by our storage service"
            );
        }

        await del(imageUrl);
    }
}
