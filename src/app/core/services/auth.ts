import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthRequest, AuthResponse } from '../../shared/models/auth.model';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = 'jwt_token';
  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: AuthRequest): Observable<AuthResponse> {
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => localStorage.setItem(this.TOKEN_KEY, response.token))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return this.getTokenPayload() !== null;
  }

  hasRole(role: string): boolean {
    const roles: unknown = this.getTokenPayload()?.['roles'];
    return Array.isArray(roles) && roles.includes(role);
  }

  private getTokenPayload(): Record<string, unknown> | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return null;
      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(normalized)) as Record<string, unknown>;
      return typeof payload['exp'] === 'number' && payload['exp'] * 1000 > Date.now()
        ? payload
        : null;
    } catch {
      return null;
    }
  }
}