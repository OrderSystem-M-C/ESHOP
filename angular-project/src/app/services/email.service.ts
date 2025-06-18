import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(private http: HttpClient, @Inject('BASE_URL') private baseUrl: string) { }

  sendPackageCodeEmails(emailDtos: EmailDTO[]){
    const url = `${this.baseUrl}/email/send-package-code-emails`;
    return this.http.post(url, emailDtos);
  }
  sendOrderConfirmationEmails(emailDtos: EmailDTO[]){
    const url = `${this.baseUrl}/email/send-order-confirmation-emails`;
    return this.http.post(url, emailDtos);
  }
}
export interface EmailDTO {
  email: string;
  orderId: number;
  packageCode?: string;
}
