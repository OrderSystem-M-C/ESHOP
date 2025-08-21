import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(private http: HttpClient, @Inject('BASE_URL') private baseUrl: string) { }

  sendPackageCodeEmails(emailDtos: EmailDTO[]): Observable<string> {
    return this.postEmail('send-package-code-emails', emailDtos);
  }
  sendOrderConfirmationEmails(emailDtos: EmailDTO[]): Observable<string> {
    return this.postEmail('send-order-confirmation-emails', emailDtos);
  }

  private postEmail(endpoint: string, emailDtos: EmailDTO[]): Observable<string> {
    const url = `${this.baseUrl}/email/${endpoint}`;
    return this.http.post(url, emailDtos, { responseType: 'text'}).pipe(
      catchError(error => {
        console.error(`Email API error at endpoint "${endpoint}":`, error);
        return throwError(() => error);
      })
    )
  }
}

export interface EmailDTO {
  email: string;
  orderId: number;
  packageCode?: string;
}
