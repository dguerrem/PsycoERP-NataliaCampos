import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReusableModalComponent } from '../../../../shared/components/reusable-modal/reusable-modal.component';

export interface BonusInvoiceToGenerate {
  bonus_id: number;
  patient_full_name: string;
  dni: string;
  email: string;
  sessions_number: number;
  total_gross: number;
  invoice_number: string;
  invoice_date: string;
}

/**
 * Componente modal para generación de factura de bono
 * Muestra una tabla con los datos de la factura a generar
 */
@Component({
  selector: 'app-bonus-invoice-modal',
  standalone: true,
  imports: [CommonModule, ReusableModalComponent],
  templateUrl: './bonus-invoice-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BonusInvoiceModalComponent {
  @Input({ required: true }) isOpen!: boolean;
  @Input({ required: true }) bonusInvoiceToGenerate!: BonusInvoiceToGenerate | null;
  @Input({ required: true }) errorMessage!: string | null;

  @Output() submit = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() closeError = new EventEmitter<void>();
  @Output() updateDate = new EventEmitter<string>();
  @Output() preview = new EventEmitter<void>();

  /**
   * Formatea un número como moneda
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  /**
   * Maneja el cambio de fecha de la factura
   */
  onDateChange(event: Event) {
    const date = (event.target as HTMLInputElement).value;
    this.updateDate.emit(date);
  }

  /**
   * Maneja la vista previa de la factura
   */
  onPreview() {
    this.preview.emit();
  }

  /**
   * Maneja el envío del formulario
   */
  onSubmit() {
    this.submit.emit();
  }

  /**
   * Maneja la cancelación del modal
   */
  onCancel() {
    this.cancel.emit();
  }

  /**
   * Cierra el mensaje de error
   */
  onCloseError() {
    this.closeError.emit();
  }
}
