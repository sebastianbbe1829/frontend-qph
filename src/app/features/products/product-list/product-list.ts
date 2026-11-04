import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from '../../../core/services/product';
import { SaleService } from '../../../core/services/sale';
import { AuthService } from '../../../core/services/auth';
import { Product } from '../../../shared/models/product.model';
import { SaleResponse } from '../../../shared/models/sale.model';
import { HttpErrorResponse } from '@angular/common/http';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    ToolbarModule,
    TooltipModule,
    InputTextModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.scss']
})
export class ProductListComponent implements OnInit {

  private productService = inject(ProductService);
  private saleService = inject(SaleService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  products: Product[] = [];
  loading = false;
  sellingProductIds = new Set<number>();

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los productos'
        });
        this.loading = false;
      }
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

  confirmSale(product: Product): void {
    if (product.id === undefined || product.stock <= 0) {
      return;
    }

    this.confirmationService.confirm({
      message: `¿Deseas registrar la venta de 1 unidad de "${product.nombre}"?`,
      header: 'Confirmar venta',
      icon: 'pi pi-shopping-cart',
      acceptLabel: 'Sí, vender',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => this.createSale(product)
    });
  }

  isSelling(productId: number | undefined): boolean {
    return productId !== undefined && this.sellingProductIds.has(productId);
  }

  private createSale(product: Product): void {
    const productId = product.id;
    if (productId === undefined || this.sellingProductIds.has(productId)) {
      return;
    }

    this.sellingProductIds.add(productId);
    this.saleService.create({ productId, quantity: 1 }).subscribe({
      next: (sale) => {
        this.updateProductStock(sale);
        this.messageService.add({
          severity: 'success',
          summary: 'Venta realizada',
          detail: `Se vendió 1 unidad de "${sale.productName}". Total: ${this.formatPrice(sale.total)}. Stock restante: ${sale.remainingStock}.`
        });
        this.sellingProductIds.delete(productId);
      },
      error: (error: unknown) => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo realizar la venta',
          detail: this.getSaleErrorMessage(error)
        });
        this.sellingProductIds.delete(productId);
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