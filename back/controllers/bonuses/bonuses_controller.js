const { getBonuses } = require("../../models/bonuses/bonuses_model");
const logger = require("../../utils/logger");

const obtenerBonuses = async (req, res) => {
  try {
    const {
      patient_id,
      status,
      expiration_date,
      page,
      limit,
    } = req.query;

    // Validar parámetros de paginación
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    // Validaciones de límites
    if (pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: "El número de página debe ser mayor a 0",
      });
    }

    if (limitNum < 1) {
      return res.status(400).json({
        success: false,
        error: "El límite debe ser mayor a 0",
      });
    }

    // Validar patient_id si se proporciona
    if (patient_id && isNaN(patient_id)) {
      return res.status(400).json({
        success: false,
        error: "El patient_id debe ser un número válido",
      });
    }

    // Validar status si se proporciona
    if (status && !['active', 'consumed', 'expired'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "El status debe ser: active, consumed o expired",
      });
    }

    // Construir filtros incluyendo paginación
    const filters = {};
    if (patient_id) filters.patient_id = patient_id;
    if (status) filters.status = status;
    if (expiration_date) filters.expiration_date = expiration_date;

    // Parámetros de paginación
    filters.page = pageNum;
    filters.limit = limitNum;

    const result = await getBonuses(req.db, filters);

    res.json({
      success: true,
      pagination: result.pagination,
      data: result.data,
    });
  } catch (err) {
    logger.error("Error al obtener bonuses:", err.message);
    res.status(500).json({
      success: false,
      error: "Error al obtener los bonuses",
    });
  }
};

module.exports = {
  obtenerBonuses,
};
