import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../../core/services/product';
import { SaleService } from '../../../core/services/sale';
import { AuthService } from '../../../core/services/auth';
import { Product } from '../../../shared/models/product.model';
import { SaleResponse } from '../../../shared/models/sale.model';
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

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
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
  individualLookupMode = false;
  lookupLoading = false;
  lookupMessage = 'Ingresa el ID del producto para consultar sus datos';
  lookupForm = this.fb.group({
    id: [null as number | null, [Validators.required, Validators.min(1)]]
  });
  sellingProductIds = new Set<number>();
  saleDialogVisible = false;
  selectedProduct: Product | null = null;
  saleForm = this.fb.group({
    quantity: [1 as number | null, [Validators.required, Validators.min(1)]]
  });

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

  goToCategories(): void {
    this.router.navigate(['/categories']);
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

  openSaleDialog(product: Product): void {
    if (product.id === undefined || product.stock <= 0) {
      return;
    }

    this.selectedProduct = product;
    this.saleForm.controls.quantity.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(product.stock)
    ]);
    this.saleForm.controls.quantity.setValue(1);
    this.saleForm.controls.quantity.updateValueAndValidity();
    this.saleDialogVisible = true;
  }

  isSelling(productId: number | undefined): boolean {
    return productId !== undefined && this.sellingProductIds.has(productId);
  }

  get estimatedSaleTotal(): number {
    return (this.saleForm.controls.quantity.value ?? 0) * (this.selectedProduct?.precio ?? 0);
  }

  resetSaleDialog(): void {
    this.selectedProduct = null;
    this.saleForm.controls.quantity.setValidators([
      Validators.required,
      Validators.min(1)
    ]);
    this.saleForm.controls.quantity.setValue(1);
    this.saleForm.controls.quantity.updateValueAndValidity();
  }

  submitSale(): void {
    const product = this.selectedProduct;
    const quantity = this.saleForm.controls.quantity.value;
    if (
      product?.id === undefined ||
      quantity === null ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > product.stock ||
      this.sellingProductIds.has(product.id)
    ) {
      this.saleForm.controls.quantity.markAsTouched();
      return;
    }

    this.createSale(product, quantity);
  }

  private createSale(product: Product, quantity: number): void {
    const productId = product.id;
    if (productId === undefined || this.sellingProductIds.has(productId)) {
      return;
    }

    this.sellingProductIds.add(productId);
    this.saleService.create({ productId, quantity }).subscribe({
      next: (sale) => {
        this.updateProductStock(sale);
        this.messageService.add({
          severity: 'success',
          summary: 'Venta realizada',
          detail: `Se vendieron ${sale.quantity} unidad${sale.quantity !== 1 ? 'es' : ''} de "${sale.productName}". Total: ${this.formatPrice(sale.total)}. Stock restante: ${sale.remainingStock}.`
        });
        this.sellingProductIds.delete(productId);
        this.saleDialogVisible = false;
      },
      error: (error: unknown) => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo realizar la venta',
          detail: this.getSaleErrorMessage(error)
        });
        this.sellingProductIds.delete(productId);
        this.saleDialogVisible = false;
        this.loadProducts();
      }
    });
  }

  private updateProductStock(sale: SaleResponse): void {
    this.products = this.products.map((product) =>
      product.id === sale.productId
        ? { ...product, stock: sale.remainingStock }
        : product
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