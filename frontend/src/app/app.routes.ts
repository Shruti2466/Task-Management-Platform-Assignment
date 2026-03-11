import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TaskListComponent } from './components/task-list/task-list.component';
import { ReportsComponent } from './components/reports/reports.component';
import { AdminUsersComponent } from './components/admin-users/admin-users.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'tasks', component: TaskListComponent, canActivate: [authGuard] },
    { path: 'reports', component: ReportsComponent, canActivate: [authGuard] },
    { path: 'admin/users', component: AdminUsersComponent, canActivate: [authGuard] }
];

