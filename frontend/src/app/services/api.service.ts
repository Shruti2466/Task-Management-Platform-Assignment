import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { User, Task, LoginResponse, TaskReport, SlaBreach, ActivityLog } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private taskApi = environment.taskServiceUrl;
    private reportApi = environment.reportingServiceUrl;
    private userApi = environment.userServiceUrl.replace('/auth', ''); // http://localhost:5001/api/users

    constructor(private http: HttpClient) { }

    // --- Users ---
    getUsers() { return this.http.get<User[]>(`${this.userApi}/users`); }
    getUser(id: number) { return this.http.get<User>(`${this.userApi}/users/${id}`); }
    createUser(user: Partial<User>) { return this.http.post<User>(`${this.userApi}/users`, user); }
    updateUser(id: number, user: Partial<User>) { return this.http.put<void>(`${this.userApi}/users/${id}`, user); }
    deleteUser(id: number) { return this.http.delete<void>(`${this.userApi}/users/${id}`); }

    // --- Tasks ---
    getTasks(status?: string, assigneeId?: number, fromDate?: string, toDate?: string) {
        let params = new HttpParams();
        if (status) params = params.set('status', status);
        if (assigneeId) params = params.set('assigneeId', assigneeId.toString());
        if (fromDate) params = params.set('fromDate', fromDate);
        if (toDate) params = params.set('toDate', toDate);
        return this.http.get<Task[]>(this.taskApi, { params });
    }

    getTask(id: number) {
        return this.http.get<{ task: Task, activityLogs: ActivityLog[] }>(`${this.taskApi}/${id}`);
    }

    createTask(task: Partial<Task>) {
        return this.http.post<Task>(this.taskApi, task);
    }

    updateTask(id: number, task: Partial<Task>) {
        return this.http.put<void>(`${this.taskApi}/${id}`, task);
    }

    deleteTask(id: number) {
        return this.http.delete<void>(`${this.taskApi}/${id}`);
    }

    getTasksByUser() {
        return this.http.get<TaskReport[]>(`${this.reportApi}/tasks-by-user`);
    }

    getTasksByStatus() {
        return this.http.get<TaskReport[]>(`${this.reportApi}/tasks-by-status`);
    }

    getSlaBreach() {
        return this.http.get<SlaBreach[]>(`${this.reportApi}/sla-breach`);
    }
}
