import firebase_admin
from firebase_admin import credentials, auth

# Load Firebase Admin SDK credentials
cred = credentials.Certificate("firebaseAdminConfig.json")
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