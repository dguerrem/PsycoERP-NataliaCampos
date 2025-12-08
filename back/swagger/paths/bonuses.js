const bonusesPaths = {
    "/api/bonuses": {
        get: {
            tags: ["Bonuses"],
            summary: "Obtener bonuses",
            description: "Obtiene una lista de bonuses con filtros opcionales y paginación",
            parameters: [
                {
                    name: "patient_id",
                    in: "query",
                    description: "Filtrar por ID del paciente",
                    required: false,
                    schema: {
                        type: "integer",
                        format: "int64",
                    },
                },
                {
                    name: "status",
                    in: "query",
                    description: "Filtrar por estado del bono (active, consumed, expired)",
                    required: false,
                    schema: {
                        type: "string",
                        enum: ["active", "consumed", "expired"],
                    },
                },
                {
                    name: "expiration_date",
                    in: "query",
                    description: "Filtrar por fecha de expiración (YYYY-MM-DD)",
                    required: false,
                    schema: {
                        type: "string",
                        format: "date",
                    },
                },
                {
                    name: "page",
                    in: "query",
                    description: "Número de página para paginación",
                    required: false,
                    schema: {
                        type: "integer",
                        default: 1,
                    },
                },
                {
                    name: "limit",
                    in: "query",
                    description: "Número de registros por página",
                    required: false,
                    schema: {
                        type: "integer",
                        default: 10,
                    },
                },
            ],
            responses: {
                200: {
                    description: "Lista de bonuses obtenida exitosamente",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/BonusesResponse",
                            },
                        },
                    },
                },
                400: {
                    description: "Error de validación",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                        },
                    },
                },
                500: {
                    description: "Error del servidor",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                        },
                    },
                },
            },
        },
        post: {
            tags: ["Bonuses"],
            summary: "Crear un nuevo bono",
            description: "Crea un nuevo bono de sesiones para un paciente",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/CreateBonusRequest",
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: "Bono creado exitosamente",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/CreateBonusResponse",
                            },
                        },
                    },
                },
                400: {
                    description: "Error de validación",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            examples: {
                                missingFields: {
                                    summary: "Campos faltantes",
                                    value: {
                                        success: false,
                                        error: "Faltan campos obligatorios",
                                        required_fields: [
                                            "patient_id",
                                            "sessions_number",
                                            "price_per_session",
                                            "total_price"
                                        ]
                                    }
                                },
                                invalidTotal: {
                                    summary: "Precio total incorrecto",
                                    value: {
                                        success: false,
                                        error: "El precio total (500) no coincide con sessions_number * price_per_session (600)"
                                    }
                                },
                                invalidDate: {
                                    summary: "Fecha de expiración inválida",
                                    value: {
                                        success: false,
                                        error: "La fecha de expiración debe ser una fecha futura"
                                    }
                                }
                            }
                        },
                    },
                },
                404: {
                    description: "Paciente no encontrado",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                success: false,
                                error: "El paciente especificado no existe"
                            }
                        },
                    },
                },
                409: {
                    description: "El paciente ya tiene un bono activo",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                success: false,
                                error: "El paciente ya tiene un bono activo. No se pueden crear múltiples bonos activos para el mismo paciente."
                            }
                        },
                    },
                },
                500: {
                    description: "Error del servidor",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                        },
                    },
                },
            },
        },
    },
};

module.exports = bonusesPaths;
