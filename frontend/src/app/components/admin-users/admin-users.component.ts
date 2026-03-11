import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3>User Management</h3>
      <button class="btn btn-primary" (click)="openModal()">Create New User</button>
    </div>

    <div class="card p-4">
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
            <button class="btn btn-primary" (click)="saveUser()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  showModal = false;
  editingUser: any = { role: 'User' };

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.api.getUsers().subscribe(res => {
      this.users = res;
    });
  }

  openModal() {
    this.editingUser = { role: 'User', passwordHash: '' };
    this.showModal = true;
  }

  editUser(user: any) {
    this.editingUser = { ...user };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveUser() {
    if (this.editingUser.id) {
      // API expects passwordHash to not be empty if updating, so we retain if needed or let user supply new
      this.api.updateUser(this.editingUser.id, this.editingUser).subscribe(() => {
        this.closeModal();
        this.loadUsers();
      });
    } else {
      this.api.createUser(this.editingUser).subscribe(() => {
        this.closeModal();
        this.loadUsers();
      });
    }
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.api.deleteUser(id).subscribe(() => {
        this.loadUsers();
      });
    }
  }
}
