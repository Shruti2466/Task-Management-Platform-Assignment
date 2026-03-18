import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Task, User, ActivityLog } from '../../models/models';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3>Tasks</h3>
      <button class="btn btn-primary" (click)="openModal()" *ngIf="canManageTasks()">Create New Task</button>
    </div>

    <div class="card p-4 shadow-sm">
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <label class="form-label small fw-bold">Status</label>
          <select class="form-select" [(ngModel)]="filterStatus" (change)="loadTasks()">
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small fw-bold">Assignee</label>
          <select class="form-select" [(ngModel)]="filterAssignee" (change)="loadTasks()">
            <option [ngValue]="null">All Assignees</option>
            <option *ngFor="let u of users" [ngValue]="u.id">{{ u.username }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small fw-bold">From Date</label>
          <input type="date" class="form-control" [(ngModel)]="filterFromDate" (change)="loadTasks()">
        </div>
        <div class="col-md-3">
          <label class="form-label small fw-bold">To Date</label>
          <input type="date" class="form-control" [(ngModel)]="filterToDate" (change)="loadTasks()">
        </div>
      </div>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2 text-muted">Loading tasks...</p>
      </div>

      <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

      <table class="table table-hover mt-2" *ngIf="!loading && !error">
        <thead>
          <tr class="table-light">
            <th>ID</th>
            <th>Title</th>
            <th>Assignee</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let task of tasks">
            <td>{{ task.id }}</td>
            <td>{{ task.title }}</td>
            <td>{{ getAssigneeName(task.assigneeId) }}</td>
            <td>
              <span class="badge" 
                [ngClass]="{
                  'bg-secondary shadow-sm': task.status === 'Open',
                  'bg-primary shadow-sm': task.status === 'In Progress',
                  'bg-danger shadow-sm': task.status === 'Blocked',
                  'bg-success shadow-sm': task.status === 'Completed'
                }">{{ task.status }}</span>
            </td>
            <td>
              <span class="badge rounded-pill border py-1 px-2"
                [ngClass]="{
                  'text-danger border-danger': task.priority === 'High',
                  'text-warning border-warning': task.priority === 'Medium',
                  'text-info border-info': task.priority === 'Low'
                }">{{ task.priority }}</span>
            </td>
            <td>{{ (task.dueDate | date:'mediumDate') || '-' }}</td>
            <td>
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-primary" (click)="viewTask(task.id)">Details</button>
                <button class="btn btn-sm btn-outline-danger" (click)="deleteTask(task.id)" *ngIf="isAdmin()">Delete</button>
              </div>
            </td>
          </tr>
          <tr *ngIf="tasks.length === 0">
            <td colspan="7" class="text-center py-4 text-muted">No tasks found matching current filters.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Simple Modal Overlay -->
    <div class="modal d-block" *ngIf="showModal" style="background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);">
      <div class="modal-dialog modal-lg mt-5 shadow-lg">
        <div class="modal-content border-0">
          <div class="modal-header bg-light">
            <h5 class="modal-title fw-bold">{{ selectedTaskId ? 'Update Task' : 'Create Task' }}</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body p-4">
            <div class="mb-3">
              <label class="form-label fw-bold small">Title</label>
              <input class="form-control" [(ngModel)]="editingTask.title" placeholder="Enter task title..." />
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold small">Description</label>
              <textarea class="form-control" [(ngModel)]="editingTask.description" rows="3" placeholder="Detailed description..."></textarea>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label fw-bold small">Due Date</label>
                <input type="date" class="form-control" [(ngModel)]="editingTask.dueDate" />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label fw-bold small">Priority</label>
                <select class="form-select" [(ngModel)]="editingTask.priority">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label fw-bold small">Status</label>
                <select class="form-select" [(ngModel)]="editingTask.status" [disabled]="!selectedTaskId">
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label fw-bold small">Assign To</label>
                <select class="form-select" [(ngModel)]="editingTask.assigneeId">
                  <option [ngValue]="null">Unassigned</option>
                  <option *ngFor="let user of users" [ngValue]="user.id">
                    {{ user.username }} ({{ user.role }})
                  </option>
                </select>
              </div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-4">
              <button class="btn btn-secondary px-4" (click)="closeModal()">Cancel</button>
              <button class="btn btn-primary px-4" (click)="saveTask()" [disabled]="!editingTask.title || loading">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
                Save Task
              </button>
            </div>
            
            <div *ngIf="selectedTaskId" class="mt-4 pt-4 border-top">
              <h6 class="fw-bold mb-3">Activity Log</h6>
              <div class="activity-timeline">
                <div class="activity-item d-flex gap-3 mb-3 border-start ps-3" *ngFor="let log of currentActivityLogs">
                  <div class="small">
                    <div class="fw-bold">{{ log.changedBy }}</div>
                    <div class="text-muted small">{{ log.timestamp | date:'short' }}</div>
                  </div>
                  <div class="flex-grow-1 card p-2 bg-light border-0 small">
                    {{ log.statusChange }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .activity-timeline { border-left: 2px solid #e9ecef; margin-left: 0.5rem; }
    .activity-item { position: relative; }
    .activity-item::before {
      content: '';
      position: absolute;
      left: -2px;
      top: 0;
      width: 10px;
      height: 10px;
      background: #0d6efd;
      border-radius: 50%;
      transform: translateX(-50%);
    }
  `]
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  users: User[] = [];

  filterStatus = '';
  filterAssignee: number | null = null;
  filterFromDate = '';
  filterToDate = '';

  loading = false;
  error = '';
  showModal = false;
  selectedTaskId: number | null = null;
  editingTask: any = { priority: 'Low', assigneeId: null };
  currentActivityLogs: ActivityLog[] = [];

  constructor(private api: ApiService, private auth: AuthService) { }

  ngOnInit() {
    this.loadTasks();
    this.loadUsers();
  }

  isAdmin() { return this.auth.getRole() === 'Admin'; }
  canManageTasks() { return ['Admin', 'Manager'].includes(this.auth.getRole() || ''); }

  loadUsers() {
    this.api.getUsers().subscribe({
      next: (res) => this.users = res,
      error: (err) => {
        if (err.status !== 403 && err.status !== 401) {
          this.error = 'Failed to load users';
        }
      }
    });
  }

  loadTasks() {
    this.loading = true;
    this.error = '';
    this.api.getTasks(
      this.filterStatus || undefined,
      this.filterAssignee || undefined,
      this.filterFromDate || undefined,
      this.filterToDate || undefined
    ).subscribe({
      next: (res) => {
        this.tasks = res;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load tasks. Please try again.';
        this.loading = false;
      }
    });
  }

  openModal() {
    this.selectedTaskId = null;
    this.editingTask = { priority: 'Low', assigneeId: null };
    this.currentActivityLogs = [];
    this.showModal = true;
  }

  viewTask(id: number) {
    this.loading = true;
    this.api.getTask(id).subscribe({
      next: (res) => {
        this.selectedTaskId = id;
        this.editingTask = { ...res.task };
        if (this.editingTask.dueDate) {
          this.editingTask.dueDate = this.editingTask.dueDate.split('T')[0];
        }
        this.currentActivityLogs = res.activityLogs;
        this.showModal = true;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load task details';
        this.loading = false;
      }
    });
  }

  closeModal() {
    this.showModal = false;
  }

  deleteTask(id: number) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.loading = true;
      this.api.deleteTask(id).subscribe({
        next: () => {
          this.loadTasks();
        },
        error: () => {
          this.error = 'Failed to delete task';
          this.loading = false;
        }
      });
    }
  }

  saveTask() {
    this.loading = true;
    const nextUrl = () => {
      this.closeModal();
      this.loadTasks();
    };
    const errObj = () => {
      this.error = 'Failed to save task. Check your permissions.';
      this.loading = false;
    };

    if (this.selectedTaskId) {
      this.api.updateTask(this.selectedTaskId, this.editingTask).subscribe({
        next: nextUrl,
        error: errObj
      });
    } else {
      this.api.createTask(this.editingTask).subscribe({
        next: nextUrl,
        error: errObj
      });
    }
  }

  getAssigneeName(id: number | null | undefined): string {
    if (!id) return 'Unassigned';
    const user = this.users.find(u => u.id === id);
    return user ? user.username : 'Unknown';
  }
}
