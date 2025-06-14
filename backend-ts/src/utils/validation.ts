import { z } from 'zod';

/**
 * Validation Schemas for API Requests
 * Using Zod for runtime type checking and validation
 */

// House Management Schemas
export const HouseCreateSchema = z.object({
  house_name: z.string()
    .min(1, "House name is required")
    .max(100, "House name must be less than 100 characters")
    .trim()
});

export const HouseJoinSchema = z.object({
  join_code: z.string()
    .min(1, "Join code is required")
    .max(20, "Invalid join code format")
    .trim()
});

// Chore Management Schemas
export const ChoreCreateSchema = z.object({
  chore_name: z.string()
    .min(1, "Chore name is required")
    .max(200, "Chore name must be less than 200 characters")
    .trim(),
  user_email: z.string()
    .email("Invalid email format"),
  username: z.string()
    .min(1, "Username is required")
    .max(100, "Username must be less than 100 characters")
    .trim()
});

export const ChoreStatusUpdateSchema = z.object({
  status: z.enum(["Pending", "Completed"], {
    errorMap: () => ({ message: "Status must be either 'Pending' or 'Completed'" })
  })
});

// Expense Management Schemas
export const ExpenseCreateSchema = z.object({
  amount: z.number()
    .positive("Amount must be positive")
    .max(999999.99, "Amount too large")
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: "Amount can only have up to 2 decimal places"
    }),
  description: z.string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters")
    .trim(),
  split_between: z.array(z.string().email("Invalid email format"))
    .min(1, "At least one person must be included in the split")
    .max(20, "Too many people in split")
});

export const ExpenseSettleSchema = z.object({
  amount: z.number()
    .positive("Amount must be positive")
    .max(999999.99, "Amount too large")
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: "Amount can only have up to 2 decimal places"
    }),
  to_email: z.string()
    .email("Invalid email format"),
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .trim()
    .optional()
});

// Grocery Management Schemas
export const GroceryAddSchema = z.object({
  item: z.string()
    .min(1, "Item name is required")
    .max(200, "Item name must be less than 200 characters")
    .trim(),
  user_email: z.string()
    .email("Invalid email format")
});

// Calendar/Reservation Schemas
export const ReservationCreateSchema = z.object({
  start_time: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:MM"),
  end_time: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:MM"),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
  location: z.enum(["Living Room", "Kitchen", "Shower"], {
    errorMap: () => ({ message: "Location must be 'Living Room', 'Kitchen', or 'Shower'" })
  }),
  event_name: z.string()
    .max(200, "Event name must be less than 200 characters")
    .trim()
    .optional()
}).refine((data) => {
  // Validate that end_time is after start_time
  const [startHour, startMin] = data.start_time.split(':').map(Number);
  const [endHour, endMin] = data.end_time.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes > startMinutes;
}, {
  message: "End time must be after start time",
  path: ["end_time"]
}).refine((data) => {
  // Validate that date is not in the past
  const inputDate = new Date(data.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
}, {
  message: "Date cannot be in the past",
  path: ["date"]
});

// User Management Schemas
export const UserBalanceUpdateSchema = z.object({
  amount: z.number()
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: "Amount can only have up to 2 decimal places"
    })
});

export const UserProfileUpdateSchema = z.object({
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .trim()
    .optional(),
  lastName: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .trim()
    .optional()
});

// Nudge Schema
export const NudgeSchema = z.object({
  recipient_email: z.string()
    .email("Invalid email format")
});

/**
 * Validation middleware factory
 * Creates middleware that validates request body against a Zod schema
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData; // Replace with validated/sanitized data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Invalid request data",
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Validation failed"
      });
    }
  };
};

/**
 * Validation helper for query parameters
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Invalid query parameters",
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Query validation failed"
      });
    }
  };
}; 