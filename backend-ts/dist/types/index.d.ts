export interface DecodedToken {
    uid: string;
    email: string;
    name?: string;
    [key: string]: any;
}
export interface HouseCreateRequest {
    house_name: string;
}
export interface HouseJoinRequest {
    join_code: string;
}
export interface ChoreRequest {
    chore_name: string;
    user_email: string;
}
export interface NudgeRequest {
    recipient_email: string;
}
export interface UpdateBalanceRequest {
    amount: number;
}
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
    house_id: string;
    split_between: string[];
    created_at: Date;
}
export interface GroceryItem {
    grocery_id: string;
    item_name: string;
    quantity?: number;
    added_by: string;
    house_id: string;
    completed: boolean;
    added_at: Date;
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
export interface ApiResponse<T = any> {
    message: string;
    data?: T;
    error?: string;
}
export interface UserBalance {
    balance: number;
}
export interface EmailConfig {
    smtp_server: string;
    smtp_port: number;
    smtp_email: string;
    smtp_password: string;
}
export interface ApiError {
    status_code: number;
    detail: string;
}
//# sourceMappingURL=index.d.ts.map