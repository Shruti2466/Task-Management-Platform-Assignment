import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h3>System Reports</h3>
    <hr>
    
    <div class="row">
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
  tasksByUser: any[] = [];
  tasksByStatus: any[] = [];
  slaBreaches: any[] = [];
  users: any[] = [];

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getUsers().subscribe(res => this.users = res);
    this.api.getTasksByUser().subscribe(res => this.tasksByUser = res);
    this.api.getTasksByStatus().subscribe(res => this.tasksByStatus = res);
    this.api.getSlaBreach().subscribe(res => this.slaBreaches = res);
  }

  getAssigneeName(id: number | null): string {
    if (!id) return 'Unassigned';
    const user = this.users.find(u => u.id === id);
    return user ? user.username : 'Unknown';
  }
}
