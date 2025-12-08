// Obtener todos los bonuses con filtros opcionales y paginación
const getBonuses = async (db, filters = {}) => {
    // Extraer parámetros de paginación
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    // Query base para contar registros totales
    let countQuery = `
    SELECT COUNT(*) as total
    FROM bonuses
    WHERE is_active = true
  `;

    // Query principal para obtener datos
    let dataQuery = `
    SELECT
      b.id,
      b.patient_id,
      b.sessions_number,
      b.price_per_session,
      b.total_price,
      b.remaining_sessions,
      DATE_FORMAT(b.expiration_date, '%Y-%m-%d') as expiration_date,
      DATE_FORMAT(b.created_at, '%Y-%m-%d') as created_at,
      DATE_FORMAT(b.updated_at, '%Y-%m-%d') as updated_at,
      CONCAT(p.first_name, ' ', p.last_name) as patient_name
    FROM bonuses b
    LEFT JOIN patients p ON b.patient_id = p.id
    WHERE b.is_active = true
  `;

    const params = [];
    const conditions = [];

    // Aplicar filtros
    if (filters.patient_id) {
        conditions.push("b.patient_id = ?");
        params.push(filters.patient_id);
    }

    if (filters.expiration_date) {
        conditions.push("b.expiration_date = ?");
        params.push(filters.expiration_date);
    }

    // Filtrar por estado del bono (calculado)
    if (filters.status) {
        if (filters.status === 'active') {
            conditions.push("b.remaining_sessions > 0");
            conditions.push("(b.expiration_date IS NULL OR b.expiration_date >= CURDATE())");
        } else if (filters.status === 'consumed') {
            conditions.push("b.remaining_sessions = 0");
        } else if (filters.status === 'expired') {
            conditions.push("b.expiration_date < CURDATE()");
            conditions.push("b.remaining_sessions > 0");
        }
    }

    // Aplicar condiciones adicionales a ambas queries
    if (conditions.length > 0) {
        const conditionsStr = " AND " + conditions.join(" AND ");
        countQuery += conditionsStr;
        dataQuery += conditionsStr;
    }

    // Agregar ordenamiento y paginación solo a la query de datos
    dataQuery += " ORDER BY b.created_at DESC";
    dataQuery += " LIMIT ? OFFSET ?";

    // Ejecutar ambas queries
    const [countResult] = await db.execute(countQuery, params);
    const totalRecords = countResult[0].total;

    const [rows] = await db.execute(dataQuery, [...params, limit, offset]);

    // Obtener el historial de uso para cada bono
    const bonusIds = rows.map(row => row.id);
    let usageHistory = [];

    if (bonusIds.length > 0) {
        const placeholders = bonusIds.map(() => '?').join(',');
        const usageQuery = `
            SELECT
                s.bonus_id,
                DATE_FORMAT(s.session_date, '%Y-%m-%d') as usage_date,
                s.status as session_status
            FROM sessions s
            WHERE s.bonus_id IN (${placeholders})
              AND s.is_active = true
            ORDER BY s.session_date DESC
        `;

        const [usageRows] = await db.execute(usageQuery, bonusIds);
        usageHistory = usageRows;
    }

    // Transformar datos y calcular estado
    const transformedData = rows.map((row) => {
        let status = 'active';

        if (row.remaining_sessions === 0) {
            status = 'consumed';
        } else if (row.expiration_date && new Date(row.expiration_date) < new Date()) {
            status = 'expired';
        }

        // Filtrar el historial de uso para este bono específico
        const bonusUsageData = usageHistory
            .filter(usage => usage.bonus_id === row.id)
            .map(usage => ({
                usage_date: usage.usage_date,
                session_status: usage.session_status
            }));

        return {
            id: row.id,
            patient_id: row.patient_id,
            patient_name: row.patient_name,
            sessions_number: row.sessions_number,
            price_per_session: parseFloat(row.price_per_session),
            total_price: parseFloat(row.total_price),
            remaining_sessions: row.remaining_sessions,
            used_sessions: row.sessions_number - row.remaining_sessions,
            status: status,
            expiration_date: row.expiration_date,
            created_at: row.created_at,
            updated_at: row.updated_at,
            usage_history: bonusUsageData,
        };
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(totalRecords / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        data: transformedData,
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalRecords: totalRecords,
            recordsPerPage: limit,
            hasNextPage: hasNextPage,
            hasPrevPage: hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null,
        },
    };
};

// Crear nuevo bonus
const createBonus = async (db, bonusData) => {
    const {
        patient_id,
        sessions_number,
        price_per_session,
        total_price,
        remaining_sessions,
        expiration_date,
    } = bonusData;

    const query = `
    INSERT INTO bonuses (
      patient_id,
      sessions_number,
      price_per_session,
      total_price,
      remaining_sessions,
      expiration_date
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

    const params = [
        patient_id,
        sessions_number,
        price_per_session,
        total_price,
        remaining_sessions,
        expiration_date,
    ];

    const [result] = await db.execute(query, params);

    // Obtener el bonus recién creado
    const getBonusQuery = `
    SELECT
      b.id,
      b.patient_id,
      b.sessions_number,
      b.price_per_session,
      b.total_price,
      b.remaining_sessions,
      DATE_FORMAT(b.expiration_date, '%Y-%m-%d') as expiration_date,
      DATE_FORMAT(b.created_at, '%Y-%m-%d') as created_at,
      DATE_FORMAT(b.updated_at, '%Y-%m-%d') as updated_at,
      CONCAT(p.first_name, ' ', p.last_name) as patient_name
    FROM bonuses b
    LEFT JOIN patients p ON b.patient_id = p.id AND p.is_active = true
    WHERE b.id = ?
  `;

    const [bonusRows] = await db.execute(getBonusQuery, [result.insertId]);
    const bonus = bonusRows[0];

    return {
        id: bonus.id,
        patient_id: bonus.patient_id,
        patient_name: bonus.patient_name,
        sessions_number: bonus.sessions_number,
        price_per_session: parseFloat(bonus.price_per_session),
        total_price: parseFloat(bonus.total_price),
        remaining_sessions: bonus.remaining_sessions,
        used_sessions: 0,
        status: 'active',
        expiration_date: bonus.expiration_date,
        created_at: bonus.created_at,
        updated_at: bonus.updated_at,
    };
};

// Verificar si un paciente tiene un bono activo
const hasActiveBonus = async (db, patient_id) => {
    const query = `
    SELECT id
    FROM bonuses
    WHERE patient_id = ?
      AND is_active = true
      AND remaining_sessions > 0
      AND (expiration_date IS NULL OR expiration_date > CURDATE())
    LIMIT 1
  `;

    const [rows] = await db.execute(query, [patient_id]);
    return rows.length > 0;
};

// Obtener el bono activo disponible de un paciente
const getActiveBonus = async (db, patient_id) => {
    const query = `
    SELECT
      b.id,
      b.patient_id,
      b.sessions_number,
      b.price_per_session,
      b.total_price,
      b.remaining_sessions,
      DATE_FORMAT(b.expiration_date, '%Y-%m-%d') as expiration_date,
      DATE_FORMAT(b.created_at, '%Y-%m-%d') as created_at,
      DATE_FORMAT(b.updated_at, '%Y-%m-%d') as updated_at,
      CONCAT(p.first_name, ' ', p.last_name) as patient_name
    FROM bonuses b
    LEFT JOIN patients p ON b.patient_id = p.id AND p.is_active = true
    WHERE b.patient_id = ?
      AND b.is_active = true
      AND b.remaining_sessions > 0
      AND (b.expiration_date IS NULL OR b.expiration_date > CURDATE())
    ORDER BY b.created_at ASC
    LIMIT 1
  `;

    const [rows] = await db.execute(query, [patient_id]);

    if (rows.length === 0) {
        return null;
    }

    const bonus = rows[0];
    return {
        id: bonus.id,
        patient_id: bonus.patient_id,
        patient_name: bonus.patient_name,
        sessions_number: bonus.sessions_number,
        price_per_session: parseFloat(bonus.price_per_session),
        total_price: parseFloat(bonus.total_price),
        remaining_sessions: bonus.remaining_sessions,
        used_sessions: bonus.sessions_number - bonus.remaining_sessions,
        expiration_date: bonus.expiration_date,
        created_at: bonus.created_at,
        updated_at: bonus.updated_at,
    };
};

// Redimir un uso del bono (actualizar sesión y decrementar remaining_sessions)
const redeemBonusUsage = async (db, session_id, bonus_id) => {
    // Iniciar transacción
    await db.query('START TRANSACTION');

    try {
        // 1. Actualizar la sesión con el bonus_id y payment_method
        const updateSessionQuery = `
            UPDATE sessions
            SET bonus_id = ?,
                payment_method = 'bono'
            WHERE id = ?
              AND is_active = true
        `;

        const [sessionResult] = await db.execute(updateSessionQuery, [bonus_id, session_id]);

        if (sessionResult.affectedRows === 0) {
            throw new Error('SESSION_NOT_FOUND');
        }

        // 2. Decrementar remaining_sessions del bono
        const updateBonusQuery = `
            UPDATE bonuses
            SET remaining_sessions = remaining_sessions - 1
            WHERE id = ?
              AND is_active = true
              AND remaining_sessions > 0
        `;

        const [bonusResult] = await db.execute(updateBonusQuery, [bonus_id]);

        if (bonusResult.affectedRows === 0) {
            throw new Error('BONUS_UPDATE_FAILED');
        }

        // Confirmar transacción
        await db.query('COMMIT');

        // 3. Obtener datos actualizados del bono
        const getBonusQuery = `
            SELECT
                b.id,
                b.patient_id,
                b.sessions_number,
                b.price_per_session,
                b.total_price,
                b.remaining_sessions,
                DATE_FORMAT(b.expiration_date, '%Y-%m-%d') as expiration_date,
                DATE_FORMAT(b.created_at, '%Y-%m-%d') as created_at,
                DATE_FORMAT(b.updated_at, '%Y-%m-%d') as updated_at,
                CONCAT(p.first_name, ' ', p.last_name) as patient_name
            FROM bonuses b
            LEFT JOIN patients p ON b.patient_id = p.id AND p.is_active = true
            WHERE b.id = ?
        `;

        const [bonusRows] = await db.execute(getBonusQuery, [bonus_id]);
        const bonus = bonusRows[0];

        return {
            id: bonus.id,
            patient_id: bonus.patient_id,
            patient_name: bonus.patient_name,
            sessions_number: bonus.sessions_number,
            price_per_session: parseFloat(bonus.price_per_session),
            total_price: parseFloat(bonus.total_price),
            remaining_sessions: bonus.remaining_sessions,
            used_sessions: bonus.sessions_number - bonus.remaining_sessions,
            status: bonus.remaining_sessions === 0 ? 'consumed' : 'active',
            expiration_date: bonus.expiration_date,
            created_at: bonus.created_at,
            updated_at: bonus.updated_at,
        };

    } catch (error) {
        // Revertir transacción en caso de error
        await db.query('ROLLBACK');
        throw error;
    }
};

module.exports = {
    getBonuses,
    createBonus,
    hasActiveBonus,
    getActiveBonus,
    redeemBonusUsage,
};
