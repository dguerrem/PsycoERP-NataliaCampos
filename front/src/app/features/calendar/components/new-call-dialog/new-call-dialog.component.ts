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
    effect(() => {
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
    });
  }

  ngOnInit() {
    if (this.prefilledData) {
      this.formData.set({
        ...this.formData(),
        ...this.prefilledData,
      });
    }
  }

  protected updateFormField(
    field: keyof CallData,
    value: string | boolean | number
  ) {
    this.formData.set({
      ...this.formData(),
      [field]: value,
    });
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
