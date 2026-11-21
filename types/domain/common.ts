export interface ActionState<T = undefined> {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
}

export interface NavItem {
  label: string;
  href: string;
  iconName: 'dashboard' | 'garages' | 'verifications' | 'rentals' | 'reports' | 'rent';
  badgeCount?: number;
}
