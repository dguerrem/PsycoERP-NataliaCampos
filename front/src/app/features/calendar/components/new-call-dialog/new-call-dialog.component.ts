import {
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReusableModalComponent } from '../../../../shared/components/reusable-modal/reusable-modal.component';
import { ConfirmationModalComponent } from '../../../../shared/components/confirmation-modal/confirmation-modal.component';
import { CallsService } from '../../services/calls.service';

export interface CallData {
  id?: number;
  call_first_name: string;
  call_last_name: string;
  call_phone: string;
  session_date: string;
  start_time: string;
  end_time: string;
  notes: string;
  is_billable_call: boolean;
  call_dni?: string;
  call_billing_address?: string;
  price?: number;
  payment_method?: 'transferencia' | 'bizum';
}

@Component({
  selector: 'app-new-call-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReusableModalComponent, ConfirmationModalComponent],
  templateUrl: './new-call-dialog.component.html',
  styleUrls: ['./new-call-dialog.component.scss'],
})
export class NewCallDialogComponent {
  private callsService = inject(CallsService);

  @Input() prefilledData?: Partial<CallData> | null;
  @Input() isEditMode: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() callDataCreated = new EventEmitter<CallData>();
  @Output() callDeleted = new EventEmitter<number>();

  protected formData = signal<CallData>({
    call_first_name: '',
    call_last_name: '',
    call_phone: '',
    session_date: '',
    start_time: '',
    end_time: '',
    notes: '',
    is_billable_call: false,
    call_dni: '',
    call_billing_address: '',
    price: undefined,
    payment_method: undefined,
  });

  protected isFormValid = signal<boolean>(false);
  protected showDeleteConfirmation = signal<boolean>(false);

  constructor() {
    // Update form validity whenever formData changes
    effect(
      () => {
        const data = this.formData();
        let isValid = !!(
          data.call_first_name &&
          data.call_last_name &&
          data.call_phone &&
          data.session_date &&
          data.start_time &&
          data.end_time
        );

        // Si tiene llamada facturable, validar campos adicionales
        if (data.is_billable_call) {
          isValid =
            isValid &&
            !!(
              data.call_dni &&
              data.call_billing_address &&
              data.price !== undefined &&
              data.price > 0 &&
              data.payment_method
            );
        }

        this.isFormValid.set(isValid);
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit() {
    if (this.prefilledData) {
      const dataToSet = { ...this.formData(), ...this.prefilledData };

      // Si hay start_time pero no end_time, calcular automáticamente end_time
      if (dataToSet.start_time && !dataToSet.end_time) {
        dataToSet.end_time = this.calculateEndTime(dataToSet.start_time);
      }

      this.formData.set(dataToSet);
    }
  }

  protected updateFormField(
    field: keyof CallData,
    value: string | boolean | number
  ) {
    const updatedData: Partial<CallData> = {
      [field]: value,
    };

    // Si se actualiza start_time, calcular automáticamente end_time (+30 minutos)
    if (field === 'start_time' && typeof value === 'string' && value) {
      const endTime = this.calculateEndTime(value);
      updatedData.end_time = endTime;
    }

    this.formData.set({
      ...this.formData(),
      ...updatedData,
    });
  }

  private calculateEndTime(startTime: string): string {
    if (!startTime) return '';

    try {
      // Parsear la hora de inicio (formato HH:MM)
      const [hours, minutes] = startTime.split(':').map(Number);

      // Crear una fecha con la hora de inicio
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);

      // Añadir 30 minutos
      date.setMinutes(date.getMinutes() + 30);

      // Formatear de vuelta a HH:MM
      const endHours = date.getHours().toString().padStart(2, '0');
      const endMinutes = date.getMinutes().toString().padStart(2, '0');

      return `${endHours}:${endMinutes}`;
    } catch (error) {
      console.error('Error calculating end time:', error);
      return '';
    }
  }

  protected toggleBillableCall() {
    this.formData.set({
      ...this.formData(),
      is_billable_call: !this.formData().is_billable_call,
    });
  }

  protected parseNumber(value: string): number {
    return parseFloat(value) || 0;
  }

  protected onSubmit() {
    if (this.isFormValid()) {
      const callData = this.formData();

      if (this.isEditMode && callData.id) {
        // Actualizar llamada existente
        this.callsService.updateCall(callData.id, callData).subscribe({
          next: (updatedCall) => {
            this.callDataCreated.emit(updatedCall);
            this.onClose();
          },
        });
      } else {
        // Crear nueva llamada
        this.callsService.createCall(callData).subscribe({
          next: (newCall) => {
            this.callDataCreated.emit(newCall);
            this.onClose();
          },
        });
      }
    }
  }

  protected openDeleteConfirmation() {
    this.showDeleteConfirmation.set(true);
  }

  protected closeDeleteConfirmation() {
    this.showDeleteConfirmation.set(false);
  }

  protected handleDeleteCall() {
    const callData = this.formData();
    if (callData.id) {
      this.callsService.deleteCall(callData.id).subscribe({
        next: () => {
          this.callDeleted.emit(callData.id);
          this.closeDeleteConfirmation();
          this.onClose();
        },
      });
    }
  }

  protected onClose() {
    this.close.emit();
  }
}
