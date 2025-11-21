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

// Actualizar llamada existente
const updateCall = async (db, callId, callData) => {
    const fields = [];
    const values = [];

    if (callData.call_first_name !== undefined) {
        fields.push("call_first_name = ?");
        values.push(callData.call_first_name);
    }
    if (callData.call_last_name !== undefined) {
        fields.push("call_last_name = ?");
        values.push(callData.call_last_name);
    }
    if (callData.call_phone !== undefined) {
        fields.push("call_phone = ?");
        values.push(callData.call_phone);
    }
    if (callData.session_date !== undefined) {
        fields.push("session_date = ?");
        values.push(callData.session_date);
    }
    if (callData.start_time !== undefined) {
        fields.push("start_time = ?");
        values.push(callData.start_time);
    }
    if (callData.end_time !== undefined) {
        fields.push("end_time = ?");
        values.push(callData.end_time);
    }
    if (callData.is_billable_call !== undefined) {
        fields.push("is_billable_call = ?");
        values.push(callData.is_billable_call ? 1 : 0);
    }
    if (callData.call_dni !== undefined) {
        fields.push("call_dni = ?");
        values.push(callData.call_dni);
    }
    if (callData.call_billing_address !== undefined) {
        fields.push("call_billing_address = ?");
        values.push(callData.call_billing_address);
    }
    if (callData.price !== undefined) {
        fields.push("price = ?");
        values.push(callData.price);
    }
    if (callData.payment_method !== undefined) {
        fields.push("payment_method = ?");
        values.push(callData.payment_method);
    }
    if (callData.notes !== undefined) {
        fields.push("notes = ?");
        values.push(callData.notes);
    }

    if (fields.length === 0) {
        throw new Error("No hay campos para actualizar");
    }

    fields.push("updated_at = NOW()");
    values.push(callId);

    const query = `
        UPDATE sessions 
        SET ${fields.join(", ")} 
        WHERE id = ? AND is_active = true AND is_call = 1
    `;

    const [result] = await db.execute(query, values);

    if (result.affectedRows === 0) {
        return null;
    }

    // Retornar la llamada actualizada
    const [updatedCall] = await db.execute(
        "SELECT * FROM sessions WHERE id = ? AND is_active = true AND is_call = 1",
        [callId]
    );

    return updatedCall[0];
};

module.exports = {
    createCall,
    updateCall,
};
