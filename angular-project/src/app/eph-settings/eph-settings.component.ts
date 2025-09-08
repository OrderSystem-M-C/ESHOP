import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { EphService, EphSettingsDTO } from '../services/eph.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { SystemSettingsDTO, SystemSettingsService } from '../services/system-settings.service';
import { finalize, forkJoin, switchMap } from 'rxjs';

@Component({
  selector: 'app-eph-settings',
  standalone: true,
  imports: [DatePipe, FormsModule, ReactiveFormsModule, CommonModule, RouterLink],
  providers: [DatePipe],
  templateUrl: './eph-settings.component.html',
  styleUrl: './eph-settings.component.css'
})
export class EphSettingsComponent implements OnInit {
  currentDate: string = 'Načítava sa...';
  isLoading: boolean = false;

  ephSettings: EphSettingsDTO | null = null;
  systemSettings: SystemSettingsDTO | null = null;

  totalPackageCodes: number = 0;

  constructor(
    private datePipe: DatePipe, 
    private ephService: EphService, 
    private systemSettingsService: SystemSettingsService,
    private snackBar: MatSnackBar
  ){}

  mainForm = new FormGroup({
    ephForm: new FormGroup({
      ephPrefix: new FormControl('EB', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]),
      ephStartingNumber: new FormControl('', [Validators.required, Validators.pattern(/^\d{8}$/)]),
      ephEndingNumber: new FormControl('', [Validators.required, Validators.pattern(/^\d{8}$/)]),
      ephSuffix: new FormControl('SK', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]),
    }, { validators: this.endingNumberGreaterThanStarting.bind(this) }),
    systemSettingsForm: new FormGroup({
      deliveryFee: new FormControl(0, [Validators.required, Validators.min(0)]),
      paymentFee: new FormControl(0, [Validators.required, Validators.min(0)]),
      bankAccount: new FormControl('', [Validators.required, this.ibanValidator.bind(this)]),
    })
  });

  private endingNumberGreaterThanStarting(control: FormGroup){
    const startCtrl = control.get('ephStartingNumber');
    const endCtrl = control.get('ephEndingNumber');

    if (!startCtrl || !endCtrl) return null;

    const start = startCtrl.value;
    const end = endCtrl.value;

    if (startCtrl.invalid || endCtrl.invalid) {
      return null;
    }
    if (+end <= +start) {
      endCtrl.setErrors({ ...endCtrl.errors, endingNotGreater: true });
      return { endingNotGreater: true };
    } else {
      if (endCtrl.errors) {
        const { endingNotGreater, ...otherErrors } = endCtrl.errors;
        endCtrl.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
      }
      return null;
    }
  }
  private ibanValidator(control: AbstractControl): ValidationErrors | null {
    const iban = control.value?.replace(/\s+/g, '').toUpperCase() || '';
    if(!iban) return null;

    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
    if(!ibanRegex.test(iban)) return { iban: 'Neplatný formát IBAN' };

    const rearranged = iban.slice(4) + iban.slice(0, 4);
    const numbericIban = rearranged.replace(/[A-Z]/g, ch => (ch.charCodeAt(0) - 55).toString());

    const remainder = BigInt(numbericIban) % 97n;
    return remainder === 1n ? null : { iban: 'Neplatný IBAN' };
  }

  onIbanInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\s+/g, '').toUpperCase();
    value = value.match(/.{1,4}/g)?.join(' ') ?? value;
    input.value = value;
    this.mainForm.get('systemSettingsForm.bankAccount')?.setValue(value, { emitEvent: false });
  }

  saveSettings(): void {
    if (!this.mainForm.valid) {
      this.snackBar.open(
        "Zadané údaje nie sú správne alebo polia označené hviezdičkou boli vynechané!",
        "",
        { duration: 2000 }
      );
      this.mainForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const ephSettings: EphSettingsDTO = {
      ephPrefix: this.mainForm.value.ephForm.ephPrefix!,
      ephStartingNumber: Number(this.mainForm.value.ephForm.ephStartingNumber),
      ephEndingNumber: Number(this.mainForm.value.ephForm.ephEndingNumber),
      ephSuffix: this.mainForm.value.ephForm.ephSuffix!
    };

    const systemSettings: SystemSettingsDTO = this.mainForm.value.systemSettingsForm as SystemSettingsDTO;

    this.ephService.saveEphSettings(ephSettings).pipe(
      switchMap((savedEph) => {
        this.ephSettings = savedEph;
        return this.systemSettingsService.saveSystemSettings(systemSettings);
      }),
      switchMap((savedSystem) => {
        this.systemSettings = savedSystem;
        return this.ephService.countAvailablePackageCode();
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (countRes) => {
        this.totalPackageCodes = countRes.availableCount;
        this.snackBar.open("Všetky nastavenia boli úspešne uložené!", "", { duration: 2000 });
      },
      error: (err) => {
        console.error("Chyba pri ukladaní nastavení:", err);
        this.snackBar.open("Chyba pri ukladaní nastavení!", "", { duration: 2000 });
      }
    });
  }
  
  ngOnInit(): void {
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');

    this.isLoading = true;

    forkJoin({
      eph: this.ephService.getEphSettings(),
      system: this.systemSettingsService.getSystemSettings(),
      codes: this.ephService.countAvailablePackageCode()
    }).subscribe({
      next: ({ eph, system, codes }) => {
        this.ephSettings = eph;
        this.systemSettings = system;

        this.mainForm.get('ephForm').patchValue({
          ephPrefix: eph.ephPrefix,
          ephStartingNumber: String(eph.ephStartingNumber),
          ephEndingNumber: String(eph.ephEndingNumber),
          ephSuffix: eph.ephSuffix
        });

        this.mainForm.get('systemSettingsForm')?.patchValue(system);
        this.totalPackageCodes = codes.availableCount;
      },
      error: (err) => console.error("Chyba pri načítaní nastavení:", err),
      complete: () => this.isLoading = false
    });
  }
}
