const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection, dbMiddleware } = require("./config/db");
const {
  swaggerUi,
  swaggerDefinition,
  swaggerOptions,
} = require("./swagger/swagger");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 3000;

const clinicsRoutes = require("./routes/clinics/clinics_routes");

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Aumentar límite para archivos grandes
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Middleware para inyectar el pool de BD correcto según hostname
app.use(dbMiddleware);

// 🔧 SWAGGER UI - Documentación
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDefinition, swaggerOptions)
);

// Ruta de bienvenida
app.get("/", (req, res) => {
  res.json({
    message: "🚀 API de Psicología funcionando correctamente",
    version: "1.0.0",
    endpoints: {
      clinics: "/api/clinics",
    },
  });
});

// Rutas protegidas (requieren autenticación)
app.use("/api/clinics", clinicsRoutes);

// Iniciar servidor
app.listen(PORT, async () => {
  logger.success(`Servidor corriendo en http://localhost:${PORT}`);

  // Probar conexión a la base de datos
  await testConnection();
});
