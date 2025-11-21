const { createCall, updateCall } = require("../../models/calls/calls_model");
const { getUserById } = require("../../models/users/users_model");
const { checkTimeOverlap } = require("../../models/sessions/sessions_model");

const crearLlamada = async (req, res) => {
    try {
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
        } = req.body;

        // Validaciones obligatorias
        if (!call_first_name || !call_last_name || !call_phone) {
            return res.status(400).json({
                success: false,
                error: "Datos incompletos",
                message: "Nombre, apellidos y teléfono son obligatorios",
            });
        }

        if (!session_date || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                error: "Datos incompletos",
                message: "Fecha, hora de inicio y hora de fin son obligatorias",
            });
        }

        // Validar si es llamada facturable
        if (is_billable_call) {
            if (!call_dni || !call_billing_address || price === undefined || price === null) {
                return res.status(400).json({
                    success: false,
                    error: "Datos incompletos para llamada facturable",
                    message: "Para llamadas facturables son obligatorios: DNI, dirección de facturación y precio",
                });
            }

            if (!payment_method) {
                return res.status(400).json({
                    success: false,
                    error: "Datos incompletos para llamada facturable",
                    message: "El método de pago es obligatorio para llamadas facturables",
                });
            }
        }

        // Obtener el usuario autenticado para verificar su principal_clinic_id
        const userId = req.user.id;
        const user = await getUserById(req.db, userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "Usuario no encontrado",
                message: "No se pudo obtener información del usuario autenticado",
            });
        }

        // Validar que el usuario tenga una clínica principal válida
        if (!user.principal_clinic_id || user.principal_clinic_id === 0) {
            return res.status(400).json({
                success: false,
                error: "Clínica principal no configurada",
                message: "El usuario no tiene una clínica principal configurada. No se puede crear la llamada.",
            });
        }

        // Verificar solapamiento de horarios
        const overlap = await checkTimeOverlap(req.db, session_date, start_time, end_time);
        if (overlap) {
            return res.status(409).json({
                success: false,
                error: "Conflicto de horario",
                message: `Ya existe una sesión/llamada en este horario (${overlap.start_time} - ${overlap.end_time})`,
                conflicting_session: {
                    id: overlap.id,
                    patient_name: overlap.patient_name || "Llamada",
                    start_time: overlap.start_time,
                    end_time: overlap.end_time,
                },
            });
        }

        // Preparar datos para la llamada
        const callData = {
            call_first_name,
            call_last_name,
            call_phone,
            session_date,
            start_time,
            end_time,
            is_billable_call: is_billable_call || false,
            call_dni: is_billable_call ? call_dni : null,
            call_billing_address: is_billable_call ? call_billing_address : null,
            price: is_billable_call && price ? price : 0,
            payment_method: payment_method || null,
            notes: notes || null,
            clinic_id: user.principal_clinic_id,
        };

        // Crear la llamada
        const newCall = await createCall(req.db, callData);

        res.status(201).json({
            success: true,
            message: "Llamada registrada exitosamente",
            data: {
                call_id: newCall.id,
                call_first_name: newCall.call_first_name,
                call_last_name: newCall.call_last_name,
                call_phone: newCall.call_phone,
                session_date: newCall.session_date,
                start_time: newCall.start_time,
                end_time: newCall.end_time,
                is_billable_call: newCall.is_billable_call === 1,
                price: newCall.price,
                payment_method: newCall.payment_method,
                notes: newCall.notes,
                clinic_id: newCall.clinic_id,
            },
        });
    } catch (err) {
        console.error("Error al crear llamada:", err.message);
        res.status(500).json({
            success: false,
            error: "Error al registrar la llamada",
            message: "Ha ocurrido un error interno del servidor",
        });
    }
};

