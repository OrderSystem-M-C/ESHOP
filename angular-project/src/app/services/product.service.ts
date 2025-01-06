import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { ProductDTO } from '../products-page/products-page.component';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(@Inject('BASE_URL') private baseUrl: string, private http: HttpClient) { }

  createProduct(product: ProductDTO){
    const url = `${this.baseUrl}/order/create-product`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(url, product, {headers});
  }
}
