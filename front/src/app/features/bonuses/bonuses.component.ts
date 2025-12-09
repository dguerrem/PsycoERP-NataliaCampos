import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  Bonus,
  BonusUsageHistory,
  BonusStatus,
  CreateBonusRequest,
  PaginationData
} from './models/bonus.model';
import { PatientSelectorComponent } from '../../shared/components/patient-selector/patient-selector.component';
import { PatientSelector } from '../../shared/models/patient.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';
import { environment } from '../../../environments/environment';
import { BonusesService } from './services/bonuses.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-bonuses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PatientSelectorComponent,
    PaginationComponent,
    SectionHeaderComponent
  ],
  templateUrl: './bonuses.component.html',
  styleUrl: './bonuses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BonusesComponent implements OnInit {
  private fb = new FormBuilder();
  private http = inject(HttpClient);
  private bonusesService = inject(BonusesService);
  private toastService = inject(ToastService);

  // State signals
  bonuses = signal<Bonus[]>([]);
  isCreatingBonus = signal(false);
  editingBonus = signal<Bonus | null>(null);
  deletingBonus = signal<Bonus | null>(null);
  selectedBonusHistory = signal<Bonus | null>(null);
  patients = signal<PatientSelector[]>([]);
  selectedPatient = signal<PatientSelector | null>(null);
  paginationData = signal<PaginationData | null>(null);
  currentPage = signal(1);
  pageSize = signal(10);

  // Form
  bonusForm: FormGroup;
  patientFilterControl: FormGroup;

  constructor() {
    // Calculate default expiry date (1 year from now)
    const defaultExpiryDate = new Date();
    defaultExpiryDate.setFullYear(defaultExpiryDate.getFullYear() + 1);
    const defaultExpiryString = defaultExpiryDate.toISOString().split('T')[0];

    this.bonusForm = this.fb.group({
      patientId: [null, [Validators.required]],
      totalSessions: [10, [Validators.required, Validators.min(1)]],
      pricePerSession: [50, [Validators.required, Validators.min(0)]],
      totalPrice: [500, [Validators.required, Validators.min(0)]],
      expiryDate: [defaultExpiryString, [Validators.required]]
    });

    this.patientFilterControl = this.fb.group({
      patientId: [null]
    });

    // Listen to changes in form fields to update calculations
    this.setupFormCalculations();

    // Listen to patient filter changes
    this.patientFilterControl.get('patientId')?.valueChanges.subscribe(patientId => {
      if (patientId) {
        const patient = this.patients().find(p => p.idPaciente === patientId);
        this.onPatientSelected(patient || null);
      } else {
        this.onPatientSelected(null);
      }
    });
  }

  ngOnInit(): void {
    this.loadPatients();
    this.loadBonuses(); // Load all bonuses on init
  }

  // Load patients
  private loadPatients(): void {
    this.http
      .get<{ data: PatientSelector[] }>(
        `${environment.api.baseUrl}/patients/active-with-clinic`
      )
      .subscribe({
        next: (response) => {
          this.patients.set(response.data);
        },
        error: (error) => {
          console.error('Error loading patients:', error);
          this.toastService.showError('Error al cargar pacientes');
        }
      });
  }

  // Load bonuses (all or filtered by patient)
  loadBonuses(): void {
    const patient = this.selectedPatient();
    const patientId = patient ? patient.idPaciente : undefined;

    this.bonusesService
      .getBonuses(patientId, this.currentPage(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.bonuses.set(response.data);
          this.paginationData.set(response.pagination);
        },
        error: (error) => {
          console.error('Error loading bonuses:', error);
          this.toastService.showError('Error al cargar bonos');
        }
      });
  }

  // Handle patient selection
  onPatientSelected(patient: PatientSelector | null): void {
    this.selectedPatient.set(patient);
    this.currentPage.set(1); // Reset to first page
    this.loadBonuses(); // Load bonuses (all or filtered)
  }

  // Pagination handlers
  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadBonuses();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadBonuses();
  }


  // Form calculations setup
  private setupFormCalculations(): void {
    // When totalSessions or pricePerSession change, update totalPrice
    this.bonusForm.get('totalSessions')?.valueChanges.subscribe(totalSessions => {
      const pricePerSession = this.bonusForm.get('pricePerSession')?.value || 0;
      const totalPrice = totalSessions * pricePerSession;
      this.bonusForm.get('totalPrice')?.setValue(totalPrice, { emitEvent: false });
    });

    this.bonusForm.get('pricePerSession')?.valueChanges.subscribe(pricePerSession => {
      const totalSessions = this.bonusForm.get('totalSessions')?.value || 0;
      const totalPrice = totalSessions * pricePerSession;
      this.bonusForm.get('totalPrice')?.setValue(totalPrice, { emitEvent: false });
    });

    // When totalPrice changes, update pricePerSession
    this.bonusForm.get('totalPrice')?.valueChanges.subscribe(totalPrice => {
      const totalSessions = this.bonusForm.get('totalSessions')?.value || 1;
      const pricePerSession = totalPrice / totalSessions;
      this.bonusForm.get('pricePerSession')?.setValue(pricePerSession, { emitEvent: false });
    });
  }

  // UI Methods
  getStatusColor(status: BonusStatus): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'consumed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: BonusStatus): string {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'expired':
        return 'Expirado';
      case 'consumed':
        return 'Consumido';
      default:
        return status;
    }
  }

  calculateProgress(bonus: Bonus): number {
    return (bonus.used_sessions / bonus.sessions_number) * 100;
  }

  getRemainingSession(bonus: Bonus): number {
    return bonus.remaining_sessions;
  }

  // Actions
  openCreateModal(): void {
    const patient = this.selectedPatient();

    this.isCreatingBonus.set(true);

    // Calculate default expiry date (1 year from now)
    const defaultExpiryDate = new Date();
    defaultExpiryDate.setFullYear(defaultExpiryDate.getFullYear() + 1);
    const defaultExpiryString = defaultExpiryDate.toISOString().split('T')[0];

    this.bonusForm.reset({
      patientId: patient ? patient.idPaciente : null,
      totalSessions: 10,
      pricePerSession: 50,
      totalPrice: 500,
      expiryDate: defaultExpiryString
    });
  }

  closeCreateModal(): void {
    this.isCreatingBonus.set(false);
    this.bonusForm.reset();
  }

  handleCreateBonus(): void {
    if (this.bonusForm.valid) {
      const formData = this.bonusForm.value;

      const createRequest: CreateBonusRequest = {
        patient_id: formData.patientId,
        sessions_number: formData.totalSessions,
        price_per_session: formData.pricePerSession,
        total_price: formData.totalPrice,
        expiration_date: formData.expiryDate
      };

      this.bonusesService.createBonus(createRequest).subscribe({
        next: (response) => {
          this.toastService.showSuccess('Bono creado exitosamente');
          this.closeCreateModal();
          this.loadBonuses(); // Reload the list
        },
        error: (error) => {
          console.error('Error creating bonus:', error);
          this.toastService.showError('Error al crear el bono');
        }
      });
    }
  }

  openEditModal(bonus: Bonus): void {
    this.editingBonus.set(bonus);

    // Format date to YYYY-MM-DD for input[type="date"]
    const expiryDateString = bonus.expiration_date;

    // Only set the expiry date field
    this.bonusForm.patchValue({
      expiryDate: expiryDateString
    });
  }

  closeEditModal(): void {
    this.editingBonus.set(null);
    this.bonusForm.reset();
  }

  handleEditBonus(): void {
    const bonus = this.editingBonus();
    if (this.bonusForm.valid && bonus) {
      const expiryDate = this.bonusForm.get('expiryDate')?.value;

      this.bonusesService.updateBonus(bonus.id, { expiration_date: expiryDate }).subscribe({
        next: (response) => {
          this.toastService.showSuccess('Fecha de expiración actualizada');
          this.closeEditModal();
          this.loadBonuses(); // Reload the list
        },
        error: (error) => {
          console.error('Error updating bonus:', error);
          this.toastService.showError('Error al actualizar el bono');
        }
      });
    }
  }

  openHistoryModal(bonus: Bonus): void {
    this.selectedBonusHistory.set(bonus);
  }

  closeHistoryModal(): void {
    this.selectedBonusHistory.set(null);
  }

  getBonusHistory(bonus: Bonus): BonusUsageHistory[] {
    return bonus.usage_history || [];
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  // Delete Methods
  openDeleteModal(bonus: Bonus): void {
    this.deletingBonus.set(bonus);
  }

  closeDeleteModal(): void {
    this.deletingBonus.set(null);
  }

  handleDeleteBonus(): void {
    const bonus = this.deletingBonus();
    if (bonus) {
      this.bonusesService.deleteBonus(bonus.id).subscribe({
        next: () => {
          this.toastService.showSuccess('Bono eliminado exitosamente');
          this.closeDeleteModal();
          this.loadBonuses();
        },
        error: (error) => {
          console.error('Error deleting bonus:', error);
          this.toastService.showError('Error al eliminar el bono');
        }
      });
    }
  }
}
