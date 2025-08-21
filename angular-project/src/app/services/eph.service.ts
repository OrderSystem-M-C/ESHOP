import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EphService {
  private readonly baseEndpoint = 'order';

  constructor(private http: HttpClient, @Inject('BASE_URL') private baseUrl: string) { }

  saveEphSettings(ephSettings: EphSettingsDTO): Observable<EphSettingsDTO> {
    return this.post<EphSettingsDTO>('save-eph-settings', ephSettings);
  }
  getEphSettings(): Observable<EphSettingsDTO> {
    return this.get<EphSettingsDTO>('get-eph-settings');
  }
  generatePackageCode(): Observable<any> {
    return this.get<any>('generate-package-code');
  }
  validatePackageCode(packageCode: string): Observable<any> {
    return this.get<any>(`validate-package-code/${packageCode}`);
  }
  countAvailablePackageCode(): Observable<{ availableCount: number }> {
    return this.get<any>('count-available-package-codes').pipe(
      map(response => ({ availableCount: response.availableCount ?? 0}))
    );
  }

  private get<T>(endpoint: string): Observable<T> {
    const url = `${this.baseUrl}/${this.baseEndpoint}/${endpoint}`;
    return this.http.get<T>(url).pipe(
      catchError(error => {
        console.error(`GET ${url} failed:`, error);
        return throwError(() => error);
      })
    );
  }

  private post<T>(endpoint: string, body: any): Observable<T> {
    const url = `${this.baseUrl}/${this.baseEndpoint}/${endpoint}`;
    return this.http.post<T>(url, body).pipe(
      catchError(error => {
        console.error(`POST ${url} failed:`, error);
        return throwError(() => error);
      })
    );
  }
}
export interface EphSettingsDTO {
  ephPrefix: string;
  ephStartingNumber: number;
  ephEndingNumber: number;
  ephSuffix: string;
}