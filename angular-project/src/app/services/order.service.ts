import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { OrderDTO, OrderStatusDTO } from '../order-form/order-form.component';
import { Observable } from 'rxjs';
import { ProductDTO } from '../products-page/products-page.component';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(@Inject('BASE_URL') private baseUrl: string, private http: HttpClient) { }

  createOrder(order: OrderDTO){
    const url = `${this.baseUrl}/order/create-order`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(url, order, {headers});
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
  deleteOrder(rowId: number){
    const url = `${this.baseUrl}/order/delete-order/${rowId}`;
    return this.http.delete(url);
  }
  updateOrder(orderId: number, order: OrderDTO): Observable<any>{
    const url = `${this.baseUrl}/order/update-order/${orderId}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(url, order, {headers, responseType: 'json'}); //znamena ze Angular bude ocakavat textovu spravu a nie JSON takze sa spravne spracuje
  }
  addProductsToOrder(orderId: number, products: ProductDTO[]): Observable<HttpResponse<any>>{
    const url = `${this.baseUrl}/product/add-products`;
    const body = {
      orderId, 
      products
    }
    return this.http.post(url, body, { observe: 'response' });
  }
  getOrderProducts(orderId: number){
    const url = `${this.baseUrl}/product/get-products/${orderId}`;
    return this.http.get<ProductDTO[]>(url);
  }
  updateOrderProducts(orderId: number, products: ProductDTO[]){
    const url = `${this.baseUrl}/product/update-products`;
    const body = {
      orderId, 
      products
    }
    return this.http.put(url, body, { observe: 'response' });
  }
  copyOrders(orderIds: number[], currentDate: string){
    const url = `${this.baseUrl}/order/copy-orders`;
    const body = {
      OrderIds: orderIds,
      OrderDate: currentDate
    }
    return this.http.post(url, body);
  }
  changeOrderStatus(orderIds: number[], orderStatus: string){
    const url = `${this.baseUrl}/order/change-order-status`;
    let body = {
      OrderIds: orderIds,
      OrderStatus: orderStatus
    }
    return this.http.put(url, body);
  }
  removeSelectedOrders(orderIds: number[]){
    const url = `${this.baseUrl}/order/remove-selected-orders`;
    let body = {
      OrderIds: orderIds
    };
    return this.http.delete(url, {
      body: body
    });
  }
  getOrdersXmlFile(orderIds: number[]){
    const url = `${this.baseUrl}/order/export-orders-to-xml`;
    let body = {
      OrderIds: orderIds
    }
    return this.http.post(url, body, { responseType: 'blob' });
  }
  getOrderStatuses(): Observable<OrderStatusDTO[]>{
    const url = `${this.baseUrl}/order/get-order-statuses`;
    return this.http.get<OrderStatusDTO[]>(url);
  }
  saveOrderStatusesSortOrder(statuses: OrderStatusDTO[]) {
    const url = `${this.baseUrl}/order/save-order-statuses-sort-order`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(url, statuses, { headers: headers });
  }
}
