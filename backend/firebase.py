import firebase_admin
from firebase_admin import credentials, auth
import os
from dotenv import load_dotenv
import json

# Load environment variables from .env file
load_dotenv()

# Get Firebase secret from environment variable
firebase_secret = os.getenv("FIREBASE_ADMIN_SDK")
firebase_config = json.loads(firebase_secret)

# Initialize Firebase n with credentials
cred = credentials.Certificate(firebase_config)
firebase_admin.initialize_app(cred)

""" 
every time someone logs in via Firebase Auth, it creates a new user in the database, and creates
a token. this returns the decoded token, which contains the user's uid, email, and other info.
""" 
def verify_firebase_token(token: str):
    """Verify Firebase Auth token"""
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print("Token verification failed:", e)
        return None