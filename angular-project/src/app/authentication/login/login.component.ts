import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthenticationService } from '../authentication.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RecaptchaModule } from 'ng-recaptcha';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ MatButton, MatFormField, MatInput, MatLabel, ReactiveFormsModule, AsyncPipe, CommonModule, RecaptchaModule ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  authService = inject(AuthenticationService);
  private router = inject(Router);

  siteKey: string | null = null;

  isLogging: boolean = false;

  constructor(private snackBar: MatSnackBar){}

  loginForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email, this.emailValidator]),
    password: new FormControl('', Validators.required),
    recaptchaResponse: new FormControl(null, Validators.required)
  });

  onCaptchaResolved(event: any){
    this.loginForm.patchValue({
      recaptchaResponse: event
    })
  }

  login() {
    if (this.loginForm.valid) {
      this.isLogging = true;
      this.authService.loginUser({...this.loginForm.value}).subscribe({
        next: (response) => {
          if(response.isAuthSuccessful){
            this.authService.storeUserCredentials(response.token, response.username);
            this.router.navigate(['/orders-page']);
          }
        },
        error: (err) => {
          console.error(err?.errorMessage || err);
          this.snackBar.open("E-mailová adresa alebo heslo nie sú správne!", "", { duration: 3000 });
          this.loginForm.reset();
          this.validateAllFormFields(this.loginForm);
          this.isLogging = false;
        }
      });
    }else {
      this.validateAllFormFields(this.loginForm);
      
      if(!this.loginForm.get('recaptchaResponse')?.value){
        this.snackBar.open("Zabudli ste na overenie reCAPTCHA!", "", { duration: 3000 });
      }else{
        this.snackBar.open("Zadané údaje nie sú správne alebo polia označené hviezdičkou boli vynechané!", "", { duration: 3000 });
      }
    }
  }

  private setDefaultFeesInLocalStorage(): void {
    if (!localStorage.getItem('deliveryFee')) {
      localStorage.setItem('deliveryFee', '5');
    }
    if (!localStorage.getItem('paymentFee')) {
      localStorage.setItem('paymentFee', '1.50');
    }
  }

  validateAllFormFields(formGroup: FormGroup){
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if(control?.invalid){
        control.markAsTouched(); 
      }
    })
  }
  emailValidator(control: FormControl) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    if (control.value && !emailRegex.test(control.value)) {
      return { invalidEmail: true };
    }
    return null;
  }

  ngOnInit(): void {
    document.body.classList.add('login-layout');
    document.body.classList.remove('default-layout');

    this.setDefaultFeesInLocalStorage();

    this.authService.getRecaptchaSiteKey().subscribe({
      next: (response) => {
        this.siteKey = response;
      },
      error: (err) => console.error('Error getting site key:', err)
    })
  }

  ngOnDestroy() {
    document.body.classList.remove('login-layout');
    document.body.classList.add('default-layout');
  }
}
