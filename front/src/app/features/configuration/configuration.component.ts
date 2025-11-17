import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  computed,
  signal,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { UpdateUserProfileRequest } from '../../core/models/user.model';
import { ClinicsService } from '../clinics/services/clinics.service';
import { ClinicSelectorComponent } from '../../shared/components/clinic-selector/clinic-selector.component';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ClinicSelectorComponent],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private clinicsService = inject(ClinicsService);

  // Signals para estados de loading
  private saveInProgress = signal(false);

  // Computed signals para el template
  protected isLoading = computed(() => this.userService.isLoading());
  protected isUpdating = computed(
    () => this.userService.isUpdating() || this.saveInProgress()
  );
  protected userProfile = computed(() => this.userService.profile());
  protected clinics = computed(() => this.clinicsService.all());

  // Control para el selector de clínica
  public principalClinicControl = new FormControl<number | null>(null);

  // Computed para determinar si mostrar el selector o el campo de texto
  protected hasPrincipalClinic = computed(() => {
    const profile = this.userProfile();
    return !!profile?.PrincipalClinicInfo;
  });

  protected principalClinicName = computed(() => {
    const profile = this.userProfile();
    return profile?.PrincipalClinicInfo?.name || '';
  });

  public configurationForm = this.fb.group({
    name: ['', Validators.required],
    license_number: [''],
    irpf: [''],
    iban: [''],
    dni: ['', Validators.required],
    street: ['', Validators.required],
    street_number: ['', Validators.required],
    door: [''],
    city: ['', Validators.required],
    province: ['', Validators.required],
    postal_code: ['', Validators.required],
  });

  async ngOnInit() {
    await this.loadUserData();
  }

  /**
   * Carga las clínicas disponibles si el usuario no tiene una clínica principal asignada
   */
  private loadClinicsIfNeeded(): void {
    const profile = this.userProfile();

    // Solo cargar clínicas si no hay PrincipalClinicInfo
    if (!profile?.PrincipalClinicInfo) {
      this.clinicsService.loadClinics();
    }
  }

  public isFieldInvalid(field: string): boolean {
    const control = this.configurationForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  public getFieldError(field: string): string {
    const control = this.configurationForm.get(field);
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio.';
    }
    return '';
  }

  /**
   * Carga los datos del usuario actual desde la API
   */
  private async loadUserData(): Promise<void> {
    try {
      const userId = this.userService.getUserIdFromStorage();

      if (userId) {
        const user = await this.userService.getUserProfileAsync(userId);

        if (user) {
          // Llenar el formulario con los datos del usuario
          this.configurationForm.patchValue({
            name: user.name || '',
            license_number: user.license_number || '',
            irpf: user.irpf || '',
            iban: user.iban || '',
            dni: user.dni || '',
            street: user.street || '',
            street_number: user.street_number || '',
            door: user.door || '',
            city: user.city || '',
            province: user.province || '',
            postal_code: user.postal_code || '',
          });

          // Establecer el valor del control de clínica principal
          if (user.principal_clinic_id) {
            this.principalClinicControl.setValue(user.principal_clinic_id);
          }

          // Cargar clínicas si es necesario (solo si no tiene PrincipalClinicInfo)
          this.loadClinicsIfNeeded();
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  /**
   * Guarda los cambios del perfil del usuario
   */
  public async handleSave(): Promise<void> {
    if (this.configurationForm.valid) {
      this.saveInProgress.set(true);

      try {
        const userId = this.userService.getUserIdFromStorage();

        if (userId) {
          const formData: UpdateUserProfileRequest = {
            ...(this.configurationForm.value as UpdateUserProfileRequest),
          };

          // Solo incluir principal_clinic_id si no tiene PrincipalClinicInfo
          // (es decir, si está usando el selector)
          if (!this.hasPrincipalClinic()) {
            formData.principal_clinic_id = this.principalClinicControl.value;
          }

          const updatedUser = await this.userService.updateUserProfileAsync(
            userId,
            formData
          );

          // Recargar los datos del usuario para obtener PrincipalClinicInfo actualizado
          // Esto hará que si se guardó una clínica principal, ahora se muestre el campo de texto
          await this.userService.getUserProfileAsync(userId);
        }
      } catch (error) {
        console.error('Error saving user profile:', error);
      } finally {
        this.saveInProgress.set(false);
      }
    } else {
      // Marcar todos los campos como touched para mostrar errores
      this.configurationForm.markAllAsTouched();
    }
  }
}
