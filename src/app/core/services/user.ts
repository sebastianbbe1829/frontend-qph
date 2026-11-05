import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserCreateRequest, UserResponse } from '../../shared/models/user.model';
import { PageResponse } from '../../shared/models/page.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(
    page = 0,
    size = 20,
    sort = 'id',
    direction: 'ASC' | 'DESC' = 'ASC',
    search = ''
  ): Observable<PageResponse<UserResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort)
      .set('direction', direction)
      .set('search', search);
    return this.http.get<PageResponse<UserResponse>>(this.apiUrl, { params });
  }

  create(user: UserCreateRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, user);
  }
}
