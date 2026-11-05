import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product';

describe('ProductService', () => {
  let service: ProductService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ProductService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('requests a server-filtered, sorted page of products', () => {
    service.getAll(1, 10, 'nombre', 'DESC', 'teclado').subscribe((response) => {
      expect(response.content).toEqual([]);
      expect(response.totalElements).toBe(0);
    });

    const request = httpTestingController.expectOne(
      (req) => req.url.endsWith('/products')
    );
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.get('sort')).toBe('nombre');
    expect(request.request.params.get('direction')).toBe('DESC');
    expect(request.request.params.get('search')).toBe('teclado');
    request.flush({
      content: [],
      page: 1,
      size: 10,
      totalElements: 0,
      totalPages: 0,
      first: false,
      last: true
    });
  });
});
