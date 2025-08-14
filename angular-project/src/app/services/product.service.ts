import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(@Inject('BASE_URL') private baseUrl: string, private http: HttpClient) { }

  createProduct(product: ProductDTO){
    const url = `${this.baseUrl}/product/create-product`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(url, product, {headers});
  }
  getProducts(): Observable<ProductDTO[]>{
    const url = `${this.baseUrl}/product/get-products`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<ProductDTO[]>(url, {headers});
  }
  removeProduct(productId: number){
    const url = `${this.baseUrl}/product/remove-product/${productId}`;
    return this.http.delete(url);
  }
  updateProduct(updates: ProductUpdateDTO[]) {
    const url = `${this.baseUrl}/product/update-product`;
    return this.http.put(url, updates);
  }
  updateProductPrice(orderId: number, updates: ProductUpdateDTO[]): Observable<any> {
    const url = `${this.baseUrl}/product/update-order-product-price/${orderId}`;
    return this.http.put<any>(url, updates);
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
