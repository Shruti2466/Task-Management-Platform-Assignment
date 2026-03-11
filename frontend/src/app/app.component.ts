import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4" *ngIf="auth.isAuthenticated$ | async">
      <div class="container">
        <a class="navbar-brand" routerLink="/dashboard">Task Platform</a>
        <div class="collapse navbar-collapse d-flex justify-content-between">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/tasks" routerLinkActive="active">Tasks</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/reports" routerLinkActive="active">Reports</a>
            </li>
            <li class="nav-item" *ngIf="auth.getRole() === 'Admin'">
              <a class="nav-link text-warning" routerLink="/admin/users" routerLinkActive="active">Users</a>
            </li>
          </ul>
          <button class="btn btn-outline-light btn-sm" (click)="auth.logout();">Logout</button>
        </div>
      </div>
    </nav>

    <div class="container">
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent {
  title = 'frontend';
  constructor(public auth: AuthService) { }
}
