import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(private http: HttpClient, @Inject('BASE_URL') private baseUrl: string) { }

  sendPackageCodeEmails(emailDtos: PackageCodeEmailDTO[]){
    const url = `${this.baseUrl}/email/send-package-code-email`;
    return this.http.post(url, emailDtos);
  }
}
export interface PackageCodeEmailDTO {
  email: string;
  orderId: number;
  packageCode: string;
}
