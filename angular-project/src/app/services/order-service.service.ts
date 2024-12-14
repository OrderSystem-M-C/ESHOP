import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OrderServiceService {

  constructor(@Inject('BASE_URL') private baseUrl: string) { }

  createOrder() {
    
  }
}
