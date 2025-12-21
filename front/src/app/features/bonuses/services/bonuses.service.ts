import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { LoadingService } from '../../../core/services/loading.service';
import {
  Bonus,
  BonusesApiResponse,
  BonusApiResponse,
  CreateBonusRequest,
  UpdateBonusRequest
} from '../models/bonus.model';

/**
 * Servicio para gestionar los bonos
 * Maneja las operaciones CRUD de bonos con paginación
 */
@Injectable({ providedIn: 'root' })
export class BonusesService {
  private http = inject(HttpClient);
  private loadingService = inject(LoadingService);
  private apiUrl = `${environment.api.baseUrl}/bonuses`;

  /**
   * Obtener bonos con paginación (todos o filtrados por paciente)
   * @param patientId ID del paciente (opcional - si no se envía, trae todos)
   * @param page Número de página
   * @param limit Registros por página
   * @returns Observable con la respuesta paginada
   */
  getBonuses(patientId?: number, page: number = 1, limit: number = 10): Observable<BonusesApiResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    // Solo agregar patient_id si está definido
    if (patientId !== undefined) {
      params = params.set('patient_id', patientId.toString());
    }

    this.loadingService.show();

    return this.http
      .get<BonusesApiResponse>(this.apiUrl, { params })
      .pipe(
        finalize(() => this.loadingService.hide())
      );
  }

  /**
   * Crear un nuevo bono
   * @param bonusData Datos del bono a crear
   * @returns Observable con el bono creado
   */
  createBonus(bonusData: CreateBonusRequest): Observable<BonusApiResponse> {
    this.loadingService.show();

    return this.http
      .post<BonusApiResponse>(this.apiUrl, bonusData)
      .pipe(
        finalize(() => this.loadingService.hide())
      );
  }

  /**
   * Actualizar la fecha de expiración de un bono
   * @param bonusId ID del bono
   * @param updateData Datos de actualización (fecha de expiración)
   * @returns Observable con el bono actualizado
   */
  updateBonus(bonusId: number, updateData: UpdateBonusRequest): Observable<BonusApiResponse> {
    this.loadingService.show();

    return this.http
      .put<BonusApiResponse>(`${this.apiUrl}/${bonusId}`, updateData)
      .pipe(
        finalize(() => this.loadingService.hide())
      );
  }

  /**
   * Eliminar un bono (soft delete)
   * @param bonusId ID del bono a eliminar
   * @returns Observable<void>
   */
  deleteBonus(bonusId: number): Observable<void> {
    this.loadingService.show();

    return this.http
      .delete<void>(`${this.apiUrl}/${bonusId}`)
      .pipe(
        finalize(() => this.loadingService.hide())
      );
  }
}
