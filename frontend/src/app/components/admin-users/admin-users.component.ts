import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3>User Management</h3>
      <button class="btn btn-primary" (click)="openModal()">Create New User</button>
    </div>

    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">Loading users...</p>
    </div>
    <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

    <div class="card p-4" *ngIf="!loading && !error">
      <table class="table table-hover mt-2">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of users">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>
              <span class="badge" 
                [ngClass]="{
                  'bg-danger': user.role === 'Admin',
                  'bg-warning': user.role === 'Manager',
                  'bg-info': user.role === 'User' || user.role === 'Engineer'
                }">{{ user.role }}</span>
            </td>
            <td>
              <button class="btn btn-sm btn-outline-primary me-2" (click)="editUser(user)">Edit</button>
              <button class="btn btn-sm btn-outline-danger" (click)="deleteUser(user.id)" *ngIf="user.id !== 1">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal relative to User Management -->
    <div class="modal d-block" *ngIf="showModal" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog mt-5">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingUser.id ? 'Edit User' : 'Create User' }}</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label>Username</label>
              <input class="form-control" [(ngModel)]="editingUser.username" [readonly]="!!editingUser.id" />
            </div>
            <div class="mb-3" *ngIf="!editingUser.id">
              <label>Password</label>
              <input type="password" class="form-control" [(ngModel)]="editingUser.passwordHash" />
            </div>
            <div class="mb-3">
              <label>Role</label>
              <select class="form-select" [(ngModel)]="editingUser.role">
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="User">User</option>
                <option value="Engineer">Engineer</option>
              </select>
            </div>
            <button class="btn btn-primary" (click)="saveUser()" [disabled]="saving">
              <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>Save
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  showModal = false;
  editingUser: Partial<User> & { passwordHash?: string } = { role: 'User' };
  loading = false;
  error = '';
  saving = false;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = '';
    this.api.getUsers().subscribe({
      next: (res) => {
        this.users = res;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load users';
        this.loading = false;
      }
    });
  }

  openModal() {
    this.editingUser = { role: 'User', passwordHash: '' };
    this.showModal = true;
  }

  editUser(user: User) {
    this.editingUser = { ...user };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveUser() {
    this.saving = true;
    if (this.editingUser.id) {
      this.api.updateUser(this.editingUser.id, this.editingUser as Partial<User>).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadUsers();
        },
        error: () => {
          alert('Failed to update user');
          this.saving = false;
        }
      });
    } else {
      this.api.createUser(this.editingUser as Partial<User>).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadUsers();
        },
        error: () => {
          alert('Failed to create user');
          this.saving = false;
        }
      });
    }
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.api.deleteUser(id).subscribe({
        next: () => this.loadUsers(),
        error: () => alert('Failed to delete user')
      });
    }
  }
}
