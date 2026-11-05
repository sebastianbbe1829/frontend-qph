import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user';

describe('UserService', () => {
  let service: UserService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(UserService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('requests a server-filtered, sorted page of users', () => {
    service.getAll(2, 50, 'username', 'DESC', 'admin').subscribe((response) => {
      expect(response.content).toEqual([]);
      expect(response.totalElements).toBe(0);
    });

    const request = httpTestingController.expectOne(
      (req) => req.url.endsWith('/users')
    );
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('50');
    expect(request.request.params.get('sort')).toBe('username');
    expect(request.request.params.get('direction')).toBe('DESC');
    expect(request.request.params.get('search')).toBe('admin');
    request.flush({
      content: [],
      page: 2,
      size: 50,
      totalElements: 0,
      totalPages: 0,
      first: false,
      last: true
    });
  });
});
