import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-5">
          <div class="card p-4 shadow-lg border-0 rounded-4">
            <div class="text-center mb-4">
              <h3 class="fw-bold text-primary">TaskMaster</h3>
              <p class="text-muted small">Sign in to manage your workspace</p>
            </div>
            
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <div class="mb-3">
                <label class="form-label small fw-bold">Username</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0"><i class="bi bi-person"></i></span>
                  <input type="text" class="form-control border-start-0 bg-light" formControlName="username" placeholder="Enter username"
                    [ngClass]="{'is-invalid': loginForm.get('username')?.invalid && (loginForm.get('username')?.dirty || loginForm.get('username')?.touched)}">
                </div>
                <div *ngIf="loginForm.get('username')?.invalid && (loginForm.get('username')?.dirty || loginForm.get('username')?.touched)" class="text-danger small mt-1">
                  Username is required.
                </div>
              </div>
              <div class="mb-4">
                <label class="form-label small fw-bold">Password</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0"><i class="bi bi-lock"></i></span>
                  <input type="password" class="form-control border-start-0 bg-light" formControlName="password" placeholder="••••••••"
                    [ngClass]="{'is-invalid': loginForm.get('password')?.invalid && (loginForm.get('password')?.dirty || loginForm.get('password')?.touched)}">
                </div>
                <div *ngIf="loginForm.get('password')?.invalid && (loginForm.get('password')?.dirty || loginForm.get('password')?.touched)" class="text-danger small mt-1">
                  Password is required.
                </div>
              </div>
              
              <div *ngIf="error" class="alert alert-danger py-2 small mb-4">
                <i class="bi bi-exclamation-triangle-fill me-2"></i> {{ error }}
              </div>

              <button type="submit" class="btn btn-primary w-100 py-2 fw-bold" [disabled]="loginForm.invalid || loading">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ loading ? 'Signing in...' : 'Sign In' }}
              </button>
            </form>
          </div>
          <div class="text-center mt-4 text-muted small">
            &copy; 2026 Task Management Platform
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (this.loginForm.valid) {
      this.loading = true;
      this.error = '';
      this.auth.login(this.loginForm.value.username, this.loginForm.value.password).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Invalid username or password. Please try again.';
        }
      });
    }
  }
}
