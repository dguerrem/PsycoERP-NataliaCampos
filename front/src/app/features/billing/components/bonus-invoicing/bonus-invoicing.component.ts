import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PendingBonusInvoice, ExistingBonusInvoice } from '../../models/billing.models';

/**
 * Componente de facturación de bonos con subtabs
 * Gestiona la generación individual de facturas para bonos
 * Incluye visualización de facturas de bonos existentes
 */
@Component({
  selector: 'app-bonus-invoicing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bonus-invoicing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BonusInvoicingComponent {
  // Subtab activo
  activeSubTab = signal<'generate' | 'existing'>('generate');

  /**
   * Mes seleccionado para filtrar bonos pendientes
   */
  private _bonusMonth = signal<number>(0);
  @Input({ required: true })
  set bonusMonth(value: number) {
    this._bonusMonth.set(value);
  }
  get bonusMonth(): number {
    return this._bonusMonth();
  }

  /**
   * Año seleccionado para filtrar bonos pendientes
   */
  private _bonusYear = signal<number>(0);
  @Input({ required: true })
  set bonusYear(value: number) {
    this._bonusYear.set(value);
  }
  get bonusYear(): number {
    return this._bonusYear();
  }

  /**
   * Array con los nombres de los meses
   */
  @Input({ required: true }) monthNames!: string[];

  /**
   * Array con los años disponibles
   */
  @Input({ required: true }) years!: number[];

  /**
   * Bonos pendientes de facturar
   */
  private _bonusInvoices = signal<PendingBonusInvoice[]>([]);
  @Input({ required: true })
  set bonusInvoices(value: PendingBonusInvoice[]) {
    this._bonusInvoices.set(value);
  }
  get bonusInvoices(): PendingBonusInvoice[] {
    return this._bonusInvoices();
  }

  /**
   * Estado de carga de bonos pendientes
   */
  private _isLoadingBonus = signal<boolean>(false);
  @Input({ required: true })
  set isLoadingBonus(value: boolean) {
    this._isLoadingBonus.set(value);
  }
  get isLoadingBonus(): boolean {
    return this._isLoadingBonus();
  }

  /**
   * Prefijo para números de factura
   */
  @Input({ required: true }) invoicePrefix!: string;

  /**
   * Año para números de factura
   */
  @Input({ required: true }) invoiceYear!: number;

  /**
   * Próximo número de factura
   */
  @Input({ required: true }) invoiceNextNumber!: number;

  /**
   * Evento emitido cuando cambia el mes seleccionado
   */
  @Output() monthChange = new EventEmitter<number>();

  /**
   * Evento emitido cuando cambia el año seleccionado
   */
  @Output() yearChange = new EventEmitter<number>();

  /**
   * Evento emitido cuando se solicita generar una factura de bono
   */
  @Output() generateInvoice = new EventEmitter<number>();

  /**
   * Evento emitido cuando se solicita vista previa de un bono pendiente
   */
  @Output() previewInvoice = new EventEmitter<number>();

  /**
   * Evento emitido cuando cambia el prefijo de factura
   */
  @Output() prefixChange = new EventEmitter<string>();

  /**
   * Evento emitido cuando cambia el año de factura
   */
  @Output() invoiceYearChange = new EventEmitter<number>();

  /**
   * Evento emitido cuando se valida el año de factura
   */
  @Output() invoiceYearValidate = new EventEmitter<void>();

  // Inputs para facturas existentes
  /**
   * Mes seleccionado para facturas de bonos existentes
   */
  private _existingBonusMonth = signal<number>(0);
  @Input({ required: true })
  set existingBonusMonth(value: number) {
    this._existingBonusMonth.set(value);
  }
  get existingBonusMonth(): number {
    return this._existingBonusMonth();
  }

  /**
   * Año seleccionado para facturas de bonos existentes
   */
  private _existingBonusYear = signal<number>(0);
  @Input({ required: true })
  set existingBonusYear(value: number) {
    this._existingBonusYear.set(value);
  }
  get existingBonusYear(): number {
    return this._existingBonusYear();
  }

  /**
   * Facturas de bonos existentes
   */
  private _existingBonusInvoices = signal<ExistingBonusInvoice[]>([]);
  @Input({ required: true })
  set existingBonusInvoices(value: ExistingBonusInvoice[]) {
    this._existingBonusInvoices.set(value);
  }
  get existingBonusInvoices(): ExistingBonusInvoice[] {
    return this._existingBonusInvoices();
  }

  /**
   * Estado de carga de facturas de bonos existentes
   */
  private _isLoadingExistingBonus = signal<boolean>(false);
  @Input({ required: true })
  set isLoadingExistingBonus(value: boolean) {
    this._isLoadingExistingBonus.set(value);
  }
  get isLoadingExistingBonus(): boolean {
    return this._isLoadingExistingBonus();
  }

  // Outputs para facturas existentes
  /**
   * Evento emitido cuando cambia el mes de facturas de bonos existentes
   */
  @Output() existingMonthChange = new EventEmitter<number>();

  /**
   * Evento emitido cuando cambia el año de facturas de bonos existentes
   */
  @Output() existingYearChange = new EventEmitter<number>();

  /**
   * Evento emitido cuando se solicita vista previa de una factura de bono existente
   */
  @Output() previewExistingInvoice = new EventEmitter<number>();

  /**
   * Evento emitido cuando se solicita descarga de una factura de bono
   */
  @Output() downloadInvoice = new EventEmitter<number>();

  /**
   * Evento emitido cuando se activa el subtab de facturas existentes
   */
  @Output() existingSubTabActivated = new EventEmitter<void>();

  // Filtros locales
  bonusPatientFilter = signal('');
  bonusDniFilter = signal('');
  bonusClinicFilter = signal('');

  existingPatientFilter = signal('');
  existingDniFilter = signal('');
  existingInvoiceNumberFilter = signal('');

  /**
   * Bonos filtrados según los criterios de búsqueda
   */
  filteredBonusInvoices = computed(() => {
    const bonuses = this._bonusInvoices();
    const patientFilter = this.bonusPatientFilter().toLowerCase();
    const dniFilter = this.bonusDniFilter().toLowerCase();
    const clinicFilter = this.bonusClinicFilter().toLowerCase();

    return bonuses.filter((bonus) => {
      const matchesPatient = (bonus.patient_full_name || '')
        .toLowerCase()
        .includes(patientFilter);
      const matchesDni = (bonus.dni || '').toLowerCase().includes(dniFilter);
      const matchesClinic = (bonus.clinic_name || '')
        .toLowerCase()
        .includes(clinicFilter);

      return matchesPatient && matchesDni && matchesClinic;
    });
  });

  /**
   * Facturas de bonos existentes filtradas según los criterios de búsqueda
   */
  filteredExistingBonusInvoices = computed(() => {
    const invoices = this._existingBonusInvoices();
    const patientFilter = this.existingPatientFilter().toLowerCase();
    const dniFilter = this.existingDniFilter().toLowerCase();
    const invoiceNumberFilter = this.existingInvoiceNumberFilter().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesPatient = (invoice.patient_full_name || '')
        .toLowerCase()
        .includes(patientFilter);
      const matchesDni = (invoice.dni || '').toLowerCase().includes(dniFilter);
      const matchesInvoiceNumber = (invoice.invoice_number || '')
        .toLowerCase()
        .includes(invoiceNumberFilter);

      return matchesPatient && matchesDni && matchesInvoiceNumber;
    });
  });

  /**
   * Maneja el cambio de mes en el filtro
   */
  onMonthChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.monthChange.emit(parseInt(select.value));
  }

  /**
   * Maneja el cambio de año en el filtro
   */
  onYearChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.yearChange.emit(parseInt(select.value));
  }

  /**
   * Maneja el cambio de mes de facturas existentes
   */
  onExistingMonthChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.existingMonthChange.emit(parseInt(select.value));
  }

  /**
   * Maneja el cambio de año de facturas existentes
   */
  onExistingYearChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.existingYearChange.emit(parseInt(select.value));
  }

  /**
   * Genera factura para un bono
   */
  onGenerateInvoice(bonusId: number): void {
    this.generateInvoice.emit(bonusId);
  }

  /**
   * Vista previa de una factura de bono pendiente
   */
  onPreviewInvoice(bonusId: number): void {
    this.previewInvoice.emit(bonusId);
  }

  /**
   * Vista previa de una factura de bono existente
   */
  onPreviewExistingInvoice(invoiceId: number): void {
    this.previewExistingInvoice.emit(invoiceId);
  }

  /**
   * Descarga una factura de bono
   */
  onDownloadInvoice(invoiceId: number): void {
    this.downloadInvoice.emit(invoiceId);
  }

  /**
   * Formatea un número como moneda EUR
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  /**
   * Obtiene el nombre del mes seleccionado
   */
  getBonusMonthName(): string {
    return this.monthNames[this._bonusMonth() - 1];
  }

  /**
   * Obtiene el nombre del mes de facturas existentes
   */
  getExistingBonusMonthName(): string {
    return this.monthNames[this._existingBonusMonth() - 1];
  }

  /**
   * Formatea número con padding
   */
  padNumber(num: number, length: number = 4): string {
    return num.toString().padStart(length, '0');
  }

  /**
   * Actualiza el prefijo de factura
   */
  onPrefixChange(newPrefix: string): void {
    this.prefixChange.emit(newPrefix);
  }

  /**
   * Actualiza el año de factura
   */
  onInvoiceYearChange(newYear: number): void {
    this.invoiceYearChange.emit(newYear);
  }

  /**
   * Valida el año de factura
   */
  onInvoiceYearBlur(): void {
    this.invoiceYearValidate.emit();
  }

  /**
   * Cambia el subtab activo
   */
  onSubTabChange(tab: 'generate' | 'existing'): void {
    this.activeSubTab.set(tab);
    if (tab === 'existing') {
      this.existingSubTabActivated.emit();
    }
  }
}
