const { getBonuses, createBonus, hasActiveBonus, getActiveBonus, redeemBonusUsage, updateBonusExpirationDate } = require("../../models/bonuses/bonuses_model");
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

const crearBonus = async (req, res) => {
    try {
        const {
            patient_id,
            sessions_number,
            price_per_session,
            total_price,
            expiration_date,
        } = req.body;

        // Validar campos obligatorios
        if (
            !patient_id ||
            !sessions_number ||
            !price_per_session ||
            !total_price
        ) {
            return res.status(400).json({
                success: false,
                error: "Faltan campos obligatorios",
                required_fields: [
                    "patient_id",
                    "sessions_number",
                    "price_per_session",
                    "total_price",
                ],
            });
        }

        // Validar que patient_id sea un número válido
        if (isNaN(patient_id)) {
            return res.status(400).json({
                success: false,
                error: "El patient_id debe ser un número válido",
            });
        }

        // Validar que sessions_number sea un número positivo
        if (isNaN(sessions_number) || sessions_number <= 0) {
            return res.status(400).json({
                success: false,
                error: "El número de sesiones debe ser un número positivo",
            });
        }

        // Validar que price_per_session sea un número positivo
        if (isNaN(price_per_session) || price_per_session <= 0) {
            return res.status(400).json({
                success: false,
                error: "El precio por sesión debe ser un número positivo",
            });
        }

        // Validar que total_price sea un número positivo
        if (isNaN(total_price) || total_price <= 0) {
            return res.status(400).json({
                success: false,
                error: "El precio total debe ser un número positivo",
            });
        }

        // Validar que el total_price sea coherente con sessions_number * price_per_session
        const expectedTotal = sessions_number * price_per_session;
        const difference = Math.abs(expectedTotal - total_price);
        if (difference > 0.01) {
            return res.status(400).json({
                success: false,
                error: `El precio total (${total_price}) no coincide con sessions_number * price_per_session (${expectedTotal})`,
            });
        }

        // Validar formato de fecha de expiración si se proporciona
        if (expiration_date) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(expiration_date)) {
                return res.status(400).json({
                    success: false,
                    error: "El formato de expiration_date debe ser YYYY-MM-DD",
                });
            }

            // Validar que la fecha de expiración sea futura
            const expirationDateObj = new Date(expiration_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (expirationDateObj < today) {
                return res.status(400).json({
                    success: false,
                    error: "La fecha de expiración debe ser una fecha futura",
                });
            }
        }

        // Verificar que el paciente no tenga ya un bono activo
        const tieneBonoActivo = await hasActiveBonus(req.db, patient_id);
        if (tieneBonoActivo) {
            return res.status(409).json({
                success: false,
                error: "El paciente ya tiene un bono activo. No se pueden crear múltiples bonos activos para el mismo paciente.",
            });
        }

        const bonusData = {
            patient_id,
            sessions_number,
            price_per_session,
            total_price,
            remaining_sessions: sessions_number, // Al crear, remaining = total
            expiration_date: expiration_date || null,
        };

        const nuevoBonus = await createBonus(req.db, bonusData);

        res.status(201).json({
            success: true,
            message: "Bono creado exitosamente",
            data: nuevoBonus,
        });
    } catch (err) {
        logger.error("Error al crear bonus:", err.message);

        // Manejo de errores específicos de base de datos
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({
                success: false,
                error: "El paciente especificado no existe",
            });
        }

        res.status(500).json({
            success: false,
            error: "Error al crear el bono",
        });
    }
};

const redimirBono = async (req, res) => {
    try {
        const { patient_id, session_id } = req.body;

        // Validar campos obligatorios
        if (!patient_id || !session_id) {
            return res.status(400).json({
                success: false,
                error: "Los campos patient_id y session_id son obligatorios",
            });
        }

        // Validar que sean números
        if (isNaN(patient_id) || isNaN(session_id)) {
            return res.status(400).json({
                success: false,
                error: "Los campos patient_id y session_id deben ser números válidos",
            });
        }

        // Validar que sean números positivos
        if (patient_id <= 0 || session_id <= 0) {
            return res.status(400).json({
                success: false,
                error: "Los campos patient_id y session_id deben ser números positivos",
            });
        }

        // Obtener el bono activo del paciente
        const activeBonus = await getActiveBonus(req.db, patient_id);

        if (!activeBonus) {
            return res.status(404).json({
                success: false,
                error: "El paciente no tiene un bono activo disponible",
            });
        }

        // Redimir el uso del bono
        const bonusActualizado = await redeemBonusUsage(req.db, session_id, activeBonus.id);

        res.status(200).json({
            success: true,
            message: "Uso del bono redimido exitosamente",
            data: bonusActualizado,
        });

    } catch (err) {
        logger.error("Error al redimir uso del bono:", err.message);

        // Manejo de errores específicos
        if (err.message === 'SESSION_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                error: "La sesión especificada no existe o no está activa",
            });
        }

        if (err.message === 'BONUS_UPDATE_FAILED') {
            return res.status(409).json({
                success: false,
                error: "No se pudo redimir el uso del bono. Es posible que ya no tenga sesiones disponibles",
            });
        }

        res.status(500).json({
            success: false,
            error: "Error al redimir el uso del bono",
        });
    }
};

const actualizarBonus = async (req, res) => {
    try {
        const { id } = req.params;
        const { expiration_date } = req.body;

        // Validar que el ID sea un número válido
        if (isNaN(id) || parseInt(id) <= 0) {
            return res.status(400).json({
                success: false,
                error: "El ID del bono debe ser un número válido",
            });
        }

        // Validar que expiration_date sea obligatorio
        if (!expiration_date) {
            return res.status(400).json({
                success: false,
                error: "El campo expiration_date es obligatorio",
            });
        }

        // Validar formato de fecha YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(expiration_date)) {
            return res.status(400).json({
                success: false,
                error: "El formato de expiration_date debe ser YYYY-MM-DD",
            });
        }

        // Validar que la fecha sea válida
        const expirationDateObj = new Date(expiration_date);
        if (isNaN(expirationDateObj.getTime())) {
            return res.status(400).json({
                success: false,
                error: "La fecha de expiración no es válida",
            });
        }

        // Actualizar la fecha de expiración
        const bonusActualizado = await updateBonusExpirationDate(req.db, parseInt(id), expiration_date);

        if (!bonusActualizado) {
            return res.status(404).json({
                success: false,
                error: "Bono no encontrado o no activo",
            });
        }

        res.status(200).json({
            success: true,
            message: "Fecha de expiración actualizada exitosamente",
            data: bonusActualizado,
        });

    } catch (err) {
        logger.error("Error al actualizar bono:", err.message);
        res.status(500).json({
            success: false,
            error: "Error al actualizar el bono",
        });
    }
};

module.exports = {
    obtenerBonuses,
    crearBonus,
    redimirBono,
    actualizarBonus,
};
