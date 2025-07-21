import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EphService, EphSettingsDTO } from '../services/eph.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-eph-settings',
  standalone: true,
  imports: [DatePipe, FormsModule, ReactiveFormsModule, CommonModule, RouterLink],
  providers: [DatePipe],
  templateUrl: './eph-settings.component.html',
  styleUrl: './eph-settings.component.css'
})
export class EphSettingsComponent implements OnInit {
  currentDate: string = '';
  isLoading: boolean = false;

  ephSettings: EphSettingsDTO | null = null;

  totalPackageCodes: number = 0;

  deliveryFeeFromStorage = signal<number | null>(null);
  paymentFeeFromStorage = signal<number | null>(null);

  constructor(private datePipe: DatePipe, private ephService: EphService, private snackBar: MatSnackBar){}

  ephForm = new FormGroup({
    ephPrefix: new FormControl('EB', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]),
    ephStartingNumber: new FormControl('', [Validators.required, Validators.pattern(/^\d{8}$/)]),
    ephEndingNumber: new FormControl('', [Validators.required, Validators.pattern(/^\d{8}$/)]),
    ephSuffix: new FormControl('SK', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]),
  }, {
    validators: this.endingNumberGreaterThanStarting
  });
  
  settingsForm = new FormGroup({
    deliveryFee: new FormControl(0, [Validators.required, Validators.min(0)]),
    paymentFee: new FormControl(0, [Validators.required, Validators.min(0)])
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

  saveSettings(): void {
    if(this.ephForm.valid && this.settingsForm.valid){
      this.isLoading = true;
      const ephSettings: EphSettingsDTO = {
         ephPrefix: this.ephForm.value.ephPrefix,
         ephStartingNumber: Number(this.ephForm.value.ephStartingNumber),
         ephEndingNumber: Number(this.ephForm.value.ephEndingNumber),
         ephSuffix: this.ephForm.value.ephSuffix
      }
      this.ephService.saveEphSettings(ephSettings).subscribe({
        next: (response) => {
          this.snackBar.open("Nastavenia EPH boli úspešne uložené!", "", {
            duration: 2000
          });

          this.ephSettings = response;

          const { deliveryFee, paymentFee } = this.settingsForm.value;
          localStorage.setItem('deliveryFee', (deliveryFee).toString());
          localStorage.setItem('paymentFee', (paymentFee).toString());

          this.deliveryFeeFromStorage.update(value => Number(deliveryFee));
          this.paymentFeeFromStorage.update(value => Number(paymentFee));

          this.ephService.countAvailablePackageCode().subscribe({
            next: (response) => {
              this.totalPackageCodes = response.availableCount;
              this.isLoading = false;
            },
            error: (err) => {
              console.error(err);
              this.isLoading = false;
            }
          })
        },
        error: (err) => {
          console.error("An error has occurred while trying to save EPH settings.", err);
          this.isLoading = false;
        }
      })
    }else{
      this.snackBar.open("Zadané údaje nie sú správne alebo polia označené hviezdičkou boli vynechané!", "", {
        duration: 2000
      });
      this.ephForm.markAllAsTouched();
    }
  }
  
  ngOnInit(): void {
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');

    if(!this.ephSettings){
      this.isLoading = true;
      this.ephService.getEphSettings().subscribe({
        next: (response) => {
          this.ephSettings = response;

          this.ephForm.patchValue({
            ephPrefix: this.ephSettings.ephPrefix,
            ephStartingNumber: String(this.ephSettings.ephStartingNumber),
            ephEndingNumber: String(this.ephSettings.ephEndingNumber),
            ephSuffix: this.ephSettings.ephSuffix
          })

          this.deliveryFeeFromStorage.set(Number(localStorage.getItem('deliveryFee')));
          this.paymentFeeFromStorage.set(Number(localStorage.getItem('paymentFee')));

          this.settingsForm.patchValue({
            deliveryFee: this.deliveryFeeFromStorage() || 0,
            paymentFee: this.paymentFeeFromStorage() || 0
          })

          this.ephService.countAvailablePackageCode().subscribe({
            next: (response) => {
              this.totalPackageCodes = response.availableCount;
              this.isLoading = false;
            },
            error: (err) => console.error(err)
          });
        },
        error: (err) => {
          console.error("An error has occurred while trying to fetch EPH settings.", err);
          this.isLoading = false;
        }
      })
    }
  }
}
