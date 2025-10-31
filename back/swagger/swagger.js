const swaggerUi = require("swagger-ui-express");

const definitions = require("./definitions");
const clinicsPaths = require("./paths/clinics");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "API de Psicología",
    version: "1.0.0",
    description: "API REST para la gestión de sesiones de psicología",
    contact: {
      name: "Desarrollo",
      email: "dev@psicologia.com",
    },
  },
  servers:
    process.env.NODE_ENV === "production"
      ? [
        {
          url: "https://test.nclpsicologa.com",
          description: "Test Environment (TEST)",
        },
        {
          url: "https://nclpsicologa.com",
          description: "Production Environment (PROD)",
        },
      ]
      : [
        {
          url: "http://localhost:3000",
          description: "Local Development",
        },
      ],
  components: {
    schemas: definitions,
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token obtenido del endpoint de login",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    ...clinicsPaths,
  },
  tags: [
    {
      name: "Clinics",
      description: "Gestión de clínicas",
    }
  ],
};

// Configuración de Swagger UI
const swaggerOptions = {
  explorer: true,
  customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #3b82f6; }
    `,
  customSiteTitle: "API Psicología - Documentación",
  swaggerOptions: {
    filter: true,
    showRequestHeaders: true,
  },
};

module.exports = {
  swaggerUi,
  swaggerDefinition,
  swaggerOptions,
};
