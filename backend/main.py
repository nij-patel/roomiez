from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from firebase import db, verify_firebase_token
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import uuid
import smtplib
import random

app = FastAPI()
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = os.getenv("ROOMIEZ_SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("ROOMIEZ_SMTP_PASSWORD")

# Allow frontend requests from localhost:3000
app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:3000"],  # Frontend URL
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

ANONYMOUS_SENDERS = [
    "anon1@nudgebot.com",
    "anon2@nudgebot.com",
    "anon3@nudgebot.com"
]

# Model for Creating a House
class HouseCreateRequest(BaseModel):
	house_name: str

# Model for Joining a House
class HouseJoinRequest(BaseModel):
	join_code: str

class ChoreRequest(BaseModel):
    chore_name: str
    user_email: str  # Assign the chore to a specific user

class NudgeRequest(BaseModel):
    recipient_email: str

@app.get("/")
def home():
	return {"message": "Roomiez Backend Running"}

@app.post("/nudge/send")
def send_nudge(nudge_data: NudgeRequest):
    sender_email = random.choice(ANONYMOUS_SENDERS)
    subject = "You’ve been nudged by a roommate!"
    body = "Hey! You've been anonymously nudged to do your chores by one of your roommates. Quit slacking! 😉"

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            print(SMTP_EMAIL + " " + SMTP_PASSWORD)
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            message = f"From: {sender_email}\nTo: {nudge_data.recipient_email}\nSubject: {subject}\n\n{body}"
            message = message.encode("utf-8")
            server.sendmail(sender_email, nudge_data.recipient_email, message)

        return {"message": "Nudge sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


	

def get_current_user(authorization: str = Header(None)):
	"""Middleware to verify Firebase Auth token"""
	if not authorization or not authorization.startswith("Bearer "):
		raise HTTPException(status_code=403, detail="Unauthorized")
	
	token = authorization.split(" ")[1]
	decoded_token = verify_firebase_token(token)
	
	if not decoded_token:
		raise HTTPException(status_code=401, detail="Invalid token")
	
	return decoded_token

@app.get("/user/info/{email}")
async def get_user_by_email(email: str, user=Depends(get_current_user)):
    """Fetch user details from Firestore by email"""
    users_ref = db.collection("users")
    query = users_ref.where("email", "==", email).limit(1).get()

    if not query:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = query[0].to_dict()
    return user_data

# Create a House (Authenticated)
@app.post("/house/create")
def create_house(request: HouseCreateRequest, user=Depends(get_current_user)):
	house_id = str(uuid.uuid4())  # Generate a unique house ID
	join_code = str(uuid.uuid4())[:6]  # Generate a short join code
	user_uid = user["uid"]

	house_data = {
		"house_id": house_id,
		"house_name": request.house_name,
		"join_code": join_code,
		"owner_uid": user["uid"],  # Store Firebase UID of owner
		"owner_email": user["email"],
		"members": [user["email"]],  # House creator is first member
	}

	db.collection("houses").document(house_id).set(house_data)
	db.collection("users").document(user_uid).set({"house_id": house_id}, merge=True)

	return {
		"message": "House created successfully!",
		"house_id": house_id,
		"join_code": join_code
	}

# Join a House (Authenticated)
@app.post("/house/join")
def join_house(request: HouseJoinRequest, user=Depends(get_current_user)):
	houses_ref = db.collection("houses").where("join_code", "==", request.join_code).stream()

	house = None
	for doc in houses_ref:
		house = doc
		break

	if not house:
		raise HTTPException(status_code=404, detail="Invalid join code")

	house_data = house.to_dict()

	if user["email"] in house_data["members"]:
		raise HTTPException(status_code=400, detail="User already in the house")

	house_data["members"].append(user["email"])
	user_uid = user["uid"]

	db.collection("houses").document(house.id).update({"members": house_data["members"]})
	db.collection("users").document(user_uid).set({"house_id": house.id}, merge=True)

	return {"message": "Joined house successfully!", "house_id": house.id}

@app.get("/house/my-house")
async def get_my_house(user=Depends(get_current_user)):
    """Fetch the house details for the currently logged-in user, including chores."""
    user_ref = db.collection("users").document(user["uid"])
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_doc.to_dict()
    house_id = user_data.get("house_id")

    if not house_id:
        raise HTTPException(status_code=404, detail="User is not in a house")

    house_ref = db.collection("houses").document(house_id)
    house_doc = house_ref.get()

    if not house_doc.exists:
        raise HTTPException(status_code=404, detail="House not found")

    house_data = house_doc.to_dict()

    member_details = []
    
    for email in house_data.get("members", []):
        # Fetch user details
        query = db.collection("users").where("email", "==", email).limit(1).get()
        if query:
            user_details = query[0].to_dict()

            # Fetch chores assigned to this user
            chores_query = db.collection("chores").where("user_email", "==", email).stream()
            user_chores = [{"chore_name": chore.to_dict()["chore_name"], "status": chore.to_dict().get("status", "Pending")} for chore in chores_query]

            # Attach chores to user
            user_details["chores"] = user_chores
            member_details.append(user_details)

    house_data["member_details"] = member_details  # Attach user details with chores

    return house_data

@app.get("/chores/my-house")
def get_house_chores(user=Depends(get_current_user)):
    """Fetch all chores for the logged-in user's house"""
    user_doc = db.collection("users").document(user["uid"]).get()

    if not user_doc.exists or "house_id" not in user_doc.to_dict():
        raise HTTPException(status_code=404, detail="User is not in a house")

    house_id = user_doc.to_dict()["house_id"]
    
    chores_ref = db.collection("chores").where("house_id", "==", house_id).stream()
    chores = [{"id": doc.id, **doc.to_dict()} for doc in chores_ref]

    return {"chores": chores}

@app.post("/chores/add")
def add_chore(request: ChoreRequest, user=Depends(get_current_user)):
    """Add a new chore to the user's house"""
    user_doc = db.collection("users").document(user["uid"]).get()

    if not user_doc.exists or "house_id" not in user_doc.to_dict():
        raise HTTPException(status_code=404, detail="User is not in a house")

    house_id = user_doc.to_dict()["house_id"]
    
    new_chore = {
        "house_id": house_id,
        "user_email": request.user_email,
        "chore_name": request.chore_name,
    }

    db.collection("chores").add(new_chore)
    return {"message": "Chore added successfully!"}

@app.delete("/chores/delete/{chore_id}")
def delete_chore(chore_id: str, user=Depends(get_current_user)):
    """Delete a specific chore by its ID"""
    chore_ref = db.collection("chores").document(chore_id).get()

    if not chore_ref.exists:
        raise HTTPException(status_code=404, detail="Chore not found")

    chore_data = chore_ref.to_dict()
    
    # Ensure the user belongs to the same house
    user_doc = db.collection("users").document(user["uid"]).get()
    user_house_id = user_doc.to_dict().get("house_id")

    if chore_data["house_id"] != user_house_id:
        raise HTTPException(status_code=403, detail="Unauthorized to delete this chore")

    db.collection("chores").document(chore_id).delete()
    return {"message": "Chore deleted successfully!"}



@app.get("/protected")
def protected_route(user=Depends(get_current_user)):
	"""Example protected route"""
	return {"message": f"Hello, {user['email']}! This is a protected route."}

@app.get("/user/balance")
def get_balance(user=Depends(get_current_user)):
    user_uid = user["uid"]
    user_doc = db.collection("users").document(user_uid).get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_doc.to_dict()
    return {"balance": user_data.get("balance", 0)}

@app.post("/user/update-balance")
def update_balance(amount: float, user=Depends(get_current_user)):
    user_uid = user["uid"]
    user_doc_ref = db.collection("users").document(user_uid)

    user_doc = user_doc_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    # Get current balance
    current_balance = user_doc.to_dict().get("balance", 0)

    # Calculate new balance
    new_balance = current_balance + amount

    # Update the user's balance
    user_doc_ref.update({"balance": new_balance})

    return {"message": "Balance updated successfully", "new_balance": new_balance}