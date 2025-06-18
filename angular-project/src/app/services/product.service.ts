import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { ProductDTO } from '../products-page/products-page.component';
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
  updateProductStockAmount(updates: ProductStockUpdateDTO[]){
    const url = `${this.baseUrl}/product/update-stock-batch`;
    return this.http.put(url, updates);
  }
}
export interface ProductStockUpdateDTO {
  productId: number;
  stockAmount: number;
}