const actualizarLlamada = async (req, res) => {
    try {
        const { id } = req.params;
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
        } = req.body;

        // Validar que se proporcione el ID y sea un número válido
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                error: "ID inválido",
                message: "Debe proporcionar un ID de llamada válido",
            });
        }

        // Construir objeto de actualización solo con campos definidos
        const updateData = {};
        if (call_first_name !== undefined) updateData.call_first_name = call_first_name;
        if (call_last_name !== undefined) updateData.call_last_name = call_last_name;
        if (call_phone !== undefined) updateData.call_phone = call_phone;
        if (session_date !== undefined) updateData.session_date = session_date;
        if (start_time !== undefined) updateData.start_time = start_time;
        if (end_time !== undefined) updateData.end_time = end_time;
        if (is_billable_call !== undefined) updateData.is_billable_call = is_billable_call;
        if (notes !== undefined) updateData.notes = notes;

        // Validar que se envíe al menos un campo
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: "Debe proporcionar al menos un campo para actualizar",
                message: "El cuerpo de la petición no puede estar vacío",
            });
        }

        // Validar datos según si es facturable o no
        if (is_billable_call !== undefined) {
            if (is_billable_call) {
                // Si se marca como facturable, validar campos obligatorios
                if (call_dni === undefined || call_billing_address === undefined || price === undefined || price === null) {
                    return res.status(400).json({
                        success: false,
                        error: "Datos incompletos para llamada facturable",
                        message: "Para llamadas facturables son obligatorios: DNI, dirección de facturación y precio",
                    });
                }
                if (!payment_method) {
                    return res.status(400).json({
                        success: false,
                        error: "Datos incompletos para llamada facturable",
                        message: "El método de pago es obligatorio para llamadas facturables",
                    });
                }
                updateData.call_dni = call_dni;
                updateData.call_billing_address = call_billing_address;
                updateData.price = price;
                updateData.payment_method = payment_method;
            } else {
                // Si se marca como no facturable, limpiar campos de facturación
                updateData.call_dni = null;
                updateData.call_billing_address = null;
                updateData.price = 0;
                updateData.payment_method = payment_method || null;
            }
        } else {
            // Si no se cambia is_billable_call, permitir actualizar campos individuales
            if (call_dni !== undefined) updateData.call_dni = call_dni;
            if (call_billing_address !== undefined) updateData.call_billing_address = call_billing_address;
            if (price !== undefined) updateData.price = price;
            if (payment_method !== undefined) updateData.payment_method = payment_method;
        }

        // Verificar solapamiento de horarios si se actualizan fecha/hora
        if (session_date !== undefined || start_time !== undefined || end_time !== undefined) {
            // Obtener datos actuales de la llamada para completar los que no se actualizan
            const [currentCall] = await req.db.execute(
                "SELECT session_date, start_time, end_time FROM sessions WHERE id = ? AND is_active = true AND is_call = 1",
                [id]
            );

            if (currentCall.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Llamada no encontrada",
                    message: "La llamada especificada no existe o no está activa",
                });
            }

            const checkDate = session_date !== undefined ? session_date : currentCall[0].session_date;
            const checkStartTime = start_time !== undefined ? start_time : currentCall[0].start_time;
            const checkEndTime = end_time !== undefined ? end_time : currentCall[0].end_time;

            const overlap = await checkTimeOverlap(req.db, checkDate, checkStartTime, checkEndTime, parseInt(id));
            if (overlap) {
                return res.status(409).json({
                    success: false,
                    error: "Conflicto de horario",
                    message: `Ya existe una sesión/llamada en este horario (${overlap.start_time} - ${overlap.end_time})`,
                    conflicting_session: {
                        id: overlap.id,
                        patient_name: overlap.patient_name || "Llamada",
                        start_time: overlap.start_time,
                        end_time: overlap.end_time,
                    },
                });
            }
        }

        // Actualizar la llamada
        const updatedCall = await updateCall(req.db, parseInt(id), updateData);

        if (!updatedCall) {
            return res.status(404).json({
                success: false,
                error: "Llamada no encontrada",
                message: "La llamada especificada no existe o no está activa",
            });
        }

        res.json({
            success: true,
            message: "Llamada actualizada exitosamente",
            data: {
                call_id: updatedCall.id,
                call_first_name: updatedCall.call_first_name,
                call_last_name: updatedCall.call_last_name,
                call_phone: updatedCall.call_phone,
                session_date: updatedCall.session_date,
                start_time: updatedCall.start_time,
                end_time: updatedCall.end_time,
                is_billable_call: updatedCall.is_billable_call === 1,
                price: updatedCall.price,
                payment_method: updatedCall.payment_method,
                notes: updatedCall.notes,
                clinic_id: updatedCall.clinic_id,
            },
        });
    } catch (err) {
        console.error("Error al actualizar llamada:", err.message);

        if (err.message === "No hay campos para actualizar") {
            return res.status(400).json({
                success: false,
                error: "No hay campos para actualizar",
                message: "Debe proporcionar al menos un campo válido para actualizar",
            });
        }

        res.status(500).json({
            success: false,
            error: "Error al actualizar la llamada",
            message: "Ha ocurrido un error interno del servidor",
        });
    }
};

module.exports = {
    crearLlamada,
    actualizarLlamada,
};
