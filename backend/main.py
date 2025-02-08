from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from firebase import db, verify_firebase_token
from pydantic import BaseModel
import uuid

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

# Model for Creating a House
class HouseCreateRequest(BaseModel):
	house_name: str

# Model for Joining a House
class HouseJoinRequest(BaseModel):
	join_code: str

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
def get_my_house(user=Depends(get_current_user)):
    user_doc = db.collection("users").document(user["uid"]).get()

    if not user_doc.exists or "house_id" not in user_doc.to_dict():
        raise HTTPException(status_code=404, detail="User is not in a house")

    house_id = user_doc.to_dict()["house_id"]
    house_ref = db.collection("houses").document(house_id).get()

    if not house_ref.exists:
        raise HTTPException(status_code=404, detail="House not found")

    return house_ref.to_dict()

@app.get("/protected")
def protected_route(user=Depends(get_current_user)):
	"""Example protected route"""
	return {"message": f"Hello, {user['email']}! This is a protected route."}