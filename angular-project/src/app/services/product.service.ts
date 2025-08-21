import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseEndpoint = 'product';
  private readonly jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(@Inject('BASE_URL') private baseUrl: string, private http: HttpClient) { }

  createProduct(product: ProductDTO): Observable<ProductDTO> {
    return this.post<ProductDTO>('create-product', product);
  }
  getProducts(): Observable<ProductDTO[]> {
    return this.get<ProductDTO[]>('get-products');
  }
  getOrderProducts(orderId: number): Observable<ProductDTO[]> {
    return this.get<ProductDTO[]>(`get-order-products/${orderId}`);
  }
  removeProduct(productId: number): Observable<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`remove-product/${productId}`);
  }
  updateProduct(updates: ProductUpdateDTO[]): Observable<void> {
    return this.put<void>('update-product', updates);
  }
  updateProductPrice(orderId: number, updates: ProductUpdateDTO[]): Observable<{ totalPrice: number }> {
    return this.put<{ totalPrice: number }>(`update-order-product-price/${orderId}`, updates);
  }
  addProductsToOrder(orderId: number, products: ProductDTO[]): Observable<HttpResponse<any>> {
    return this.postWithResponse('add-products-to-order', { orderId, products });
  }
  updateOrderProducts(orderId: number, products: ProductDTO[]): Observable<HttpResponse<any>> {
    return this.putWithResponse('update-order-products', { orderId, products });
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

  private postWithResponse(endpoint: string, body: any): Observable<HttpResponse<any>> {
    const url = `${this.baseUrl}/${this.baseEndpoint}/${endpoint}`;
    return this.http.post(url, body, { headers: this.jsonHeaders, observe: 'response' }).pipe(
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

  private putWithResponse(endpoint: string, body: any): Observable<HttpResponse<any>> {
    const url = `${this.baseUrl}/${this.baseEndpoint}/${endpoint}`;
    return this.http.put(url, body, { headers: this.jsonHeaders, observe: 'response' }).pipe(
      catchError(err => {
        console.error(`PUT ${url} failed:`, err);
        return throwError(() => err);
      })
    );
  }

  private delete<T>(endpoint: string): Observable<T> {
    const url = `${this.baseUrl}/${this.baseEndpoint}/${endpoint}`;
    return this.http.delete<T>(url).pipe(
      catchError(err => {
        console.error(`DELETE ${url} failed:`, err);
        return throwError(() => err);
      })
    );
  }
}

export interface ProductDTO {
  productId?: number;
  productName: string,
  productDescription?: string,
  productPrice: number,
  productWeight?: number,
  productSelected?: boolean;
  productAmount?: number;
  stockAmount?: number;
  productCode?: number;
}

export interface ProductUpdateDTO {
  productId: number;
  productName?: string;
  productDescription?: string;
  productPrice?: number;
  productWeight?: number;
  stockAmount?: number;
  productCode?: number;
}
