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
};

module.exports = callsPaths;
