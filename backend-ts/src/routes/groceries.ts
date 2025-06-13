import express, { Response } from "express";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { db } from "../config/firebase";
import { GroceryRequest, GroceryItem } from "../types"

const router = express.Router();

router.post(
    "/add", 
    authenticateUser, 
    async(req: AuthenticatedRequest, res: Response): Promise <void> => {
        try {
            const user = req.user!;
            const { item, user_email }: GroceryRequest = req.body

            if (!item || !user_email) {
                res.status(400).json({
                    error: "Bad Request",
                    message: "item and user_email are requrid"
                });
                return;
            }

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

            const groceryData: Omit<GroceryItem, "grocery_id"> = {
                item_name: item,
                house_id: houseId,
                added_by: user.firstName,
                completed: false,
                added_at: new Date()
            }

            // Add grocery to Firestore
            const groceryRef = await db.collection("groceries").add(groceryData);


            res.status(201).json({
                message: "Grocery added successfully",
                data: {
                    grocery_id: groceryRef.id,
                    ...groceryData
                }
            });
        } catch (error) {
            console.error("Error adding grocery:", error);
            res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to add grocery"
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
                    message: "grocery_ud is requried"
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
            const userData = userDoc.data()

            if (groceryData.house_id !== userData?.house_id){
                res.status(403).json({
                    error: "Forbidden", 
                    message: "You can only delete groceries in your house"
                })
                return;
            }

            await db.collection("groceries").doc(grocery_id).delete();
            console.log(`Grocery item ${groceryData.item_name} deleted by ${user.email}`);

            res.json({
                message: "Grocery item deleted successfully",
                data: {
                    grocery_id,
                    deleted_at: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error("❌ Error deleting grocery:", error);
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
                .map((doc) => ({
                  grocery_id: doc.id,
                  ...(doc.data() as Omit<GroceryItem, "grocery_id">),
                }))
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
                res.status(404).json({
                    error: "Not Found",
                    message: "No groceries found in your house"
                });
                return;
            }

            const batch = db.batch();

            groceries.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();

            res.json({
                message: "All groceries deleted successfully"
            });
        } catch (error) {
            console.error("❌ Error deleting groceries:", error);
            res.status(500).json({
                error: "Internal  Server Error",
                message: "Failed to delete groceries"
            });
        }
    }
)
export default router;