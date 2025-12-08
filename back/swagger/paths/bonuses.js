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
                    description: "Lista de bonuses obtenida exitosamente (incluye historial de usos de cada bono)",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/BonusesResponse",
                            },
                            example: {
                                success: true,
                                pagination: {
                                    currentPage: 1,
                                    totalPages: 2,
                                    totalRecords: 15,
                                    recordsPerPage: 10,
                                    hasNextPage: true,
                                    hasPrevPage: false,
                                    nextPage: 2,
                                    prevPage: null,
                                },
                                data: [
                                    {
                                        id: 1,
                                        patient_id: 5,
                                        patient_name: "Juan Pérez García",
                                        sessions_number: 10,
                                        price_per_session: 50.00,
                                        total_price: 500.00,
                                        remaining_sessions: 7,
                                        used_sessions: 3,
                                        status: "active",
                                        expiration_date: "2025-12-31",
                                        created_at: "2025-01-15",
                                        updated_at: "2025-01-20",
                                        usage_history: [
                                            {
                                                usage_date: "2025-01-20",
                                                session_status: "completed"
                                            },
                                            {
                                                usage_date: "2025-01-18",
                                                session_status: "completed"
                                            },
                                            {
                                                usage_date: "2025-01-16",
                                                session_status: "completed"
                                            }
                                        ]
                                    }
                                ]
                            }
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
    "/api/bonuses/redeem": {
        post: {
            tags: ["Bonuses"],
            summary: "Redimir un uso del bono",
            description: "Asigna un bono activo a una sesión, actualizando el payment_method a 'bono' y decrementando el contador de sesiones disponibles del bono",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/RedeemBonusRequest",
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "Uso del bono redimido exitosamente",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/RedeemBonusResponse",
                            },
                            example: {
                                success: true,
                                message: "Uso del bono redimido exitosamente",
                                data: {
                                    id: 1,
                                    patient_id: 5,
                                    patient_name: "Juan Pérez García",
                                    sessions_number: 10,
                                    price_per_session: 50.00,
                                    total_price: 500.00,
                                    remaining_sessions: 6,
                                    used_sessions: 4,
                                    status: "active",
                                    expiration_date: "2025-12-31",
                                    created_at: "2025-01-15",
                                    updated_at: "2025-01-20"
                                }
                            }
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
                                        error: "Los campos patient_id y session_id son obligatorios"
                                    }
                                },
                                invalidType: {
                                    summary: "Tipo de dato inválido",
                                    value: {
                                        success: false,
                                        error: "Los campos patient_id y session_id deben ser números válidos"
                                    }
                                }
                            }
                        },
                    },
                },
                404: {
                    description: "Paciente sin bono activo o sesión no encontrada",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            examples: {
                                noActiveBonus: {
                                    summary: "Sin bono activo",
                                    value: {
                                        success: false,
                                        error: "El paciente no tiene un bono activo disponible"
                                    }
                                },
                                sessionNotFound: {
                                    summary: "Sesión no encontrada",
                                    value: {
                                        success: false,
                                        error: "La sesión especificada no existe o no está activa"
                                    }
                                }
                            }
                        },
                    },
                },
                409: {
                    description: "Conflicto al actualizar el bono",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                success: false,
                                error: "No se pudo redimir el uso del bono. Es posible que ya no tenga sesiones disponibles"
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
