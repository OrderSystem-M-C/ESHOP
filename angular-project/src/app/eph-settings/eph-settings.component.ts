import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-eph-settings',
  standalone: true,
  imports: [DatePipe, FormsModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './eph-settings.component.html',
  styleUrl: './eph-settings.component.css'
})
export class EphSettingsComponent implements OnInit {
  currentDate: string = '';

  constructor(private datePipe: DatePipe){}

  ephForm = new FormGroup({
    ephPrefix: new FormControl('EB', Validators.required),
    ephStartingNumber: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    ephEndingNumber: new FormControl('', [Validators.required, Validators.pattern(/^\d+$/)]),
    ephSuffix: new FormControl('SK', Validators.required)
  })

  ngOnInit(): void {
    const now = new Date();
    this.currentDate = this.datePipe.transform(now, 'dd.MM.yyyy HH:mm:ss');
  }
}
