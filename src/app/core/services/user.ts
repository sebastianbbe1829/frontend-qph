import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserCreateRequest, UserResponse } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  create(user: UserCreateRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, user);
  }
}
