import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseCrudService } from '../../../core/services/base-crud.service';
import { CallData } from '../components/new-call-dialog/new-call-dialog.component';

/**
 * Servicio para gestionar las llamadas
 * Extiende BaseCrudService para operaciones CRUD con manejo de errores automático
 */
@Injectable({ providedIn: 'root' })
export class CallsService extends BaseCrudService<CallData> {
  constructor() {
    super('/calls', 'Llamada');
  }

  /**
   * Crear una nueva llamada - Conecta con API real
   * POST /api/calls
   */
  createCall(formData: CallData): Observable<CallData> {
    return this.create(formData);
  }

  /**
   * Actualizar una llamada existente - Conecta con API real
   * PUT /api/calls/{id}
   */
  updateCall(callId: number, formData: CallData): Observable<CallData> {
    return this.update(callId, formData);
  }

  /**
   * Eliminar una llamada - Conecta con API real
   * DELETE /api/calls/{id}
   */
  deleteCall(callId: number): Observable<void> {
    return this.delete(callId);
  }
}
