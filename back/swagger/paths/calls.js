const callsPaths = {
    "/api/calls": {
        post: {
            tags: ["Calls"],
            summary: "Registrar nueva llamada",
            description: "Registra una nueva llamada telefónica en el sistema. La llamada puede ser facturable o no facturable. Si es facturable, se requieren datos adicionales (DNI, dirección y precio).",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/CreateCallRequest",
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: "Llamada registrada exitosamente",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/CreateCallResponse",
                            },
                        },
                    },
                },
                400: {
                    description: "Datos inválidos o incompletos",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            examples: {
                                missing_required: {
                                    summary: "Faltan campos obligatorios",
                                    value: {
                                        success: false,
                                        error: "Datos incompletos",
                                        message: "Nombre, apellidos y teléfono son obligatorios",
                                    },
                                },
                                missing_billable_data: {
                                    summary: "Faltan datos para llamada facturable",
                                    value: {
                                        success: false,
                                        error: "Datos incompletos para llamada facturable",
                                        message: "Para llamadas facturables son obligatorios: DNI, dirección de facturación y precio",
                                    },
                                },
                                no_principal_clinic: {
                                    summary: "Clínica principal no configurada",
                                    value: {
                                        success: false,
                                        error: "Clínica principal no configurada",
                                        message: "El usuario no tiene una clínica principal configurada. No se puede crear la llamada.",
                                    },
                                },
                            },
                        },
                    },
                },
                404: {
                    description: "Usuario no encontrado",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                success: false,
                                error: "Usuario no encontrado",
                                message: "No se pudo obtener información del usuario autenticado",
                            },
                        },
                    },
                },
                500: {
                    description: "Error interno del servidor",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                success: false,
                                error: "Error al registrar la llamada",
                                message: "Ha ocurrido un error interno del servidor",
                            },
                        },
                    },
                },
            },
        },
    },
    "/api/calls/{id}": {
        put: {
            tags: ["Calls"],
            summary: "Actualizar llamada existente",
            description: "Actualiza la información de una llamada telefónica. Todos los campos son opcionales, solo se actualizarán los campos enviados. Si se cambia is_billable_call a true, son obligatorios DNI, dirección y precio.",
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    description: "ID único de la llamada",
                    schema: {
                        type: "integer",
                        format: "int64",
                        example: 123,
                    },
                },
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/UpdateCallRequest",
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "Llamada actualizada exitosamente",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/UpdateCallResponse",
                            },
                        },
                    },
                },
                400: {
                    description: "Datos inválidos o incompletos",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            examples: {
                                invalid_id: {
                                    summary: "ID inválido",
                                    value: {
                                        success: false,
                                        error: "ID inválido",
                                        message: "Debe proporcionar un ID de llamada válido",
                                    },
                                },
                                empty_body: {
                                    summary: "Cuerpo vacío",
                                    value: {
                                        success: false,
                                        error: "Debe proporcionar al menos un campo para actualizar",
                                        message: "El cuerpo de la petición no puede estar vacío",
                                    },
                                },
                                missing_billable_data: {
                                    summary: "Faltan datos para llamada facturable",
                                    value: {
                                        success: false,
                                        error: "Datos incompletos para llamada facturable",
                                        message: "Para llamadas facturables son obligatorios: DNI, dirección de facturación y precio",
                                    },
                                },
                            },
                        },
                    },
                },
                404: {
                    description: "Llamada no encontrada",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                success: false,
                                error: "Llamada no encontrada",
                                message: "La llamada especificada no existe o no está activa",
                            },
                        },
                    },
                },
                409: {
                    description: "Conflicto de horario",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                success: false,
                                error: "Conflicto de horario",
                                message: "Ya existe una sesión/llamada en este horario (10:00:00 - 11:00:00)",
                                conflicting_session: {
                                    id: 45,
                                    patient_name: "Juan Pérez",
                                    start_time: "10:00:00",
                                    end_time: "11:00:00",
                                },
                            },
                        },
                    },
                },
                500: {
                    description: "Error interno del servidor",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                success: false,
                                error: "Error al actualizar la llamada",
                                message: "Ha ocurrido un error interno del servidor",
                            },
                        },
                    },
                },
            },
        },
        delete: {
            tags: ["Calls"],
            summary: "Eliminar llamada",
            description: "Elimina una llamada del sistema mediante soft delete (marca is_active = false). La llamada no se elimina físicamente de la base de datos.",
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    description: "ID único de la llamada",
                    schema: {
                        type: "integer",
                        format: "int64",
                        example: 123,
                    },
                },
            ],
            responses: {
                200: {
                    description: "Llamada eliminada exitosamente",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/DeleteCallResponse",
                            },
                        },
                    },
                },
                400: {
                    description: "ID inválido",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                success: false,
                                error: "ID inválido",
                                message: "Debe proporcionar un ID de llamada válido",
                            },
                        },
                    },
                },
                404: {
                    description: "Llamada no encontrada",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                success: false,
                                error: "Llamada no encontrada",
                                message: "La llamada especificada no existe o ya está eliminada",
                            },
                        },
                    },
                },
                500: {
                    description: "Error interno del servidor",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/ErrorResponse",
                            },
                            example: {
                                success: false,
                                error: "Error al eliminar la llamada",
                                message: "Ha ocurrido un error interno del servidor",
                            },
                        },
                    },
                },
            },
        },
    },
};

module.exports = callsPaths;
