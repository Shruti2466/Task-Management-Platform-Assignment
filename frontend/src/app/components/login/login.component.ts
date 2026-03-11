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
          <div class="card p-4">
            <h3 class="text-center mb-4 text-primary">Task Platform Login</h3>
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <div class="mb-3">
                <label class="form-label">Username</label>
                <input type="text" class="form-control" formControlName="username" placeholder="admin">
              </div>
              <div class="mb-3">
                <label class="form-label">Password</label>
                <input type="password" class="form-control" formControlName="password" placeholder="admin">
              </div>
              <button type="submit" class="btn btn-primary w-100" [disabled]="loginForm.invalid">Login</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
    loginForm: FormGroup;

    constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
        this.loginForm = this.fb.group({
            username: ['admin', Validators.required],
            password: ['admin', Validators.required]
        });
    }

    onSubmit() {
        if (this.loginForm.valid) {
            this.auth.login(this.loginForm.value.username, this.loginForm.value.password).subscribe({
                next: () => this.router.navigate(['/dashboard']),
                error: (err) => alert('Login failed')
            });
        }
    }
}
