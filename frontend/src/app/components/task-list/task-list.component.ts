import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3>Tasks</h3>
      <button class="btn btn-primary" (click)="openModal()">Create New Task</button>
    </div>

    <div class="card p-4">
      <div class="row mb-3">
        <div class="col-md-3">
          <label>Filter by Status</label>
          <select class="form-select" [(ngModel)]="filterStatus" (change)="loadTasks()">
            <option value="">All</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <table class="table table-hover mt-2">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let task of tasks">
            <td>{{ task.id }}</td>
            <td>{{ task.title }}</td>
            <td>
              <span class="badge" 
                [ngClass]="{
                  'bg-secondary': task.status === 'Open',
                  'bg-primary': task.status === 'In Progress',
                  'bg-danger': task.status === 'Blocked',
                  'bg-success': task.status === 'Completed'
                }">{{ task.status }}</span>
            </td>
            <td>{{ task.priority }}</td>
            <td>
              <button class="btn btn-sm btn-outline-primary" (click)="viewTask(task.id)">Details</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Simple Modal Overlay -->
    <div class="modal d-block" *ngIf="showModal" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg mt-5">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ selectedTaskId ? 'Update Task' : 'Create Task' }}</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label>Title</label>
              <input class="form-control" [(ngModel)]="editingTask.title" />
            </div>
            <div class="mb-3">
              <label>Description</label>
              <textarea class="form-control" [(ngModel)]="editingTask.description"></textarea>
            </div>
            <div class="mb-3">
              <label>Due Date</label>
              <input type="date" class="form-control" [(ngModel)]="editingTask.dueDate" />
            </div>
            <div class="row">
              <div class="col-md-4 mb-3">
                <label>Priority</label>
                <select class="form-select" [(ngModel)]="editingTask.priority">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label>Status</label>
                <select class="form-select" [(ngModel)]="editingTask.status" [disabled]="!selectedTaskId">
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div class="col-md-4 mb-3">
                <label>Assign To</label>
                <select class="form-select" [(ngModel)]="editingTask.assigneeId">
                  <option [ngValue]="null">Unassigned</option>
                  <option *ngFor="let user of users" [ngValue]="user.id">
                    {{ user.username }} ({{ user.role }})
                  </option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary" (click)="saveTask()">Save</button>
            
            <hr *ngIf="selectedTaskId">
            <div *ngIf="selectedTaskId">
              <h6>Activity Log</h6>
              <ul class="list-group">
                <li class="list-group-item d-flex justify-content-between text-muted" style="font-size: 0.85rem;" *ngFor="let log of currentActivityLogs">
                  <span><b>{{ log.changedBy }}</b> changed status to: {{ log.statusChange }}</span>
                  <span>{{ log.timestamp | date:'short' }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TaskListComponent implements OnInit {
  tasks: any[] = [];
  users: any[] = [];
  filterStatus = '';

  showModal = false;
  selectedTaskId: number | null = null;
  editingTask: any = { status: 'Open', priority: 'Low', assigneeId: null };
  currentActivityLogs: any[] = [];

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadTasks();
    this.loadUsers();
  }

  loadUsers() {
    this.api.getUsers().subscribe(res => {
      this.users = res;
    });
  }

  loadTasks() {
    this.api.getTasks(this.filterStatus || undefined).subscribe(res => {
      this.tasks = res;
    });
  }

  openModal() {
    this.selectedTaskId = null;
    this.editingTask = { status: 'Open', priority: 'Low', assigneeId: null };
    this.currentActivityLogs = [];
    this.showModal = true;
  }

  viewTask(id: number) {
    this.api.getTask(id).subscribe(res => {
      this.selectedTaskId = id;
      this.editingTask = { ...res.task };
      if (this.editingTask.dueDate) {
        this.editingTask.dueDate = this.editingTask.dueDate.split('T')[0];
      }
      this.currentActivityLogs = res.activityLogs;
      this.showModal = true;
    });
  }

  closeModal() {
    this.showModal = false;
  }

  saveTask() {
    if (this.selectedTaskId) {
      this.api.updateTask(this.selectedTaskId, this.editingTask).subscribe(() => {
        this.closeModal();
        this.loadTasks();
      });
    } else {
      this.api.createTask(this.editingTask).subscribe(() => {
        this.closeModal();
        this.loadTasks();
      });
    }
  }
}
