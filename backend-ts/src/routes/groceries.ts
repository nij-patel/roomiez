import express, { Response } from "express";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { db } from "../config/firebase";
import { GroceryRequest, GroceryItem } from "../types";
import { GroceryAddSchema, validateRequest } from '../utils/validation';
import { logAPI, logBusiness, logDatabase } from '../utils/logger';

const router = express.Router();

router.post(
    "/add", 
    authenticateUser,
    validateRequest(GroceryAddSchema),
    async(req: AuthenticatedRequest, res: Response): Promise <void> => {
        try {
            const user = req.user!;
            const { item, user_email }: GroceryRequest = req.body;
            // Validation is now handled by middleware, so we can trust the data

            // get user's house_id

            const userDoc = await db.collection("users").doc(user.uid).get()
            const userData = userDoc.data()
            const houseId = userData?.house_id;

            if (!houseId){
                res.status(404).json({
                    error: "Not found", 
                    message: "User is not in a house"
                });
                return;
            }

            // Verify that the assigned user is in the same house
            const assignedUserQuery = await db
            .collection("users")
            .where("email", "==", user_email)
            .where("house_id", "==", houseId)
            .limit(1)
            .get();
            
            if (assignedUserQuery.empty) {
                res.status(400).json({
                error: "Bad Request",
                message: "Assigned user is not in your house"
            });
            return;
            }

            // Get user's first name from Firestore user document
            const currentUserDoc = await db.collection("users").doc(user.uid).get();
            const currentUserData = currentUserDoc.data();
            const userFirstName = currentUserData?.firstName || user.email?.split('@')[0] || 'Unknown User';

            const groceryData: Omit<GroceryItem, "grocery_id"> = {
                item_name: item,
                house_id: houseId,
                added_by: userFirstName,
                completed: false,
                added_at: new Date()
            }

            // Add grocery to Firestore
            const groceryRef = await db.collection("groceries").add(groceryData);


            logBusiness.groceryAdded(item, user.email!);

            res.status(201).json({
                message: "Grocery added successfully",
                data: {
                    grocery_id: groceryRef.id,
                    ...groceryData
                }
            });
        } catch (error) {
            logAPI.error('POST', '/grocery/add', error instanceof Error ? error.message : String(error));
            res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to add grocery"
            });
        }
    }
)

// IMPORTANT: /all-groceries route must come BEFORE /:grocery_id route
// to prevent Express from matching "all-groceries" as a grocery_id parameter
router.delete(
    "/all-groceries",
    authenticateUser,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const user = req.user!;
            
            const userDoc = await db.collection("users").doc(user.uid).get();
            const userData = userDoc.data();

            if (!userData?.house_id){
                res.status(404).json({
                    error: "Not Found",
                    message: "User is not in a house"
                });
                return;
            }

            const groceries = await db.collection("groceries").where("house_id", "==", userData.house_id).get();

            if (groceries.empty){
                res.json({
                    message: "Grocery list is already empty"
                });
                return;
            }

            const batch = db.batch();

            groceries.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            logBusiness.groceryListCleared(userData.house_id, user.email!);

            res.json({
                message: "All groceries deleted successfully"
            });
        } catch (error) {
            logAPI.error('DELETE', '/grocery/all-groceries', error instanceof Error ? error.message : String(error));
            res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to delete groceries"
            });
        }
    }
)

router.delete(
    "/:grocery_id",
    authenticateUser, 
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { grocery_id } = req.params;
            const user = req.user!;

            if (!grocery_id) {
                res.status(400).json({
                    error: "Bad Request",
                    message: "grocery_id is required"
                });
                return;
            }

            const groceryDoc = await db.collection("groceries").doc(grocery_id).get();

            if (!groceryDoc.exists){
                res.status(404).json({
                    error: "Not Found", 
                    message: "Grocery not found"
                });
                return;
            }

            const groceryData = groceryDoc.data() as GroceryItem;

            // verify that the user is a member of the house
            const userDoc = await db.collection("users").doc(user.uid).get();
            const userData = userDoc.data();

            if (groceryData.house_id !== userData?.house_id){
                res.status(403).json({
                    error: "Forbidden", 
                    message: "You can only delete groceries in your house"
                });
                return;
            }

            await db.collection("groceries").doc(grocery_id).delete();
            logBusiness.groceryDeleted(groceryData.item_name, user.email!);

            res.json({
                message: "Grocery item deleted successfully",
                data: {
                    grocery_id,
                    deleted_at: new Date().toISOString()
                }
            });
        } catch (error) {
            logAPI.error('DELETE', `/grocery/${req.params.grocery_id}`, error instanceof Error ? error.message : String(error));
            res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to delete grocery item"
            });
        }
    }
);

router.get(
    "/my-house",
    authenticateUser, 
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const user = req.user!
            const userDoc = await db.collection("users").doc(user.uid).get()
            const userData = userDoc.data()


            if (!userData?.house_id){
                res.status(404).json({
                    error: "Not Found",
                    message: "User is not in a house"
                });
                return;
            }

            const groceryData = await db
                .collection("groceries")
                .where("house_id", "==", userData.house_id)
                .get();
            
            const groceries: GroceryItem[] = groceryData.docs
                .map((doc) => {
                  const data = doc.data() as any; // Use any to handle Firestore Timestamp conversion
                  return {
                    grocery_id: doc.id,
                    item_name: data.item_name,
                    house_id: data.house_id,
                    added_by: data.added_by,
                    completed: data.completed,
                    // Convert Firestore Timestamp to JavaScript Date
                    added_at: data.added_at instanceof Date ? data.added_at : data.added_at.toDate()
                  } as GroceryItem;
                })
                .sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime()); // Sort by newest first
              
            res.json({
                message: "House groceries retrieved successfully",
                groceries: groceries
            })

        } catch (error) {
            console.error("❌ Error fetching groceries:", error);
            res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to fetch chores "
            });
        }
    }
)
export default router;