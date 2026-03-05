import { create } from 'zustand';

interface AdminStore {
  isAuthenticated: boolean;
  authenticate: () => void;
  logout: () => void;
  checkSession: () => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  isAuthenticated: false,

  authenticate: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('admin_auth', 'true');
    }
    set({ isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_auth');
    }
    set({ isAuthenticated: false });
  },

  checkSession: () => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('admin_auth');
      set({ isAuthenticated: auth === 'true' });
    }
  },
}));
