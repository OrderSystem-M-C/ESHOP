import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { OrderDTO } from '../order-form/order-form.component';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(@Inject('BASE_URL') private baseUrl: string, private http: HttpClient) { }

  createOrder(order: OrderDTO){
    const url = `${this.baseUrl}/order/create-order`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(url, order, {headers});
  }
  getOrders(): Observable<OrderDTO[]>{
    const url = `${this.baseUrl}/order/get-orders`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<OrderDTO[]>(url, {headers});
  }
  getOrderDetails(orderId: number){
    const url = `${this.baseUrl}/order/get-order-details/${orderId}`;
    return this.http.get<OrderDTO>(url);
  }
}
