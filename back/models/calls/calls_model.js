// Crear nueva llamada (call)
const createCall = async (db, callData) => {
    const {
        call_first_name,
        call_last_name,
        call_phone,
        session_date,
        start_time,
        end_time,
        is_billable_call,
        call_dni,
        call_billing_address,
        price,
        payment_method,
        notes,
        clinic_id,
    } = callData;

    const query = `
    INSERT INTO sessions (
      patient_id,
      clinic_id,
      session_date,
      start_time,
      end_time,
      mode,
      status,
      price,
      payment_method,
      notes,
      is_call,
      is_billable_call,
      call_first_name,
      call_last_name,
      call_phone,
      call_dni,
      call_billing_address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const params = [
        null, // patient_id siempre NULL para llamadas
        clinic_id,
        session_date,
        start_time,
        end_time,
        null, // mode NULL para llamadas
        'completada', // status NULL para llamadas
        price || 0, // Si no viene precio, por defecto 0
        payment_method,
        notes,
        1, // is_call siempre 1
        is_billable_call ? 1 : 0,
        call_first_name,
        call_last_name,
        call_phone,
        is_billable_call ? call_dni : null,
        is_billable_call ? call_billing_address : null,
    ];

    const [result] = await db.execute(query, params);

    // Retornar la llamada creada con su ID
    const [newCall] = await db.execute(
        "SELECT * FROM sessions WHERE id = ?",
        [result.insertId]
    );

    return newCall[0];
};

module.exports = {
    createCall,
};
