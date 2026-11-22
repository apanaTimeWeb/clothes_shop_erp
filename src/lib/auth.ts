export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  store: string;
  loginAt: string;
}

export interface DemoAccount {
  id: string;
  label: string;
  name: string;
  email: string;
  password: string;
  role: string;
  store: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "admin",
    label: "Admin / Manager",
    name: "Satya (Admin)",
    email: "admin@threadandform.com",
    password: "adminpassword123",
    role: "Administrator",
    store: "Flagship Showroom (Central)",
  },
  {
    id: "staff",
    label: "Showroom Staff",
    name: "Rohit (Sales Staff)",
    email: "staff@threadandform.com",
    password: "staffpassword123",
    role: "Staff (Sales & POS)",
    store: "Downtown Studio",
  },
  {
    id: "stylist",
    label: "Visual Stylist",
    name: "Ananya (Studio Stylist)",
    email: "stylist@threadandform.com",
    password: "stylistpassword123",
    role: "Visual Stylist",
    store: "Flagship Showroom (Central)",
  },
];

export const DEFAULT_DEMO_CREDENTIALS = DEMO_ACCOUNTS[0];

const AUTH_STORAGE_KEY = "thread_and_form_auth_user";
const LOGGED_OUT_KEY = "thread_and_form_logged_out";

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const isLoggedOut = localStorage.getItem(LOGGED_OUT_KEY);
    if (isLoggedOut === "true") return null;

    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as AuthUser;
    }

    // Default demo session if user hasn't explicitly logged out
    const initialUser: AuthUser = {
      id: DEFAULT_DEMO_CREDENTIALS.id,
      name: DEFAULT_DEMO_CREDENTIALS.name,
      email: DEFAULT_DEMO_CREDENTIALS.email,
      role: DEFAULT_DEMO_CREDENTIALS.role,
      store: DEFAULT_DEMO_CREDENTIALS.store,
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(initialUser));
    return initialUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null;
}

export function loginUser(details?: {
  email?: string;
  name?: string;
  role?: string;
  store?: string;
}): AuthUser {
  const match = DEMO_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === (details?.email || "").toLowerCase()
  );

  const user: AuthUser = {
    id: match?.id || `user-${Date.now()}`,
    name: details?.name || match?.name || (details?.email ? details.email.split("@")[0] : DEFAULT_DEMO_CREDENTIALS.name),
    email: details?.email || DEFAULT_DEMO_CREDENTIALS.email,
    role: details?.role || match?.role || DEFAULT_DEMO_CREDENTIALS.role,
    store: details?.store || match?.store || DEFAULT_DEMO_CREDENTIALS.store,
    loginAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(LOGGED_OUT_KEY);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {}
  }
  return user;
}

export function logoutUser(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.setItem(LOGGED_OUT_KEY, "true");
    } catch {}
  }
}
