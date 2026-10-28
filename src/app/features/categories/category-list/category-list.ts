import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CategoryService } from '../../../core/services/category';
import { AuthService } from '../../../core/services/auth';
import { Category } from '../../../shared/models/category.model';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    TableModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './category-list.html',
  styleUrls: ['./category-list.scss']
})
export class CategoryListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  categories: Category[] = [];
  loading = false;
  saving = false;
  editingId: number | null = null;

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.maxLength(300)]]
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getAll().subscribe({
      next: categories => {
        this.categories = categories;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las categorías'
        });
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const payload: Category = this.form.getRawValue();
    const request = this.editingId === null
      ? this.categoryService.create(payload)
      : this.categoryService.update(this.editingId, payload);

    request.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.editingId === null ? 'Categoría creada' : 'Categoría actualizada'
        });
        this.resetForm();
        this.loadCategories();
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo guardar',
          detail: error.error?.error ?? 'Verifica los datos e intenta nuevamente'
        });
      }
    });
  }

  edit(category: Category): void {
    this.editingId = category.id ?? null;
    this.form.setValue({
      nombre: category.nombre,
      descripcion: category.descripcion ?? ''
    });
  }

  confirmDelete(category: Category): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar la categoría "${category.nombre}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => this.deleteCategory(category)
    });
  }

  private deleteCategory(category: Category): void {
    if (category.id == null) return;

    this.categoryService.delete(category.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Categoría eliminada'
        });
        if (this.editingId === category.id) this.resetForm();
        this.loadCategories();
      },
      error: (error: HttpErrorResponse) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.error ?? 'No se pudo eliminar la categoría'
        });
      }
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset({ nombre: '', descripcion: '' });
    this.saving = false;
  }

  goToProducts(): void {
    this.router.navigate(['/products']);
  }

  logout(): void {
    this.authService.logout();
  }
}