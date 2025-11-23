import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
  OnInit,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Patient } from '../../../../shared/models/patient.model';
import { PatientsService } from '../../services/patients.service';
/**
 * Patient Data Component
 *
 * Displays and allows editing of patient personal, contact, and treatment information
 */
@Component({
  selector: 'app-patient-data',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-data.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientDataComponent implements OnInit, OnChanges {
  @Input() patient!: Patient;
  @Output() patientUpdated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private patientsService = inject(PatientsService);

  readonly isEditing = signal(false);
  readonly patientForm: FormGroup;

  constructor() {
    this.patientForm = this.fb.group({
      // Personal Information
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      dni: ['', Validators.required],
      birth_date: ['', Validators.required],
      occupation: [''],

      // Contact Information
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      street: ['', Validators.required],
      street_number: ['', Validators.required],
      door: [''],
      postal_code: ['', Validators.required],
      city: ['', Validators.required],
      province: ['', Validators.required],

      // Treatment Information (tipo_clinica and nombre_clinica are read-only, not included)
      treatment_start_date: [''],
      status: [''],
      special_price: [null, [Validators.min(0)]],

      // Campos automáticos
      is_minor: [false],

      // Progenitor Information (for minors)
      progenitor1_full_name: [''],
      progenitor1_dni: [''],
      progenitor1_phone: [''],
      progenitor2_full_name: [''],
      progenitor2_dni: [''],
      progenitor2_phone: [''],
    });
  }

  readonly age = computed(() => {
    if (!this.patient?.birth_date) return 0;

    const birthDate = new Date(this.patient.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  });

  readonly isMinor = computed(() => {
    return this.age() < 18;
  });

  ngOnInit() {
    if (this.patient) {
      this.loadPatientData();
      this.patientForm.disable(); // Disable form by default
    }
  }

  ngOnChanges() {
    if (this.patient) {
      this.loadPatientData();
      if (!this.isEditing()) {
        this.patientForm.disable(); // Keep disabled when patient changes
      }
    }
  }

  private loadPatientData() {
    // Calculate if patient is minor
    const birthDate = this.patient.birth_date ? new Date(this.patient.birth_date) : null;
    const isMinor = birthDate ? this.calculateIsMinor(birthDate) : false;

    this.patientForm.patchValue({
      first_name: this.patient.first_name,
      last_name: this.patient.last_name,
      dni: this.patient.dni,
      birth_date: this.patient.birth_date,
      occupation: this.patient.occupation,
      email: this.patient.email,
      phone: this.patient.phone,
      street: this.patient.street,
      street_number: this.patient.street_number,
      door: this.patient.door,
      postal_code: this.patient.postal_code,
      city: this.patient.city,
      province: this.patient.province,
      treatment_start_date: this.patient.treatment_start_date,
      status: this.patient.status,
      special_price: this.patient.special_price || null,
      is_minor: isMinor,
      progenitor1_full_name: this.patient.progenitor1_full_name || '',
      progenitor1_dni: this.patient.progenitor1_dni || '',
      progenitor1_phone: this.patient.progenitor1_phone || '',
      progenitor2_full_name: this.patient.progenitor2_full_name || '',
      progenitor2_dni: this.patient.progenitor2_dni || '',
      progenitor2_phone: this.patient.progenitor2_phone || '',
    });

    // Update validators based on minor status
    this.updateProgenitorValidators();
  }

  private calculateIsMinor(birthDate: Date): boolean {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();

    const actualAge = age - (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? 1 : 0);
    return actualAge < 18;
  }

  private updateProgenitorValidators(): void {
    const isMinor = this.isMinor();

    const progenitor1FullName = this.patientForm.get('progenitor1_full_name');
    const progenitor1Dni = this.patientForm.get('progenitor1_dni');
    const progenitor1Phone = this.patientForm.get('progenitor1_phone');

    if (isMinor) {
      // Progenitor 1 fields are required for minors
      progenitor1FullName?.setValidators([Validators.required, Validators.minLength(2)]);
      progenitor1Dni?.setValidators([Validators.required, Validators.minLength(8)]);
      progenitor1Phone?.setValidators([Validators.required, Validators.minLength(9)]);
    } else {
      // Clear validators if not minor
      progenitor1FullName?.clearValidators();
      progenitor1Dni?.clearValidators();
      progenitor1Phone?.clearValidators();
    }

    // Update validity
    progenitor1FullName?.updateValueAndValidity();
    progenitor1Dni?.updateValueAndValidity();
    progenitor1Phone?.updateValueAndValidity();
  }

  onEdit() {
    this.isEditing.set(true);
    this.patientForm.enable();
  }

  async onSave() {
    if (this.patientForm.valid && this.patient.id) {
      const formValue = this.patientForm.value;

      const updatedPatient: Partial<Patient> = {
        first_name: formValue.first_name,
        last_name: formValue.last_name,
        dni: formValue.dni,
        birth_date: formValue.birth_date,
        occupation: formValue.occupation,
        email: formValue.email,
        phone: formValue.phone,
        street: formValue.street,
        street_number: formValue.street_number,
        door: formValue.door || '',
        postal_code: formValue.postal_code,
        city: formValue.city,
        province: formValue.province,
        treatment_start_date: formValue.treatment_start_date,
        status: formValue.status,
        special_price: formValue.special_price || null,
      };

      // Only include progenitor fields if patient is minor
      if (this.isMinor()) {
        updatedPatient.progenitor1_full_name = formValue.progenitor1_full_name;
        updatedPatient.progenitor1_dni = formValue.progenitor1_dni;
        updatedPatient.progenitor1_phone = formValue.progenitor1_phone;
        updatedPatient.progenitor2_full_name = formValue.progenitor2_full_name || '';
        updatedPatient.progenitor2_dni = formValue.progenitor2_dni || '';
        updatedPatient.progenitor2_phone = formValue.progenitor2_phone || '';
      }

      const result = await this.patientsService.updatePatientAsync(
        this.patient.id,
        updatedPatient
      );

      if (result) {
        this.isEditing.set(false);
        this.patientForm.disable();
        this.patientUpdated.emit();
      }
    }
  }

  onCancel() {
    this.loadPatientData(); // Reset to original values
    this.isEditing.set(false);
    this.patientForm.disable();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'en curso':
        return 'bg-green-100 text-green-800';
      case 'fin del tratamiento':
        return 'bg-blue-100 text-blue-800';
      case 'en pausa':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  }

  getStatusLabel(status: string): string {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }
}
