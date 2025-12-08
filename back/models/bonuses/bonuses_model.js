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
    LEFT JOIN patients p ON b.patient_id = p.id AND p.is_active = true
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

  // Transformar datos y calcular estado
  const transformedData = rows.map((row) => {
    let status = 'active';
    
    if (row.remaining_sessions === 0) {
      status = 'consumed';
    } else if (row.expiration_date && new Date(row.expiration_date) < new Date()) {
      status = 'expired';
    }

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

module.exports = {
  getBonuses,
};
