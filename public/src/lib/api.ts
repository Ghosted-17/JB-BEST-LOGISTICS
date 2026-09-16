const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export type AuthRole = 'customer' | 'rider' | 'warehouse' | 'branch' | 'carrier' | 'admin';

export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  phone?: string;
  role: AuthRole;
  status?: 'active' | 'suspended';
  branchId?: string;
  mustChangePassword?: boolean;
  profilePhotoKey?: string;
}

export interface StaffAccount extends AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'rider' | 'warehouse' | 'branch' | 'carrier' | 'admin';
  status: 'active' | 'suspended';
  phone?: string;
  branchId?: string;
  mustChangePassword?: boolean;
  profilePhotoKey?: string;
}

type ApiOptions = RequestInit & { auth?: boolean };

export const apiRequest = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (options.auth !== false) {
    const token = localStorage.getItem('jb_best_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body as T;
};

export const login = (email: string, password: string) =>
  apiRequest<{ token: string; user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  });

export const requestPasswordReset = (email: string) =>
  apiRequest<{ message: string; developmentToken?: string }>('/api/auth/forgot-password', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email }),
  });

export const resetPassword = (token: string, newPassword: string) =>
  apiRequest<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ token, newPassword }),
  });

export const register = (name: string, email: string, password: string) =>
  apiRequest<{ token: string; user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ name, email, password }),
  });

export const getCurrentUser = () =>
  apiRequest<{ user: AuthUser }>('/api/auth/me');

export const listStaffAccounts = () =>
  apiRequest<{ users: StaffAccount[]; pagination: { total: number } }>('/api/admin/users?limit=100');

export const createManagedAccount = (account: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'rider' | 'warehouse' | 'branch' | 'carrier';
  phone?: string;
  branchId?: string;
}) => apiRequest<{ user: StaffAccount }>('/api/admin/users', {
  method: 'POST',
  body: JSON.stringify(account),
});

export const createBranch = (name: string, phone?: string) =>
  apiRequest<{ branch: { _id: string; name: string } }>('/api/admin/branches', {
    method: 'POST',
    body: JSON.stringify({ name, phone }),
  });

export const updateStaffAccount = (
  id: string,
  changes: Partial<Pick<StaffAccount, 'name' | 'phone' | 'role' | 'status' | 'branchId'>>,
) =>
  apiRequest<{ user: StaffAccount }>(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });

export const resetStaffPassword = (id: string, newPassword: string) =>
  apiRequest<{ user: StaffAccount }>(`/api/admin/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });

export const assignShipmentCarrier = (shipmentId: string, carrier: string) =>
  apiRequest<{ shipment: unknown }>(`/api/shipments/${shipmentId}/assign-carrier`, {
    method: 'POST',
    body: JSON.stringify({ carrier }),
  });

export const assignShipmentBranch = (shipmentId: string, branchId: string) =>
  apiRequest<{ shipment: unknown }>(`/api/shipments/${shipmentId}/assign-branch`, {
    method: 'POST',
    body: JSON.stringify({ branchId }),
  });

export const listBranches = () =>
  apiRequest<{ branches: { _id: string; name: string }[] }>('/api/admin/branches');

export const updateProfile = (profile: { name?: string; phone?: string; newPassword?: string; photo?: File }) => {
  const form = new FormData();
  if (profile.name) form.set('name', profile.name);
  if (profile.phone) form.set('phone', profile.phone);
  if (profile.newPassword) form.set('newPassword', profile.newPassword);
  if (profile.photo) form.set('photo', profile.photo);
  return apiRequest<{ user: AuthUser }>('/api/profile', { method: 'PATCH', body: form, headers: {} });
};