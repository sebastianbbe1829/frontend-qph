import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user';
import { UserResponse } from '../../../shared/models/user.model';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/types/table';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.scss']
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchChanges = new Subject<string>();

  users: UserResponse[] = [];
  loading = false;
  loadFailed = false;
  page = 0;
  pageSize = 20;
  first = 0;
  totalRecords = 0;
  sortField = 'id';
  sortOrder = 1;
  searchTerm = '';
  private loadRequestId = 0;

  ngOnInit(): void {
    this.searchChanges.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((search) => {
      this.searchTerm = search.trim();
      this.page = 0;
      this.first = 0;
      this.loadUsers();
    });
    this.loadUsers();
  }

  loadUsers(): void {
    const requestId = ++this.loadRequestId;
    this.loading = true;
    this.loadFailed = false;
    this.userService.getAll(
      this.page,
      this.pageSize,
      this.sortField,
      this.sortOrder === -1 ? 'DESC' : 'ASC',
      this.searchTerm
    ).subscribe({
      next: (response) => {
        if (requestId !== this.loadRequestId) {
          return;
        }
        if (response.content.length === 0 && response.totalElements > 0 && this.page > 0) {
          this.page = Math.ceil(response.totalElements / this.pageSize) - 1;
          this.first = this.page * this.pageSize;
          this.loadUsers();
          return;
        }
        this.users = response.content;
        this.totalRecords = response.totalElements;
        this.loading = false;
      },
      error: (error: unknown) => {
        if (requestId !== this.loadRequestId) {
          return;
        }
        this.loading = false;
        this.loadFailed = true;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudieron consultar los usuarios',
          detail: error instanceof HttpErrorResponse && error.status === 403
            ? 'Tu cuenta no tiene permisos de administrador.'
            : 'Verifica tu conexión e inténtalo de nuevo.'
        });
      }
    });
  }

  onTableLazyLoad(event: TableLazyLoadEvent): void {
    this.pageSize = event.rows ?? this.pageSize;
    this.first = event.first ?? this.first;
    this.page = Math.floor(this.first / this.pageSize);
    const sortField = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
    if (sortField) {
      this.sortField = sortField;
    }
    if (event.sortOrder) {
      this.sortOrder = event.sortOrder;
    }
    this.loadUsers();
  }

  onSearchChange(search: string): void {
    this.searchChanges.next(search);
  }

  goToCreate(): void {
    this.router.navigate(['/users/new']);
  }

  goToProducts(): void {
    this.router.navigate(['/products']);
  }

  getRoleLabel(role: UserResponse['role']): string {
    return role === 'ADMIN' ? 'Administrador' : 'Usuario';
  }
}
