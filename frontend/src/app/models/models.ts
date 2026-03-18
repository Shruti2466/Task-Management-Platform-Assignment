export interface User {
    id: number;
    username: string;
    role: string;
}

export interface Task {
    id: number;
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'Open' | 'In Progress' | 'Blocked' | 'Completed';
    assigneeId: number | null;
    createdAt: string;
    updatedAt: string;
    dueDate: string | null;
}

export interface ActivityLog {
    id: number;
    taskId: number;
    statusChange: string;
    changedBy: string;
    timestamp: string;
}

export interface TaskResponse {
    task: Task;
    activityLogs: ActivityLog[];
}

export interface LoginResponse {
    token: string;
}

export interface TaskReport {
    assigneeId?: number | null;
    status?: string;
    taskCount: number;
}

export interface SlaBreach {
    taskId: number;
    title: string;
    assigneeId: number | null;
    daysOverdue: number;
}
