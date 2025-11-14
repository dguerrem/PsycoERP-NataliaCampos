import {
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReusableModalComponent } from '../../../../shared/components/reusable-modal/reusable-modal.component';

export interface CallData {
  id?: number;
  patientFirstName: string;
  patientLastName: string;
  patientPhone: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  notes: string;
  hasPaidCall: boolean;
  dniNie?: string;
  billingAddress?: string;
  price?: number;
}

@Component({
  selector: 'app-new-call-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReusableModalComponent],
  templateUrl: './new-call-dialog.component.html',
  styleUrls: ['./new-call-dialog.component.scss'],
})
export class NewCallDialogComponent {
  @Input() prefilledData?: Partial<CallData> | null;
  @Input() isEditMode: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() callDataCreated = new EventEmitter<CallData>();

  protected formData = signal<CallData>({
    patientFirstName: '',
    patientLastName: '',
    patientPhone: '',
    sessionDate: '',
    startTime: '',
    endTime: '',
    notes: '',
    hasPaidCall: false,
    dniNie: '',
    billingAddress: '',
    price: undefined,
  });

  protected isFormValid = signal<boolean>(false);

  constructor() {
    // Update form validity whenever formData changes
    effect(
      () => {
        const data = this.formData();
        let isValid = !!(
          data.patientFirstName &&
          data.patientLastName &&
          data.patientPhone &&
          data.sessionDate &&
          data.startTime &&
          data.endTime
        );

        // Si tiene llamada con precio, validar campos adicionales
        if (data.hasPaidCall) {
          isValid =
            isValid &&
            !!(
              data.dniNie &&
              data.billingAddress &&
              data.price !== undefined &&
              data.price > 0
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
      
      // Si hay startTime pero no endTime, calcular automáticamente endTime
      if (dataToSet.startTime && !dataToSet.endTime) {
        dataToSet.endTime = this.calculateEndTime(dataToSet.startTime);
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

    // Si se actualiza startTime, calcular automáticamente endTime (+30 minutos)
    if (field === 'startTime' && typeof value === 'string' && value) {
      const endTime = this.calculateEndTime(value);
      updatedData.endTime = endTime;
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

  protected togglePaidCall() {
    this.formData.set({
      ...this.formData(),
      hasPaidCall: !this.formData().hasPaidCall,
    });
  }

  protected parseNumber(value: string): number {
    return parseFloat(value) || 0;
  }

  protected onSubmit() {
    if (this.isFormValid()) {
      this.callDataCreated.emit(this.formData());
      this.onClose();
    }
  }

  protected onClose() {
    this.close.emit();
  }
}
