// Firebase User types
export interface DecodedToken {
  uid: string;
  email: string;
  name?: string;
  [key: string]: any;
}

// Request/Response models
export interface HouseCreateRequest {
  house_name: string;
}

export interface HouseJoinRequest {
  join_code: string;
}

export interface ChoreRequest {
  chore_name: string;
  user_email: string;
  username: string;
}

export interface NudgeRequest {
  recipient_email: string;
}

export interface UpdateBalanceRequest {
  amount: number;
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

// Database models
export interface User {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  house_id?: string;
  balance?: number;
  chores?: Chore[];
}

export interface House {
  house_id: string;
  house_name: string;
  join_code: string;
  owner_uid: string;
  owner_email: string;
  members: string[];
  member_details?: User[];
  created_at?: Date;
}

export interface Chore {
  chore_id?: string;
  chore_name: string;
  user_email: string;
  username: string;
  house_id: string;
  status: "Pending" | "Completed";
  assigned_at: Date;
  completed_at?: Date;
}

export interface Expense {
  expense_id: string;
  amount: number;
  description: string;
  paid_by: string;
  split_between: string[];
  amount_per_person: number;
  house_id: string;
  settled: boolean;
  created_at: Date;
}

export interface GroceryItem {
  grocery_id: string;
  item_name: string;
  house_id: string;
  added_by: string;
  completed: boolean;
  added_at: Date;
}

export interface GroceryRequest {
  item: string;
  user_email: string;
}

export interface CalendarEvent {
  event_id: string;
  title: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  location?: string;
  created_by: string;
  house_id: string;
  attendees: string[];
}

export interface Reservation {
  reservation_id: string;
  house_id: string;
  start_time: string; // HH:MM format
  end_time: string;   // HH:MM format
  date: string;       // YYYY-MM-DD format
  person_email: string;
  person_id: string;
  person_firstname: string;
  location: "Living Room" | "Kitchen" | "Shower";
  created_at: Date;
}

export interface CreateReservationRequest {
  start_time: string;
  end_time: string;
  date: string;
  location: "Living Room" | "Kitchen" | "Shower";
  event_name?: string; // Optional for display purposes
}

// API Response models
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export interface UserBalance {
  balance: number;
}

// Email configuration
export interface EmailConfig {
  smtp_server: string;
  smtp_port: number;
  smtp_email: string;
  smtp_password: string;
}

// Error handling
export interface ApiError {
  status_code: number;
  detail: string;
} 