import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EphService, EphSettingsDTO } from '../services/eph.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-eph-settings',
  standalone: true,
  imports: [DatePipe, FormsModule, ReactiveFormsModule, CommonModule],
  providers: [DatePipe],
  templateUrl: './eph-settings.component.html',
  styleUrl: './eph-settings.component.css'
})
export class EphSettingsComponent implements OnInit {
  currentDate: string = '';
  isLoading: boolean = false;

  ephSettings: EphSettingsDTO = null;

  constructor(private datePipe: DatePipe, private ephService: EphService, private snackBar: MatSnackBar){}

  ephForm = new FormGroup({
    ephPrefix: new FormControl('EB', Validators.required),
    ephStartingNumber: new FormControl('', [Validators.required, Validators.pattern(/^\d{9}$/)]),
    ephEndingNumber: new FormControl('', [Validators.required, Validators.pattern(/^\d{9}$/)]),
    ephSuffix: new FormControl('SK', Validators.required)
  })

  saveEphSettings(): void {
    if(this.ephForm.valid){
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

          this.ephForm.reset();

          this.isLoading = false;
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

          this.isLoading = false;
        },
        error: (err) => {
          console.error("An error has occurred while trying to fetch EPH settings.", err);
          this.isLoading = false;
        }
      })
    }
  }
}
