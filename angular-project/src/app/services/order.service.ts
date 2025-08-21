import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { ProductDTO } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly baseEndpoint = 'order';
  private readonly jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(@Inject('BASE_URL') private baseUrl: string, private http: HttpClient) { }

  createOrder(order: OrderDTO): Observable<OrderDTO> {
    return this.post<OrderDTO>('create-order', order);
  }
  getOrders(): Observable<OrderDTO[]> {
    return this.get<OrderDTO[]>('get-orders');
  }
  getOrderDetails(orderId: number): Observable<OrderDTO> {
    return this.get<OrderDTO>(`get-order-details/${orderId}`);
  }
  deleteOrder(rowId: number): Observable<void> {
    return this.delete<void>(`delete-order/${rowId}`);
  }
  updateOrder(orderId: number, order: OrderDTO): Observable<OrderDTO> {
    return this.put<OrderDTO>(`update-order/${orderId}`, order);
  }
  copyOrders(orderIds: number[], currentDate: string): Observable<void> {
    return this.post<void>('copy-orders', { OrderIds: orderIds, OrderDate: currentDate });
  }
  changeOrderStatus(orderIds: number[], orderStatus: string): Observable<any> {
    return this.put<any>('change-order-status', { OrderIds: orderIds, OrderStatus: orderStatus });
  }
  removeSelectedOrders(orderIds: number[]): Observable<any> {
    return this.delete<any>('remove-selected-orders', { orderIds });
  }
  getOrdersXmlFile(orderIds: number[]): Observable<ExportXmlResponseDTO> {
    return this.post<ExportXmlResponseDTO>('export-orders-to-xml', { OrderIds: orderIds });
  }
  getOrderStatuses(): Observable<OrderStatusDTO[]> {
    return this.get<OrderStatusDTO[]>('get-order-statuses');
  }
  saveOrderStatusesSortOrder(statuses: OrderStatusDTO[]): Observable<void> { // *
    return this.put<void>('save-order-statuses-sort-order', statuses);
  }
  addOrderStatus(status: OrderStatusDTO): Observable<OrderStatusDTO> {
    return this.post<OrderStatusDTO>('add-order-status', status);
  }
  deleteOrderStatus(statusId: number): Observable<void> {
    return this.delete<void>(`delete-order-status/${statusId}`);
  }
  updateOrderStatus(status: OrderStatusDTO): Observable<OrderStatusDTO> {
    return this.put<OrderStatusDTO>('update-order-status', status);
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

  private put<T>(endpoint: string, body: any): Observable<T> {
    const url = `${this.baseUrl}/${this.baseEndpoint}/${endpoint}`;
    return this.http.put<T>(url, body, { headers: this.jsonHeaders }).pipe(
      catchError(err => {
        console.error(`PUT ${url} failed:`, err);
        return throwError(() => err);
      })
    );
  }

  private delete<T>(endpoint: string, body?: any): Observable<T> {
    const url = `${this.baseUrl}/${this.baseEndpoint}/${endpoint}`;
    return this.http.delete<T>(url, { body }).pipe(
      catchError(err => {
        console.error(`DELETE ${url} failed:`, err);
        return throwError(() => err);
      })
    );
  }
}
export interface OrderDTO {
  id?: number;
  orderId: number;
  customerName: string;
  company?: string;
  ico?: string;
  dic?: string;
  icDph?: string;
  address: string;
  city: string;
  postalCode: string;
  email: string;
  phoneNumber: string;
  note?: string;
  deliveryOption: string;
  deliveryCost: number;
  paymentOption: string;
  paymentCost: number;
  discountAmount?: number;
  orderStatus: string;
  orderDate?: string;
  totalPrice: number;
  invoiceNumber: string;
  variableSymbol: string;
  invoiceIssueDate: string; 
  invoiceName: string;
  invoiceCompany?: string; 
  invoiceICO?: string; 
  invoiceDIC?: string;
  invoiceEmail: string;
  invoicePhoneNumber: string;
  orderSelected?: boolean;
  packageCode?: string;
}
export interface ExportXmlResponseDTO {
  fileContentBase64: string;
  fileName: string;
  generatedCodes: { [key: number]: string };
}
export interface OrderStatusDTO {
  statusId?: number;
  statusName: string;
  sortOrder?: number;
  statusColor: string;
}