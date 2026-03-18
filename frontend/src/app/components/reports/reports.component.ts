import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { User, TaskReport, SlaBreach } from '../../models/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h3>System Reports</h3>
    <hr>
    
    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">Loading reports...</p>
    </div>

    <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

    <div class="row" *ngIf="!loading && !error">
      <div class="col-md-6 mb-4">
        <div class="card p-3 h-100">
          <h5>Tasks by User</h5>
          <table class="table table-sm mt-2">
            <thead>
              <tr><th>Assignee</th><th>Count</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of tasksByUser">
                <td>{{ getAssigneeName(item.assigneeId) }}</td>
                <td>{{ item.taskCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="col-md-6 mb-4">
        <div class="card p-3 h-100">
          <h5>Tasks by Status</h5>
          <table class="table table-sm mt-2">
            <thead>
              <tr><th>Status</th><th>Count</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of tasksByStatus">
                <td>
                  <span class="badge bg-secondary">{{ item.status }}</span>
                </td>
                <td>{{ item.taskCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card p-3 mb-4">
      <h5 class="text-danger">SLA Breaches (Overdue & Not Completed)</h5>
      <table class="table table-hover mt-2">
        <thead>
          <tr>
            <th>Task ID</th>
            <th>Title</th>
            <th>Assignee</th>
            <th>Days Overdue</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let breach of slaBreaches" class="table-danger">
            <td>{{ breach.taskId }}</td>
            <td>{{ breach.title }}</td>
            <td>{{ getAssigneeName(breach.assigneeId) }}</td>
            <td><b>{{ breach.daysOverdue }} days</b></td>
          </tr>
          <tr *ngIf="slaBreaches.length === 0">
            <td colspan="4" class="text-success text-center">No SLA breaches! 🎉</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  tasksByUser: TaskReport[] = [];
  tasksByStatus: TaskReport[] = [];
  slaBreaches: SlaBreach[] = [];
  users: User[] = [];
  loading = true;
  error = '';

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getUsers().subscribe({
      next: (res) => this.users = res,
      error: (err) => { console.warn('Could not load users for name mapping', err); }
    });
    this.api.getTasksByUser().subscribe({
      next: res => this.tasksByUser = res,
      error: () => this.error = 'Failed to load task by user report'
    });
    this.api.getTasksByStatus().subscribe({
      next: res => this.tasksByStatus = res,
      error: () => this.error = 'Failed to load task by status report'
    });
    this.api.getSlaBreach().subscribe({
      next: res => {
        this.slaBreaches = res;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load SLA breaches';
        this.loading = false;
      }
    });
  }

  getAssigneeName(id: number | null | undefined): string {
    if (!id) return 'Unassigned';
    const user = this.users.find(u => u.id === id);
    return user ? user.username : 'Unknown';
  }
}
