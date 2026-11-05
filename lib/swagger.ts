
import { createSwaggerSpec } from "next-swagger-doc";

export function getApiDocs() {
    return createSwaggerSpec({
        apiFolder: "app/api",
        autoDoc: true,

        definition: {
            openapi: "3.0.0",

            info: {
                title: "Library System API",
                version: "1.0.0",
                description: "Library System Backend API"
            },

            components: {
                schemas: {

                    // =========================
                    // AUTHOR SCHEMAS
                    // =========================

                    CreateAuthor: {
                        type: "object",
                        required: ["name"],
                        additionalProperties: false,
                        properties: {
                            name: {
                                type: "string",
                                minLength: 1,
                                maxLength: 255
                            }
                        }
                    },

                    Author: {
                        type: "object",
                        properties: {
                            id: {
                                type: "integer"
                            },
                            name: {
                                type: "string"
                            },
                            createdAt: {
                                type: "string",
                                format: "date-time"
                            },
                            createdBy: {
                                type: "string",
                                nullable: true
                            },
                            updatedAt: {
                                type: "string",
                                format: "date-time",
                                nullable: true
                            },
                            updatedBy: {
                                type: "string",
                                nullable: true
                            },
                            isDeleted: {
                                type: "boolean"
                            }
                        }
                    },

                    // =========================
                    // CATEGORY SCHEMAS
                    // =========================

                    CreateCategory: {
                        type: "object",
                        required: ["name"],
                        additionalProperties: false,
                        properties: {
                            name: {
                                type: "string",
                                minLength: 1,
                                maxLength: 255
                            }
                        }
                    },

                    Category: {
                        type: "object",
                        properties: {
                            id: {
                                type: "integer"
                            },
                            name: {
                                type: "string"
                            },
                            createdAt: {
                                type: "string",
                                format: "date-time"
                            },
                            createdBy: {
                                type: "string",
                                nullable: true
                            },
                            updatedAt: {
                                type: "string",
                                format: "date-time",
                                nullable: true
                            },
                            updatedBy: {
                                type: "string",
                                nullable: true
                            },
                            isDeleted: {
                                type: "boolean"
                            }
                        }
                    },

                    // =========================
                    // BOOK SCHEMAS
                    // =========================

                    UpdateBook: {
                        type: "object",

                        required: [
                            "title",
                            "publicationYear",
                            "authorId",
                            "categoryId"
                        ],

                        additionalProperties: false,

                        properties: {
                            title: {
                                type: "string",
                                minLength: 1,
                                maxLength: 255
                            },

                            publicationYear: {
                                type: "integer",
                                minimum: 1,
                            },

                            authorId: {
                                type: "integer",
                                minimum: 1
                            },

                            categoryId: {
                                type: "integer",
                                minimum: 1
                            }
                        }
                    },

                    Book: {
                        type: "object",

                        properties: {
                            id: {
                                type: "integer"
                            },

                            title: {
                                type: "string"
                            },

                            publicationYear: {
                                type: "integer"
                            },

                            imageUrl: {
                                type: "string",
                                format: "uri"
                            },

                            authorId: {
                                type: "integer"
                            },

                            authorName: {
                                type: "string"
                            },

                            categoryId: {
                                type: "integer"
                            },

                            categoryName: {
                                type: "string"
                            },

                            createdAt: {
                                type: "string",
                                format: "date-time"
                            },

                            createdBy: {
                                type: "string",
                                nullable: true
                            },

                            updatedAt: {
                                type: "string",
                                format: "date-time",
                                nullable: true
                            },

                            updatedBy: {
                                type: "string",
                                nullable: true
                            },

                            isDeleted: {
                                type: "boolean"
                            }
                        }
                    }
                },

                // =========================
                // AUTHENTICATION
                // =========================

                securitySchemes: {
                    BearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT"
                    }
                }
            }
        }
    });
}
