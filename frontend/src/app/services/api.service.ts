import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private taskApi = environment.taskServiceUrl;
    private reportApi = environment.reportingServiceUrl;
    private userApi = environment.userServiceUrl.replace('/auth', ''); // http://localhost:5001/api/users

    constructor(private http: HttpClient) { }

    // --- Users ---
    getUsers() { return this.http.get<any[]>(`${this.userApi}/users`); }
    getUser(id: number) { return this.http.get<any>(`${this.userApi}/users/${id}`); }
    createUser(user: any) { return this.http.post<any>(`${this.userApi}/users`, user); }
    updateUser(id: number, user: any) { return this.http.put<any>(`${this.userApi}/users/${id}`, user); }
    deleteUser(id: number) { return this.http.delete<any>(`${this.userApi}/users/${id}`); }

    // --- Tasks ---
    getTasks(status?: string, assigneeId?: number) {
        let params = new HttpParams();
        if (status) params = params.set('status', status);
        if (assigneeId) params = params.set('assigneeId', assigneeId.toString());
        return this.http.get<any[]>(this.taskApi, { params });
    }

    getTask(id: number) {
        return this.http.get<any>(`${this.taskApi}/${id}`);
    }

    createTask(task: any) {
        return this.http.post<any>(this.taskApi, task);
    }

    updateTask(id: number, task: any) {
        return this.http.put<any>(`${this.taskApi}/${id}`, task);
    }

    getTasksByUser() {
        return this.http.get<any[]>(`${this.reportApi}/tasks-by-user`);
    }

    getTasksByStatus() {
        return this.http.get<any[]>(`${this.reportApi}/tasks-by-status`);
    }

    getSlaBreach() {
        return this.http.get<any[]>(`${this.reportApi}/sla-breach`);
    }
}
