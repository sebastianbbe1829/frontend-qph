import { Component, inject, OnInit } from '@angular/core';
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

  users: UserResponse[] = [];
  loading = false;
  loadFailed = false;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.loadFailed = false;
    this.userService.getAll().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error: unknown) => {
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
