import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
from dotenv import load_dotenv
import json

# Get Firebase secret from .env file
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)
firebase_secret = os.getenv("FIREBASE_ADMIN_SDK")

if not firebase_secret:
    raise ValueError("FIREBASE_ADMIN_SDK is not set in .env file")

# Ensure the JSON is properly formatted
try:
    firebase_config = json.loads(firebase_secret)
except json.JSONDecodeError as e:
    raise ValueError("Invalid JSON format for FIREBASE_ADMIN_SDK") from e

# Initialize Firebase (Ensure it's only initialized once)
if not firebase_admin._apps:
    cred = credentials.Certificate(firebase_config)
    firebase_admin.initialize_app(cred)

# Initialize Firestore DB
db = firestore.client()

""" 
Every time someone logs in via Firebase Auth, it creates a new user in the database and creates
a token. This function verifies the token and returns decoded user info.
""" 
def verify_firebase_token(token: str):
    """Verify Firebase Auth token"""
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token  # Contains uid, email, and other user info
    except Exception as e:
        print("Token verification failed:", e)
        return None
