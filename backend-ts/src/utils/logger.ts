import winston from 'winston';

/**
 * Production-ready logging configuration
 * Uses Winston for structured logging with different levels
 */

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which logs to print based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different log formats
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  }),
  
  // File transport for errors (always enabled)
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: prodFormat,
  }),
  
  // File transport for all logs (only in production)
  ...(process.env.NODE_ENV === 'production' ? [
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: prodFormat,
    })
  ] : []),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

/**
 * Structured logging functions for different contexts
 */

export const logAuth = {
  success: (email: string, action: string) => 
    logger.info(`🔐 Auth Success: ${action} for ${email}`),
  
  failure: (email: string, action: string, error?: string) => 
    logger.warn(`🔐 Auth Failure: ${action} for ${email}${error ? ` - ${error}` : ''}`),
  
  tokenVerified: (email: string) => 
    logger.info(`✅ Token verified for user: ${email}`),
  
  tokenFailed: (error: string) => 
    logger.warn(`❌ Token verification failed: ${error}`),
};

export const logAPI = {
  request: (method: string, path: string, userEmail?: string) => 
    logger.http(`📡 ${method} ${path}${userEmail ? ` - User: ${userEmail}` : ''}`),
  
  response: (method: string, path: string, statusCode: number, duration?: number) => 
    logger.http(`📤 ${method} ${path} - ${statusCode}${duration ? ` (${duration}ms)` : ''}`),
  
  error: (method: string, path: string, error: string) => 
    logger.error(`❌ ${method} ${path} - Error: ${error}`),
};

export const logDatabase = {
  query: (collection: string, operation: string, userEmail?: string) => 
    logger.debug(`🗄️ DB ${operation} on ${collection}${userEmail ? ` by ${userEmail}` : ''}`),
  
  success: (collection: string, operation: string, count?: number) => 
    logger.debug(`✅ DB ${operation} on ${collection}${count ? ` (${count} docs)` : ''} - Success`),
  
  error: (collection: string, operation: string, error: string) => 
    logger.error(`❌ DB ${operation} on ${collection} - Error: ${error}`),
};

export const logBusiness = {
  houseCreated: (houseName: string, ownerEmail: string, joinCode: string) => 
    logger.info(`🏠 House "${houseName}" created by ${ownerEmail} with join code: ${joinCode}`),
  
  houseJoined: (houseName: string, userEmail: string) => 
    logger.info(`🚪 User ${userEmail} joined house: ${houseName}`),
  
  choreAssigned: (choreName: string, assignedTo: string, assignedBy: string) => 
    logger.info(`✅ Chore "${choreName}" assigned to ${assignedTo} by ${assignedBy}`),
  
  choreCompleted: (choreId: string, userEmail: string) => 
    logger.info(`📝 Chore ${choreId} completed by ${userEmail}`),
  
  choreDeleted: (choreId: string, userEmail: string) => 
    logger.info(`🗑️ Chore ${choreId} deleted by ${userEmail}`),
  
  expenseCreated: (description: string, amount: number, splitCount: number) => 
    logger.info(`💰 Expense created: ${description} for $${amount} split ${splitCount} ways`),
  
  paymentSettled: (fromEmail: string, toEmail: string, amount: number) => 
    logger.info(`💸 Settlement: ${fromEmail} paid $${amount} to ${toEmail}`),
  
  groceryAdded: (item: string, userEmail: string) => 
    logger.info(`🛒 Grocery item "${item}" added by ${userEmail}`),
  
  groceryDeleted: (item: string, userEmail: string) => 
    logger.info(`🗑️ Grocery item "${item}" deleted by ${userEmail}`),
  
  groceryListCleared: (houseId: string, userEmail: string) => 
    logger.info(`🧹 All groceries cleared for house ${houseId} by ${userEmail}`),
  
  reservationCreated: (location: string, date: string, time: string, userEmail: string) => 
    logger.info(`✅ Reservation created for ${location} by ${userEmail} on ${date} at ${time}`),
  
  reservationDeleted: (reservationId: string, location: string, userEmail: string) => 
    logger.info(`🗑️ Reservation ${reservationId} for ${location} deleted by ${userEmail}`),
  
  nudgeSent: (recipientEmail: string) => 
    logger.info(`📧 Nudge sent to ${recipientEmail}`),
};

export const logSystem = {
  startup: (port: number, env: string) => 
    logger.info(`🚀 Roomiez TypeScript Backend running on port ${port} (${env})`),
  
  shutdown: () => 
    logger.info(`🛑 Server shutting down`),
  
  error: (context: string, error: string) => 
    logger.error(`💥 System Error in ${context}: ${error}`),
  
  warning: (context: string, message: string) => 
    logger.warn(`⚠️ System Warning in ${context}: ${message}`),
};

// Export the main logger for custom use cases
export default logger; 