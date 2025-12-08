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
  },
};

module.exports = bonusesPaths;
