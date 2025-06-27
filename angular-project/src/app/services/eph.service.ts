import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EphService {

  constructor() { }
}
export interface EphSettingsDTO {
  ephPrefix: string;
  ephStartingNumber: number;
  ephEndingNumber: number;
  ephSuffix: string;
}