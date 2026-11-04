import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../../core/services/user';
import { UserRole } from '../../../shared/models/user.model';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './user-create.html',
  styleUrls: ['./user-create.scss']
})
export class UserCreateComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  roles: Array<{ label: string; value: UserRole }> = [
    { label: 'Usuario', value: 'USER' },
    { label: 'Administrador', value: 'ADMIN' }
  ];
  saving = false;
  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    role: ['USER' as UserRole, Validators.required]
  });

  save(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.userService.create(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Usuario creado',
          detail: `${user.username} fue creado con el rol ${user.role}.`
        });
        this.saving = false;
        this.router.navigate(['/products']);
      },
      error: (error: unknown) => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo crear el usuario',
          detail: error instanceof HttpErrorResponse && error.status === 409
            ? 'Ese nombre de usuario ya está registrado.'
            : 'Verifica los datos e inténtalo de nuevo.'
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}
