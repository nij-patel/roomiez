/**
 * Application Configuration
 * Centralizes environment variables and configuration
 */

export const config = {
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  
  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

/**
 * Helper function to build API URLs
 */
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${config.apiUrl}/${cleanEndpoint}`;
};

/**
 * Conditional logging - only log in development
 */
export const devLog = (...args: any[]): void => {
  if (config.isDevelopment) {
    console.log(...args);
  }
};

export const devError = (...args: any[]): void => {
  if (config.isDevelopment) {
    console.error(...args);
  }
}; 