const definitions = {
  // ========== CLINIC SCHEMAS ==========

  Clinic: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        description: "ID único de la clínica",
        example: 1
      },
      name: {
        type: "string",
        description: "Nombre de la clínica",
        example: "Clínica Centro"
      },
      address: {
        type: "string",
        nullable: true,
        description: "Dirección física de la clínica",
        example: "Calle Principal 123"
      },
      clinic_color: {
        type: "string",
        description: "Color distintivo de la clínica en formato hex",
        example: "#3B82F6"
      },
      price: {
        type: "number",
        format: "decimal",
        nullable: true,
        description: "Precio por sesión de la clínica",
        example: 60.00
      },
      percentage: {
        type: "number",
        format: "decimal",
        nullable: true,
        minimum: 0,
        maximum: 100,
        description: "Porcentaje de comisión de la clínica",
        example: 15.5
      },
      is_billable: {
        type: "boolean",
        description: "Indica si la clínica puede facturar",
        example: true
      },
      billing_address: {
        type: "string",
        nullable: true,
        description: "Dirección de facturación (solo para clínicas facturables)",
        example: "Avenida Comercial 456"
      },
      cif: {
        type: "string",
        nullable: true,
        description: "CIF de la clínica (solo para clínicas facturables)",
        example: "B12345678"
      },
      fiscal_name: {
        type: "string",
        nullable: true,
        description: "Nombre fiscal de la clínica (solo para clínicas facturables)",
        example: "Clínica Centro S.L."
      },
      created_at: {
        type: "string",
        format: "date",
        description: "Fecha de creación de la clínica",
        example: "2024-01-15"
      },
      updated_at: {
        type: "string",
        format: "date",
        description: "Fecha de última actualización de la clínica",
        example: "2024-01-20"
      }
    },
    required: ["id", "name", "clinic_color", "is_billable", "created_at", "updated_at"]
  },

  ClinicsResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        description: "Indica si la operación fue exitosa",
        example: true
      },
      pagination: {
        $ref: "#/components/schemas/PaginationInfo"
      },
      data: {
        type: "array",
        items: {
          $ref: "#/components/schemas/Clinic"
        },
        description: "Lista de clínicas activas"
      }
    },
    required: ["success", "pagination", "data"]
  },

  CreateClinicRequest: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Nombre de la clínica (requerido)",
        minLength: 1,
        example: "Nueva Clínica"
      },
      clinic_color: {
        type: "string",
        description: "Color distintivo de la clínica en formato hex (requerido)",
        pattern: "^#[0-9A-Fa-f]{6}$",
        example: "#FF5733"
      },
      address: {
        type: "string",
        nullable: true,
        description: "Dirección física de la clínica (opcional)",
        example: "Calle Nueva 789"
      },
      price: {
        type: "number",
        format: "decimal",
        nullable: true,
        minimum: 0,
        description: "Precio por sesión de la clínica (opcional)",
        example: 50.00
      },
      percentage: {
        type: "number",
        format: "decimal",
        nullable: true,
        minimum: 0,
        maximum: 100,
        description: "Porcentaje de comisión de la clínica (opcional)",
        example: 20.0
      },
      is_billable: {
        type: "boolean",
        description: "Indica si la clínica puede facturar (opcional, por defecto false)",
        example: false
      },
      billing_address: {
        type: "string",
        nullable: true,
        description: "Dirección de facturación (solo para clínicas facturables)",
        example: "Calle Fiscal 321"
      },
      cif: {
        type: "string",
        nullable: true,
        description: "CIF de la clínica (solo para clínicas facturables)",
        example: "B87654321"
      },
      fiscal_name: {
        type: "string",
        nullable: true,
        description: "Nombre fiscal de la clínica (solo para clínicas facturables)",
        example: "Nueva Clínica S.L."
      }
    },
    required: ["name", "clinic_color"]
  },

  CreateClinicResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        description: "Indica si la operación fue exitosa",
        example: true
      },
      message: {
        type: "string",
        description: "Mensaje de confirmación",
        example: "Clínica creada exitosamente"
      },
      data: {
        $ref: "#/components/schemas/Clinic",
        description: "Datos de la clínica creada"
      }
    },
    required: ["success", "message", "data"]
  },

  UpdateClinicRequest: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Nombre de la clínica",
        minLength: 1,
        example: "Clínica Actualizada"
      },
      clinic_color: {
        type: "string",
        description: "Color distintivo de la clínica en formato hex",
        pattern: "^#[0-9A-Fa-f]{6}$",
        example: "#28A745"
      },
      address: {
        type: "string",
        nullable: true,
        description: "Dirección física de la clínica",
        example: "Nueva Dirección 456"
      },
      price: {
        type: "number",
        format: "decimal",
        nullable: true,
        minimum: 0,
        description: "Precio por sesión de la clínica",
        example: 65.00
      },
      percentage: {
        type: "number",
        format: "decimal",
        nullable: true,
        minimum: 0,
        maximum: 100,
        description: "Porcentaje de comisión de la clínica",
        example: 18.0
      },
      is_billable: {
        type: "boolean",
        description: "Indica si la clínica puede facturar (no se puede cambiar a false si hay facturas asociadas)",
        example: true
      },
      billing_address: {
        type: "string",
        nullable: true,
        description: "Dirección de facturación (solo para clínicas facturables)",
        example: "Nueva Dirección Fiscal 654"
      },
      cif: {
        type: "string",
        nullable: true,
        description: "CIF de la clínica (solo para clínicas facturables)",
        example: "B11223344"
      },
      fiscal_name: {
        type: "string",
        nullable: true,
        description: "Nombre fiscal de la clínica (solo para clínicas facturables)",
        example: "Clínica Actualizada S.L."
      }
    },
    description: "Todos los campos son opcionales. Al menos uno debe ser proporcionado."
  },

  // ========== GENERIC RESPONSE SCHEMAS ==========

  ErrorResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        description: "Indica si la operación fue exitosa",
        example: false
      },
      error: {
        type: "string",
        description: "Mensaje de error descriptivo",
        example: "Error al procesar la solicitud"
      }
    },
    required: ["success", "error"]
  },

  PaginationInfo: {
    type: "object",
    properties: {
      currentPage: {
        type: "integer",
        description: "Página actual",
        example: 1
      },
      totalPages: {
        type: "integer",
        description: "Total de páginas disponibles",
        example: 5
      },
      totalRecords: {
        type: "integer",
        description: "Total de registros en la base de datos",
        example: 47
      },
      recordsPerPage: {
        type: "integer",
        description: "Cantidad de registros por página",
        example: 10
      },
      hasNextPage: {
        type: "boolean",
        description: "Indica si hay una página siguiente",
        example: true
      },
      hasPrevPage: {
        type: "boolean",
        description: "Indica si hay una página anterior",
        example: false
      },
      nextPage: {
        type: "integer",
        nullable: true,
        description: "Número de la página siguiente (null si no existe)",
        example: 2
      },
      prevPage: {
        type: "integer",
        nullable: true,
        description: "Número de la página anterior (null si no existe)",
        example: null
      }
    },
    required: ["currentPage", "totalPages", "totalRecords", "recordsPerPage", "hasNextPage", "hasPrevPage", "nextPage", "prevPage"]
  },

  SuccessResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        description: "Indica si la operación fue exitosa",
        example: true
      },
      message: {
        type: "string",
        description: "Mensaje de confirmación",
        example: "Operación completada exitosamente"
      }
    },
    required: ["success", "message"]
  }
};

module.exports = definitions;