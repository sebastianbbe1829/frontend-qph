import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SaleRequest, SaleResponse } from '../../shared/models/sale.model';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly apiUrl = 'http://localhost:8080/api/sales';

  constructor(private http: HttpClient) {}

  create(sale: SaleRequest): Observable<SaleResponse> {
    return this.http.post<SaleResponse>(this.apiUrl, sale);
  }
}
