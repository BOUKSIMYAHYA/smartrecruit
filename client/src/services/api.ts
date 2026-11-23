import { Application, CandidateProfile, Job, User } from '../types/index.js';

const API_BASE = (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api');

export class ApiClient {
  private static getToken(): string | null {
    return localStorage.getItem('smartrecruit_token');
  }

  public static setToken(token: string): void {
    localStorage.setItem('smartrecruit_token', token);
  }

  public static clearToken(): void {
    localStorage.removeItem('smartrecruit_token');
  }

  public static async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Erreur serveur (${res.status})`);
    }

    return data as T;
  }

  // Auth
  public static async getMe(): Promise<{ user: User }> {
    return this.request('/auth/me');
  }

  public static async login(identifier: string, password: string): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    this.setToken(res.token);
    return res;
  }

  public static async registerCandidate(data: {
    email: string;
    password: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<{ success: boolean; email: string; message: string; devCode?: string }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async verifyEmail(email: string, code: string): Promise<{ token: string; user: User; message: string }> {
    const res = await this.request<{ token: string; user: User; message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
    this.setToken(res.token);
    return res;
  }

  public static async resendCode(email: string): Promise<{ success: boolean; message: string; devCode?: string }> {
    return this.request('/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  public static async devLogin(email: string, role?: string): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
    this.setToken(res.token);
    return res;
  }

  public static async changePassword(data: {
    currentPassword?: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Jobs
  public static async getPublicJobs(params?: Record<string, any>): Promise<{ jobs: Job[] }> {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/jobs/public${qs}`);
  }

  public static async getJob(idOrSlug: string): Promise<{ job: Job }> {
    return this.request(`/jobs/public/${idOrSlug}`);
  }

  public static async getHrJobs(params?: Record<string, any>): Promise<{ jobs: Job[] }> {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/jobs/hr${qs}`);
  }

  public static async createJob(jobData: any): Promise<{ job: Job }> {
    return this.request('/jobs/hr', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  public static async updateJob(id: string, jobData: any): Promise<{ job: Job }> {
    return this.request(`/jobs/hr/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  }

  public static async deleteJob(id: string): Promise<{ message: string; job?: Job }> {
    return this.request(`/jobs/hr/${id}`, {
      method: 'DELETE',
    });
  }

  // Applications
  public static async apply(formData: FormData): Promise<{ message: string; application: any }> {
    return this.request('/applications/apply', {
      method: 'POST',
      body: formData,
    });
  }

  public static async getMyApplications(): Promise<{ applications: Application[] }> {
    return this.request('/applications/my-applications');
  }

  public static async withdrawApplication(id: string, reason?: string): Promise<{ message: string }> {
    return this.request(`/applications/${id}/withdraw`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  public static async getHrApplications(params?: Record<string, any>): Promise<{
    applications: Application[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/applications/hr/all${qs}`);
  }

  public static async getKanban(jobId?: string): Promise<{ kanban: Record<string, Application[]> }> {
    const qs = jobId ? `?jobId=${jobId}` : '';
    return this.request(`/applications/hr/kanban${qs}`);
  }

  public static async getApplicationDetail(id: string): Promise<{ application: Application }> {
    return this.request(`/applications/hr/${id}`);
  }

  public static async updateApplicationStatus(
    id: string,
    status: string,
    reason?: string,
    notifyCandidate = true
  ): Promise<{ message: string; application: Application }> {
    return this.request(`/applications/hr/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason, notifyCandidate }),
    });
  }

  public static async batchUploadCv(jobId: string, files: File[]): Promise<any> {
    const formData = new FormData();
    formData.append('jobId', jobId);
    files.forEach((f) => formData.append('files', f));
    return this.request('/applications/hr/batch-upload', {
      method: 'POST',
      body: formData,
    });
  }

  // Candidate Profile & CV
  public static async getProfile(): Promise<{ profile: CandidateProfile }> {
    return this.request('/candidates/profile');
  }

  public static async updateProfile(data: any): Promise<{ message: string; profile: CandidateProfile }> {
    return this.request('/candidates/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async uploadAvatar(file: File): Promise<{ success: boolean; avatarUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.request('/candidates/avatar', {
      method: 'POST',
      body: formData,
    });
  }

  public static async deleteAvatar(): Promise<{ success: boolean; message: string }> {
    return this.request('/candidates/avatar', {
      method: 'DELETE',
    });
  }

  public static async uploadResume(file: File, title?: string): Promise<any> {
    const formData = new FormData();
    formData.append('resume', file);
    if (title) formData.append('title', title);
    return this.request('/candidates/resumes/upload', {
      method: 'POST',
      body: formData,
    });
  }

  public static async savePlatformResume(title: string, contentJson: any): Promise<any> {
    return this.request('/candidates/resumes/builder', {
      method: 'POST',
      body: JSON.stringify({ title, contentJson }),
    });
  }

  public static async getResumeDownloadUrl(resumeId: string): Promise<{ downloadUrl: string; token: string }> {
    return this.request(`/candidates/resumes/${resumeId}/signed-url`);
  }

  // AI Agent & Assistant
  public static async rerunAiMatch(applicationId: string): Promise<any> {
    return this.request(`/ai/match/${applicationId}`, { method: 'POST' });
  }

  public static async humanValidation(applicationId: string, decision: string, notes?: string): Promise<any> {
    return this.request(`/ai/validate/${applicationId}`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    });
  }

  public static async askAiAssistant(query: string, history?: any[]): Promise<{ answer: string }> {
    return this.request('/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({ query, history }),
    });
  }

  public static async compareCandidates(applicationIds: string[]): Promise<{ comparison: any[] }> {
    return this.request('/ai/compare', {
      method: 'POST',
      body: JSON.stringify({ applicationIds }),
    });
  }

  // Interviews
  public static async scheduleInterview(data: any): Promise<any> {
    return this.request('/interviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async getInterviews(params?: any): Promise<{ interviews: any[] }> {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/interviews${qs}`);
  }

  public static async updateInterview(id: string, data: any): Promise<any> {
    return this.request(`/interviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Analytics & KPIs
  public static async getDashboardKpis(): Promise<{ kpis: any }> {
    return this.request('/analytics/kpis');
  }

  public static async getDashboardCharts(): Promise<{ charts: any }> {
    return this.request('/analytics/charts');
  }

  // Talent Pool & Favorites
  public static async getTalentPool(params?: any): Promise<{ talentPool: any[] }> {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/talent-pool${qs}`);
  }

  public static async toggleTalentPool(profileId: string, notes?: string): Promise<any> {
    return this.request(`/talent-pool/${profileId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
  }

  public static async toggleFavorite(profileId: string): Promise<any> {
    return this.request(`/talent-pool/${profileId}/favorite`, { method: 'POST' });
  }

  public static async addRecruitmentNote(applicationId: string, content: string, isPrivate = false): Promise<any> {
    return this.request(`/talent-pool/notes/${applicationId}`, {
      method: 'POST',
      body: JSON.stringify({ content, isPrivate }),
    });
  }

  // Users & RBAC
  public static async getHrUsers(): Promise<{ users: any[] }> {
    return this.request('/users/hr-team');
  }

  public static async updateUserRole(userId: string, role: string): Promise<any> {
    return this.request(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  public static async toggleUserStatus(userId: string): Promise<any> {
    return this.request(`/users/${userId}/status`, { method: 'PUT' });
  }

  public static async assignJobCollaborator(jobId: string, userId: string): Promise<any> {
    return this.request('/users/collaborators', {
      method: 'POST',
      body: JSON.stringify({ jobId, userId }),
    });
  }

  public static async getAuditLogs(): Promise<{ logs: any[] }> {
    return this.request('/users/audit-logs');
  }

  // Notifications
  public static async getMyNotifications(): Promise<{ notifications: any[]; unreadCount: number }> {
    return this.request('/notifications');
  }

  public static async markNotificationAsRead(id: string): Promise<{ success: boolean }> {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  public static async markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }

  public static async downloadApplicationsCsv(): Promise<void> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/applications/hr/export/csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Impossible d\'exporter les candidatures');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidatures_estc_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
