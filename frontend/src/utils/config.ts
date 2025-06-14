/**
 * Application Configuration
 * Centralizes environment variables and configuration
 * Note: Environment variables are loaded via next.config.mjs
 */

// Debug: Let's see what's actually being loaded
console.log('🔍 Debug - Environment variables:');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FIREBASE_ADMIN_SDK:', process.env.FIREBASE_ADMIN_SDK);
console.log('🔍 All NEXT_PUBLIC_ vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')));
console.log('🔍 Raw process.env.NEXT_PUBLIC_API_URL type:', typeof process.env.NEXT_PUBLIC_API_URL);
console.log('🔍 Raw process.env.NEXT_PUBLIC_API_URL length:', process.env.NEXT_PUBLIC_API_URL?.length);

export const config = {
  // API Configuration - TEMPORARILY HARDCODED
  apiUrl: 'https://roomiez-production.up.railway.app',
  
  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// Debug: Let's see what config.apiUrl resolves to
console.log('🔍 Debug - Final config.apiUrl:', config.apiUrl);

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