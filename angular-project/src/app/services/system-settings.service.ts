import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SystemSettingsService {
  private readonly baseEndpoint = 'systemSettings';
  private readonly jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(@Inject('BASE_URL') private baseUrl: string, private http: HttpClient) { }

  getSystemSettings(): Observable<SystemSettingsDTO> {
    return this.get<SystemSettingsDTO>('get-system-settings');
  }

  saveSystemSettings(settings: SystemSettingsDTO): Observable<SystemSettingsDTO> {
    return this.post<SystemSettingsDTO>('save-system-settings', settings)
  }

  private get<T>(endpoint: string): Observable<T> {
    const url = `${this.baseUrl}/${this.baseEndpoint}/${endpoint}`;
    return this.http.get<T>(url).pipe(
      catchError(err => {
        console.error(`GET ${url} failed:`, err);
        return throwError(() => err);
      })
    );
  }

  private post<T>(endpoint: string, body: any): Observable<T> {
    const url = `${this.baseUrl}/${this.baseEndpoint}/${endpoint}`;
    return this.http.post<T>(url, body, { headers: this.jsonHeaders }).pipe(
      catchError(err => {
        console.error(`POST ${url} failed:`, err);
        return throwError(() => err);
      })
    );
  }
}

export interface SystemSettingsDTO {
  systemSettingsId?: number;
  deliveryFee: number;
  paymentFee: number;
  bankAccount: string;
}
