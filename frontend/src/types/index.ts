// User related types
export interface User {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  balance?: number;
  house_id?: string;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  getIdToken: () => Promise<string>;
}

// House related types
export interface House {
  house_id: string;
  house_name: string;
  join_code: string;
  owner_uid: string;
  owner_email: string;
  members: string[];
  member_details?: HouseMember[];
}

export interface HouseMember {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  balance?: number;
  chores?: Chore[];
}

// Chore related types
export interface Chore {
  chore_id?: string;
  house_id: string;
  user_email: string;
  chore_name: string;
  username?: string;
  status?: 'Pending' | 'Completed';
  assigned_at?: Date;
  completed_at?: Date;
}

// Expense related types
export interface Expense {
  expense_id: string;
  amount: number;
  description: string;
  paid_by: string;
  house_id: string;
  split_between: string[];
  amount_per_person: number;
  created_at: Date;
  settled: boolean;
}

export interface CreateExpenseRequest {
  amount: number;
  description: string;
  split_between: string[];
}

export interface SettleExpenseRequest {
  amount: number;
  to_email: string;
  description?: string;
}

// Grocery related types
export interface GroceryItem {
  id: string;
  name: string;
  quantity?: number;
  category?: string;
  added_by: string;
  completed: boolean;
}

export interface GroceryList {
  id: string;
  house_id: string;
  items: GroceryItem[];
  last_updated: Date;
}

// Calendar related types
export interface CalendarEvent {
  id: string;
  house_id: string;
  title: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  created_by: string;
  attendees: string[];
  space_reserved?: string;
}

// Transaction related types
export interface Transaction {
  id: string;
  house_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  type: 'expense_split' | 'payment' | 'manual';
  related_expense_id?: string;
  date: Date;
  description?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}

// Form data types
export interface CreateHouseRequest {
  house_name: string;
}

export interface JoinHouseRequest {
  join_code: string;
}

export interface AddChoreRequest {
  chore_name: string;
  user_email: string;
}

export interface NudgeRequest {
  recipient_email: string;
}

export interface UpdateBalanceRequest {
  amount: number;
}

// Navigation types
export interface NavItem {
  label: string;
  icon: any;
  path: string;
  tooltip: string;
} 