const { createCall } = require("../../models/calls/calls_model");
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

module.exports = {
    crearLlamada,
};
