import {
  HttpErrorResponse,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../services/auth';
import { jwtInterceptor } from './jwt-interceptor';

describe('jwtInterceptor', () => {
  const authService = {
    getToken: vi.fn(),
    logout: vi.fn()
  };
  const router = {
    navigate: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authService.getToken.mockReturnValue('session-token');
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('does not send a saved token or log out after invalid login credentials', () => {
    const request = new HttpRequest(
      'POST',
      'http://localhost:8080/api/auth/login',
      { username: 'admin', password: 'wrong-password' }
    );
    const forwardedRequests: HttpRequest<unknown>[] = [];
    const next = (forwarded: HttpRequest<unknown>) => {
      forwardedRequests.push(forwarded);
      return throwError(() => new HttpErrorResponse({ status: 401 }));
    };

    TestBed.runInInjectionContext(() =>
      jwtInterceptor(request, next).subscribe({ error: () => undefined })
    );

    expect(forwardedRequests[0]?.headers.has('Authorization')).toBe(false);
    expect(authService.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('attaches the saved token to protected API requests', () => {
    const request = new HttpRequest('GET', 'http://localhost:8080/api/products');
    const forwardedRequests: HttpRequest<unknown>[] = [];
    const next = (forwarded: HttpRequest<unknown>) => {
      forwardedRequests.push(forwarded);
      return of(new HttpResponse());
    };

    TestBed.runInInjectionContext(() =>
      jwtInterceptor(request, next).subscribe()
    );

    expect(forwardedRequests[0]?.headers.get('Authorization')).toBe(
      'Bearer session-token'
    );
  });

  it('clears the session after an unauthorized protected request', () => {
    const request = new HttpRequest('GET', 'http://localhost:8080/api/products');
    const next = () =>
      throwError(() => new HttpErrorResponse({ status: 401 }));

    TestBed.runInInjectionContext(() =>
      jwtInterceptor(request, next).subscribe({ error: () => undefined })
    );

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
