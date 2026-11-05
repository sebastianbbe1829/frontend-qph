import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../core/services/product';
import { SaleService } from '../../../core/services/sale';
import { AuthService } from '../../../core/services/auth';
import { Product } from '../../../shared/models/product.model';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, of, switchMap, timer } from 'rxjs';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmationService, MessageService } from 'primeng/api';

interface SaleCartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    ConfirmDialogModule,
    DialogModule,
    ToastModule,
    ToolbarModule,
    TooltipModule,
    InputTextModule,
    InputNumberModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.scss']
})
export class ProductListComponent implements OnInit {

  private productService = inject(ProductService);
  private saleService = inject(SaleService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  products: Product[] = [];
  loading = false;
  isAdmin = this.authService.hasRole('ROLE_ADMIN');
  individualLookupMode = false;
  lookupLoading = false;
  lookupMessage = 'Ingresa el ID del producto para consultar sus datos';
  lookupForm = this.fb.group({
    id: [null as number | null, [Validators.required, Validators.min(1)]]
  });
  sellingProductIds = new Set<number>();
  saleDialogVisible = false;
  saleCart: SaleCartItem[] = [];

  ngOnInit(): void {
    this.lookupForm.controls.id.valueChanges.pipe(
      switchMap((id) => {
        this.products = [];
        this.lookupMessage = id === null
          ? 'Ingresa el ID del producto para consultar sus datos'
          : 'Buscando producto...';
        this.lookupLoading = false;

        if (id === null || !Number.isInteger(id) || id < 1) {
          return of(null);
        }

        return timer(350).pipe(
          switchMap(() => {
            this.lookupLoading = true;
            return this.productService.getById(id).pipe(
              catchError((error: unknown) => {
                if (error instanceof HttpErrorResponse && error.status === 404) {
                  this.lookupMessage = `No existe un producto con el ID ${id}.`;
                } else {
                  this.lookupMessage = 'No se pudo consultar el producto.';
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Error de consulta',
                    detail: 'No se pudo consultar el producto. Verifica tu acceso e inténtalo de nuevo.'
                  });
                }
                return of(null);
              }),
              finalize(() => {
                this.lookupLoading = false;
              })
            );
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((product) => {
      this.products = product ? [product] : [];
      if (product) {
        this.lookupMessage = `Producto encontrado: ${product.nombre}`;
      }
    });
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loading = false;
        this.handleProductsLoadError(error);
      }
    });
  }

  private handleProductsLoadError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 403) {
      this.individualLookupMode = true;
      this.products = [];
      return;
    }

    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los productos'
    });
  }

  goToCreate(): void {
    this.router.navigate(['/products/new']);
  }

  goToCreateUser(): void {
    this.router.navigate(['/users/new']);
  }

  goToEdit(id: number): void {
    this.router.navigate(['/products/edit', id]);
  }

  confirmDelete(product: Product): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar "${product.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteProduct(product.id!)
    });
  }

  addProductToSale(product: Product): void {
    if (product.id === undefined || product.stock <= 0) {
      return;
    }

    const existing = this.saleCart.find((item) => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Stock máximo',
          detail: `Ya agregaste todas las unidades disponibles de "${product.nombre}".`
        });
        return;
      }
      existing.quantity += 1;
    } else {
      this.saleCart = [...this.saleCart, { product, quantity: 1 }];
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Producto agregado',
      detail: `${product.nombre} está en la venta.`
    });
  }

  get saleCartTotal(): number {
    return this.saleCart.reduce(
      (total, item) => total + item.product.precio * item.quantity,
      0
    );
  }

  updateCartQuantity(productId: number | undefined, quantity: number | null): void {
    if (productId === undefined || quantity === null || !Number.isInteger(quantity) || quantity < 1) {
      return;
    }
    this.saleCart = this.saleCart.map((item) =>
      item.product.id === productId
        ? { ...item, quantity: Math.min(quantity, item.product.stock) }
        : item
    );
  }

  removeFromSale(productId: number | undefined): void {
    this.saleCart = this.saleCart.filter((item) => item.product.id !== productId);
  }

  openSaleDialog(): void {
    if (this.saleCart.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Venta vacía',
        detail: 'Agrega al menos un producto antes de continuar.'
      });
      return;
    }
    this.saleDialogVisible = true;
  }

  isSelling(productId: number | undefined): boolean {
    return productId !== undefined && this.sellingProductIds.has(productId);
  }

  get isSaleSubmitting(): boolean {
    return this.sellingProductIds.size > 0;
  }

  submitSale(): void {
    if (this.saleCart.length === 0 || this.saleCart.some((item) =>
      item.product.id === undefined ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > item.product.stock
    )) {
      return;
    }

    if (this.saleCart.some((item) => this.isSelling(item.product.id))) {
      return;
    }

    const productIds = this.saleCart.map((item) => item.product.id!);
    productIds.forEach((productId) => this.sellingProductIds.add(productId));
    this.saleService.create({
      items: this.saleCart.map((item) => ({
        productId: item.product.id!,
        quantity: item.quantity
      }))
    }).subscribe({
      next: (sale) => {
        sale.items.forEach((item) => this.updateProductStock(item.productId, item.remainingStock));
        this.messageService.add({
          severity: 'success',
          summary: 'Venta realizada',
          detail: `${sale.items.length} producto${sale.items.length !== 1 ? 's' : ''} vendidos por ${this.formatPrice(sale.total)}. Venta #${sale.saleId} registrada a nombre de ${sale.username}.`
        });
        productIds.forEach((productId) => this.sellingProductIds.delete(productId));
        this.saleCart = [];
        this.saleDialogVisible = false;
      },
      error: (error: unknown) => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo realizar la venta',
          detail: this.getSaleErrorMessage(error)
        });
        productIds.forEach((productId) => this.sellingProductIds.delete(productId));
        if (this.isAdmin) {
          this.loadProducts();
        } else {
          const currentId = this.lookupForm.controls.id.value;
          if (currentId !== null) {
            this.lookupForm.controls.id.setValue(currentId);
          }
        }
      }
    });
  }

  private updateProductStock(productId: number, remainingStock: number): void {
    this.products = this.products.map((product) =>
      product.id === productId
        ? { ...product, stock: remainingStock }
        : product
    );
    this.saleCart = this.saleCart.map((item) =>
      item.product.id === productId
        ? { ...item, product: { ...item.product, stock: remainingStock } }
        : item
    );
  }

  private formatPrice(amount: number): string {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  }

  private getSaleErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Ocurrió un error inesperado al registrar la venta.';
    }

    if (error.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    if (error.status === 404) {
      return 'El producto ya no existe. Se actualizará el listado.';
    }

    if (error.status === 409) {
      return 'No hay suficiente stock para completar la venta.';
    }

    const body: unknown = error.error;
    if (
      body !== null &&
      typeof body === 'object' &&
      'error' in body &&
      typeof body.error === 'string'
    ) {
      return body.error;
    }

    return 'No se pudo completar la venta.';
  }

  private deleteProduct(id: number): void {
    this.productService.delete(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Producto eliminado correctamente'
        });
        this.loadProducts();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el producto'
        });
      }
    });
  }

  getStockSeverity(stock: number): 'success' | 'warn' | 'danger' {
    if (stock > 10) return 'success';
    if (stock > 0) return 'warn';
    return 'danger';
  }

  logout(): void {
    this.authService.logout();
  }
}