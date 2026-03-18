import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Task } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card text-white bg-primary p-3">
          <h5>Open Tasks</h5>
          <h2>{{ openCount }}</h2>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-white bg-warning p-3">
          <h5>In Progress</h5>
          <h2>{{ inProgressCount }}</h2>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-white bg-success p-3">
          <h5>Completed</h5>
          <h2>{{ completedCount }}</h2>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-white bg-danger p-3">
          <h5>Blocked</h5>
          <h2>{{ blockedCount }}</h2>
        </div>
      </div>
    </div>

    <div class="card p-4">
      <h4>My Assigned Tasks</h4>
      <table class="table mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let task of myTasks">
            <td>{{ task.id }}</td>
            <td>{{ task.title }}</td>
            <td><span class="badge" [ngClass]="{'bg-danger': task.priority==='High', 'bg-warning': task.priority==='Medium', 'bg-info': task.priority==='Low'}">{{ task.priority }}</span></td>
            <td>{{ task.status }}</td>
            <td>{{ task.dueDate | date }}</td>
          </tr>
          <tr *ngIf="myTasks.length === 0 && !loading">
            <td colspan="5" class="text-center text-muted">No tasks assigned</td>
          </tr>
          <tr *ngIf="loading">
            <td colspan="5" class="text-center text-muted">
              <span class="spinner-border spinner-border-sm me-2"></span>Loading tasks...
            </td>
          </tr>
          <tr *ngIf="error">
            <td colspan="5" class="text-center text-danger">{{ error }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  myTasks: Task[] = [];
  openCount = 0;
  inProgressCount = 0;
  completedCount = 0;
  blockedCount = 0;
  loading = false;
  error = '';

  constructor(private api: ApiService, private auth: AuthService) { }

  ngOnInit() {
    this.api.getTasksByStatus().subscribe(res => {
      this.openCount = res.find(x => x.status === 'Open')?.taskCount || 0;
      this.inProgressCount = res.find(x => x.status === 'In Progress')?.taskCount || 0;
      this.completedCount = res.find(x => x.status === 'Completed')?.taskCount || 0;
      this.blockedCount = res.find(x => x.status === 'Blocked')?.taskCount || 0;
    });

    const token = this.auth.getToken();
    if (token) {
      try {
        this.loading = true;
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']);
        this.api.getTasks(undefined, userId).subscribe({
          next: (tasks) => {
            this.myTasks = tasks;
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Failed to load user tasks';
            this.loading = false;
          }
        });
      } catch (e) {
        this.error = 'Invalid token format';
        this.loading = false;
      }
    }
  }
}
