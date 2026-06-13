import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Navigation Store ───────────────────────────────────────────────

export type Page =
  | 'home'
  | 'products'
  | 'product-detail'
  | 'services'
  | 'service-detail'
  | 'cart'
  | 'checkout'
  | 'order-confirmation'
  | 'order-tracking'
  | 'account-orders'
  | 'account-measurements'
  | 'account-profile'
  | 'admin-dashboard'
  | 'admin-products'
  | 'admin-services'
  | 'admin-orders'
  | 'admin-coupons'
  | 'admin-portfolio'
  | 'login';

interface NavigationState {
  currentPage: Page;
  pageParams: Record<string, string>;
  navigate: (page: Page, params?: Record<string, string>) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 'home',
  pageParams: {},
  navigate: (page, params = {}) =>
    set({ currentPage: page, pageParams: params }),
}));

// ─── Cart Store ─────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  itemType: 'product' | 'service';
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  colorHex?: string;
  measurementData?: Record<string, number | string>;
  image?: string;
  requiresAppointment?: boolean;
  appointmentDate?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateMeasurement: (id: string, data: Record<string, number | string>) => void;
  updateAppointment: (id: string, date: string) => void;
  updateSize: (id: string, size: string) => void;
  updateColor: (id: string, color: string, colorHex?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) =>
        set((state) => {
          // Check if same item with same options already exists
          const existingIndex = state.items.findIndex(
            (existing) =>
              existing.itemId === item.itemId &&
              existing.itemType === item.itemType &&
              existing.size === item.size &&
              existing.color === item.color
          );

          if (existingIndex > -1) {
            // Update quantity of existing item
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + item.quantity,
            };
            return { items: updatedItems };
          }

          // Add new item with unique id
          const newItem: CartItem = {
            ...item,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          };
          return { items: [...state.items, newItem] };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
          ).filter((item) => item.quantity > 0),
        })),

      updateMeasurement: (id, data) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, measurementData: data } : item
          ),
        })),

      updateAppointment: (id, date) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, appointmentDate: date } : item
          ),
        })),

      updateSize: (id, size) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, size } : item
          ),
        })),

      updateColor: (id, color, colorHex) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, color, colorHex } : item
          ),
        })),

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      setCartOpen: (open) => set({ isOpen: open }),

      total: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      itemCount: () =>
        get().items.reduce((count, item) => count + item.quantity, 0),
    }),
    {
      name: 'tailored-for-her-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// ─── Auth Store ─────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      isAdmin: false,

      login: (user) =>
        set({
          user,
          isLoggedIn: true,
          isAdmin: user.role === 'admin',
        }),

      logout: () =>
        set({
          user: null,
          isLoggedIn: false,
          isAdmin: false,
        }),
    }),
    {
      name: 'tailored-for-her-auth',
    }
  )
);
