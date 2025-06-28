import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EphService {

  constructor(private http: HttpClient, @Inject('BASE_URL') private baseUrl: string) { }

  saveEphSettings(ephSettings: EphSettingsDTO): Observable<EphSettingsDTO>{
    const url = `${this.baseUrl}/order/save-eph-settings`;
    return this.http.post<EphSettingsDTO>(url, ephSettings);
  }
  getEphSettings(): Observable<EphSettingsDTO>{
    const url = `${this.baseUrl}/order/get-eph-settings`;
    return this.http.get<EphSettingsDTO>(url);
  }
  generatePackageCode(): Observable<any>{
    const url = `${this.baseUrl}/order/generate-package-code`;
    return this.http.get<any>(url);
  }
  validatePackageCode(packageCode: string): Observable<any>{
    const url = `${this.baseUrl}/order/validate-package-code/${packageCode}`;
    return this.http.get<any>(url);
  }
  countAvailablePackageCode(): Observable<any>{
    const url = `${this.baseUrl}/order/count-available-package-codes`;
    return this.http.get<any>(url);
  }
}
export interface EphSettingsDTO {
  ephPrefix: string;
  ephStartingNumber: number;
  ephEndingNumber: number;
  ephSuffix: string;
}