from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from firebase import verify_firebase_token

app = FastAPI()

# Allow frontend requests from localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Roomiez Backend Running"}

def get_current_user(authorization: str = Header(None)):
    """Middleware to verify Firebase Auth token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    token = authorization.split(" ")[1]
    decoded_token = verify_firebase_token(token)
    
    if not decoded_token:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return decoded_token

@app.get("/protected")
def protected_route(user=Depends(get_current_user)):
    """Example protected route"""
    return {"message": f"Hello, {user['email']}! This is a protected route."}