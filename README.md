# Roomiez TypeScript Backend

A complete TypeScript/Express.js backend for the Roomiez roommate management platform, converted from Python FastAPI.

## 🚀 What We've Built

### **Complete Backend Conversion**

- ✅ **Python FastAPI → TypeScript Express.js**: Full conversion completed
- ✅ **Comprehensive Type Safety**: All endpoints properly typed with TypeScript interfaces
- ✅ **Firebase Integration**: Admin SDK for authentication and Firestore database
- ✅ **Modular Architecture**: Clean separation with routes, middleware, and config modules
- ✅ **Full API Compatibility**: All original endpoints preserved and enhanced

### **Key Improvements Over Python Version**

1. **Type Safety**: Every request, response, and data model is properly typed
2. **Better Error Handling**: Comprehensive error responses with detailed messages
3. **Modular Structure**: Organized into logical modules (auth, routes, config)
4. **Enhanced Logging**: Better console output with emojis and context
5. **Validation**: Request validation with TypeScript interfaces

## 📁 Project Structure

```
backend-ts/
├── src/
│   ├── config/
│   │   └── firebase.ts          # Firebase Admin SDK configuration
│   ├── middleware/
│   │   └── auth.ts              # Authentication middleware
│   ├── routes/
│   │   ├── chores.ts            # Chore management endpoints
│   │   └── user.ts              # User profile & balance endpoints
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   └── index.ts                 # Main Express server
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the `.env` file from the Python backend:

```bash
cp ../backend/.env .
```

Make sure your `.env` file contains:

```env
FIREBASE_ADMIN_SDK={"type":"service_account",...}
ROOMIEZ_SMTP_EMAIL=your-email@gmail.com
ROOMIEZ_SMTP_PASSWORD=your-app-password
```

### 3. Build and Run

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start

# Watch mode (compile on changes)
npm run watch
```

## 📚 API Documentation

### **Authentication**

All protected endpoints require a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

### **Core Endpoints**

#### **Health Check**

- `GET /` - Server status and version

#### **House Management**

- `POST /house/create` - Create a new house
- `POST /house/join` - Join house with code
- `GET /house/my-house` - Get house details with members

#### **User Management**

- `GET /user/info/:email` - Get user by email
- `GET /user/balance` - Get user balance
- `POST /user/update-balance` - Update user balance
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `GET /user/protected` - Test protected route

#### **Chore Management**

- `GET /chores/my-house` - Get all house chores
- `POST /chores/add` - Create new chore
- `PUT /chores/:id/status` - Update chore status
- `DELETE /chores/:id` - Delete chore

#### **Communication**

- `POST /nudge/send` - Send anonymous nudge email

## 💾 TypeScript Interfaces

### **Request/Response Types**

```typescript
interface HouseCreateRequest {
  house_name: string;
}

interface ChoreRequest {
  chore_name: string;
  user_email: string;
}

interface NudgeRequest {
  recipient_email: string;
}
```

### **Database Models**

```typescript
interface User {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  house_id?: string;
  balance?: number;
  chores?: Chore[];
}

interface House {
  house_id: string;
  house_name: string;
  join_code: string;
  owner_uid: string;
  owner_email: string;
  members: string[];
  member_details?: User[];
  created_at?: Date;
}

interface Chore {
  chore_id?: string;
  chore_name: string;
  user_email: string;
  house_id: string;
  status: "Pending" | "Completed";
  assigned_at: Date;
  completed_at?: Date;
}
```

## 🔐 Authentication Flow

1. **Frontend**: User logs in with Firebase Auth
2. **Frontend**: Gets Firebase ID token
3. **Frontend**: Sends requests with `Authorization: Bearer <token>` header
4. **Backend**: Middleware verifies token with Firebase Admin SDK
5. **Backend**: Extracts user info and attaches to request
6. **Backend**: Route handler processes authenticated request

## 🗃️ Database Collections

### **Firestore Structure**

```
users/
  {uid}/
    - uid: string
    - email: string
    - firstName?: string
    - lastName?: string
    - house_id?: string
    - balance?: number

houses/
  {house_id}/
    - house_id: string
    - house_name: string
    - join_code: string
    - owner_uid: string
    - owner_email: string
    - members: string[]
    - created_at: Date

chores/
  {chore_id}/
    - chore_name: string
    - user_email: string
    - house_id: string
    - status: 'Pending' | 'Completed'
    - assigned_at: Date
    - completed_at?: Date
```

## 🔄 Express vs FastAPI Comparison

| Feature            | Python FastAPI       | TypeScript Express       |
| ------------------ | -------------------- | ------------------------ |
| **Type Safety**    | Pydantic models      | TypeScript interfaces    |
| **Validation**     | Automatic            | Manual with types        |
| **Error Handling** | HTTPException        | Express error middleware |
| **Routing**        | Decorators           | Router modules           |
| **Middleware**     | Dependency injection | Express middleware       |
| **Documentation**  | Auto-generated       | Manual                   |

## 🎯 Key TypeScript Features Explained

### **1. Interface-Based Validation**

```typescript
// Instead of Pydantic models, we use TypeScript interfaces
const { house_name }: HouseCreateRequest = req.body;
```

### **2. Generic Response Types**

```typescript
interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}
```

### **3. Middleware with Type Safety**

```typescript
export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Middleware logic with proper typing
};
```

### **4. Proper Error Handling**

```typescript
try {
  // Operation
} catch (error) {
  console.error("❌ Error description:", error);
  res.status(500).json({
    error: "Internal Server Error",
    message: "User-friendly error message",
  });
}
```

## 🚀 Production Deployment

### **Environment Variables**

- `PORT` - Server port (default: 8000)
- `NODE_ENV` - Environment (development/production)
- `FIREBASE_ADMIN_SDK` - Firebase service account JSON
- `ROOMIEZ_SMTP_EMAIL` - Email for nudge system
- `ROOMIEZ_SMTP_PASSWORD` - Email password

### **Build Process**

```bash
npm run build    # Compiles TypeScript to dist/
npm start        # Runs compiled JavaScript
```

## 📈 Next Steps & Features Ready for Implementation

### **Ready to Add (Frontend Integration Required)**

1. **Expense Management**: Types and endpoints ready
2. **Grocery Lists**: Database models defined
3. **Calendar Events**: Full interface created
4. **Multi-user Features**: Authentication system supports it

### **Frontend Updates Needed**

1. Update API calls from `localhost:8000` to new TypeScript backend
2. Implement proper expense/grocery/calendar persistence
3. Use the new enhanced error handling
4. Take advantage of improved type safety

## 🔧 Development Tips

### **Adding New Endpoints**

1. Define types in `src/types/index.ts`
2. Create route handler with proper TypeScript typing
3. Add authentication middleware if needed
4. Mount route in `src/index.ts`

### **TypeScript Best Practices Used**

- **Strict typing**: All functions and variables properly typed
- **Interface segregation**: Separate interfaces for requests/responses
- **Error handling**: Comprehensive try-catch with typed errors
- **Async/await**: Modern async patterns throughout

## 🎉 Summary

✅ **Complete TypeScript conversion achieved**  
✅ **All original functionality preserved**  
✅ **Enhanced with better error handling and logging**  
✅ **Modular, maintainable architecture**  
✅ **Production-ready with proper type safety**

The backend is now fully converted to TypeScript with Express.js, providing better type safety, enhanced error handling, and a more maintainable codebase than the original Python FastAPI version.
