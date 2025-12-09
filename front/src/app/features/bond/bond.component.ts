import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Bonus, BonusFormData, BonusHistorySession, BonusSummary, BonusStatus } from './models/bond.model';
import { PatientSelectorComponent } from '../../shared/components/patient-selector/patient-selector.component';
import { PatientSelector } from '../../shared/models/patient.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-bond',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PatientSelectorComponent
  ],
  templateUrl: './bond.component.html',
  styleUrl: './bond.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BondComponent implements OnInit {
  private fb = new FormBuilder();
  private http = inject(HttpClient);

  // State signals
  bonuses = signal<Bonus[]>(this.getMockBonuses());
  isCreatingBonus = signal(false);
  editingBonus = signal<Bonus | null>(null);
  selectedBonusHistory = signal<Bonus | null>(null);
  patients = signal<PatientSelector[]>([]);

  // Form
  bonusForm: FormGroup;

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

    // Listen to changes in form fields to update calculations
    this.setupFormCalculations();
  }

  ngOnInit(): void {
    this.loadPatients();
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
        }
      });
  }

  // Computed signals
  summary = computed<BonusSummary>(() => {
    const bonuses = this.bonuses();
    return {
      total: bonuses.length,
      active: bonuses.filter(b => b.status === 'active').length,
      consumed: bonuses.filter(b => b.status === 'consumed').length,
      expired: bonuses.filter(b => b.status === 'expired').length
    };
  });

  activeBonuses = computed(() =>
    this.bonuses().filter(b => b.status === 'active')
  );

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
    return (bonus.usedSessions / bonus.totalSessions) * 100;
  }

  getRemainingSession(bonus: Bonus): number {
    return bonus.totalSessions - bonus.usedSessions;
  }

  // Actions
  openCreateModal(): void {
    this.isCreatingBonus.set(true);

    // Calculate default expiry date (1 year from now)
    const defaultExpiryDate = new Date();
    defaultExpiryDate.setFullYear(defaultExpiryDate.getFullYear() + 1);
    const defaultExpiryString = defaultExpiryDate.toISOString().split('T')[0];

    this.bonusForm.reset({
      patientId: null,
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
      const formData = this.bonusForm.value as BonusFormData;
      console.log('Creating bonus:', formData);

      // Get patient name
      const patient = this.patients().find(p => p.idPaciente === formData.patientId);
      const patientName = patient?.nombreCompleto || 'Unknown';

      // Mock: Add new bonus to the list
      const newBonus: Bonus = {
        id: `bonus-${Date.now()}`,
        patientId: formData.patientId,
        patientName: patientName,
        totalSessions: formData.totalSessions,
        usedSessions: 0,
        pricePerSession: formData.pricePerSession,
        totalPrice: formData.totalPrice,
        purchaseDate: new Date(),
        expiryDate: new Date(formData.expiryDate),
        status: 'active'
      };

      this.bonuses.update(bonuses => [...bonuses, newBonus]);
      this.closeCreateModal();
    }
  }

  openEditModal(bonus: Bonus): void {
    this.editingBonus.set(bonus);

    // Format date to YYYY-MM-DD for input[type="date"]
    const expiryDateString = bonus.expiryDate instanceof Date
      ? bonus.expiryDate.toISOString().split('T')[0]
      : new Date(bonus.expiryDate).toISOString().split('T')[0];

    // Only set the expiry date field, keep other fields with their original values
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
      console.log('Editing bonus expiry date:', expiryDate);

      // Mock: Update only expiry date in the bonus
      this.bonuses.update(bonuses =>
        bonuses.map(b =>
          b.id === bonus.id
            ? {
                ...b,
                expiryDate: new Date(expiryDate)
              }
            : b
        )
      );

      this.closeEditModal();
    }
  }

  openHistoryModal(bonus: Bonus): void {
    this.selectedBonusHistory.set(bonus);
  }

  closeHistoryModal(): void {
    this.selectedBonusHistory.set(null);
  }

  getBonusHistory(bonus: Bonus): BonusHistorySession[] {
    // Mock history data
    const sessions: BonusHistorySession[] = [];
    for (let i = 0; i < bonus.usedSessions; i++) {
      const date = new Date(bonus.purchaseDate);
      date.setDate(date.getDate() + (i * 7)); // One session per week

      sessions.push({
        date: date.toLocaleDateString('es-ES'),
        session: `Sesión #${String(i + 1).padStart(3, '0')}`,
        professional: 'Dr. García',
        status: 'Completada'
      });
    }
    return sessions;
  }

  // Mock data
  private getMockBonuses(): Bonus[] {
    const now = new Date();
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    return [
      {
        id: 'bonus-1',
        patientId: 1,
        patientName: 'Juan Pérez',
        totalSessions: 10,
        usedSessions: 6,
        pricePerSession: 50,
        totalPrice: 500,
        purchaseDate: new Date(2025, 11, 2), // Dec 2, 2025
        expiryDate: new Date(2026, 11, 2),
        status: 'active'
      },
      {
        id: 'bonus-2',
        patientId: 2,
        patientName: 'María García',
        totalSessions: 10,
        usedSessions: 2,
        pricePerSession: 50,
        totalPrice: 500,
        purchaseDate: new Date(2025, 9, 2), // Oct 2, 2025
        expiryDate: new Date(2026, 9, 2),
        status: 'active'
      }
    ];
  }
}
