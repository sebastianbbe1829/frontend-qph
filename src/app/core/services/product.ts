import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../shared/models/product.model';
import { PageResponse } from '../../shared/models/page.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {

  private readonly apiUrl = `${environment.apiBaseUrl}/products`;

  constructor(private http: HttpClient) {}

  getAll(
    page = 0,
    size = 20,
    sort = 'id',
    direction: 'ASC' | 'DESC' = 'ASC',
    search = ''
  ): Observable<PageResponse<Product>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort)
      .set('direction', direction)
      .set('search', search);
    return this.http.get<PageResponse<Product>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  create(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  update(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}