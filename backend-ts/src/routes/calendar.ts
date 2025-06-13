import express, { Response } from "express";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { db } from "../config/firebase";
import { Reservation, CreateReservationRequest } from "../types";

const router = express.Router();

/**
 * Get House Reservations
 * GET /calendar/my-house
 * Fetch all reservations for the logged-in user's house
 */
router.get(
  "/my-house",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      
      // Get user's house_id
      const userDoc = await db.collection("users").doc(user.uid).get();
      
      if (!userDoc.exists) {
        res.status(404).json({
          error: "Not Found",
          message: "User not found in database"
        });
        return;
      }

      const userData = userDoc.data();
      const houseId = userData?.house_id;
      
      if (!houseId) {
        res.status(404).json({
          error: "Not Found",
          message: "User is not in a house"
        });
        return;
      }

      // Fetch all reservations for the house
      const reservationsQuery = await db
        .collection("reservations")
        .where("house_id", "==", houseId)
        .get();
      
      const reservations: Reservation[] = reservationsQuery.docs
        .map((doc) => ({
          reservation_id: doc.id,
          ...(doc.data() as Omit<Reservation, "reservation_id">),
        }))
        .sort((a, b) => {
          // Sort by date first, then by start_time
          const dateComparison = a.date.localeCompare(b.date);
          if (dateComparison !== 0) return dateComparison;
          return a.start_time.localeCompare(b.start_time);
        });
      
      res.json({
        message: "House reservations retrieved successfully",
        reservations: reservations
      });
      
    } catch (error) {
      console.error("❌ Error fetching reservations:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch reservations"
      });
    }
  }
);

/**
 * Create New Reservation
 * POST /calendar/create
 * Create a new reservation with conflict checking
 */
router.post(
  "/create",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { start_time, end_time, date, location }: CreateReservationRequest = req.body;
      const user = req.user!;
      
      if (!start_time || !end_time || !date || !location) {
        res.status(400).json({
          error: "Bad Request",
          message: "start_time, end_time, date, and location are required"
        });
        return;
      }

      // Validate location
      const validLocations = ["Living Room", "Kitchen", "Shower"];
      if (!validLocations.includes(location)) {
        res.status(400).json({
          error: "Bad Request",
          message: "Invalid location. Must be Living Room, Kitchen, or Shower"
        });
        return;
      }

      // Validate time format (basic check)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
        res.status(400).json({
          error: "Bad Request",
          message: "Invalid time format. Use HH:MM format"
        });
        return;
      }

      // Validate that end_time is after start_time
      if (start_time >= end_time) {
        res.status(400).json({
          error: "Bad Request",
          message: "End time must be after start time"
        });
        return;
      }

      // Get user's house_id and first name
      const userDoc = await db.collection("users").doc(user.uid).get();
      const userData = userDoc.data();
      const houseId = userData?.house_id;
      const userFirstName = userData?.firstName || user.email?.split('@')[0] || 'Unknown User';
      
      if (!houseId) {
        res.status(404).json({
          error: "Not Found",
          message: "User is not in a house"
        });
        return;
      }

      // Check for conflicts - same location, same date, overlapping time
      const conflictQuery = await db
        .collection("reservations")
        .where("house_id", "==", houseId)
        .where("location", "==", location)
        .where("date", "==", date)
        .get();

      // Helper function to check if two time ranges overlap
      const timesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
        return start1 < end2 && start2 < end1;
      };

      // Check for conflicts
      const hasConflict = conflictQuery.docs.some(doc => {
        const existingReservation = doc.data() as Reservation;
        return timesOverlap(
          start_time, 
          end_time, 
          existingReservation.start_time, 
          existingReservation.end_time
        );
      });

      if (hasConflict) {
        res.status(409).json({
          error: "Conflict",
          message: `The ${location} is already reserved during this time slot`
        });
        return;
      }

      const reservationData: Omit<Reservation, "reservation_id"> = {
        house_id: houseId,
        start_time,
        end_time,
        date,
        person_email: user.email!,
        person_id: user.uid,
        person_firstname: userFirstName,
        location,
        created_at: new Date(),
      };

      // Add reservation to Firestore
      const reservationRef = await db.collection("reservations").add(reservationData);
      
      console.log(`✅ Reservation created for ${location} by ${user.email} on ${date} from ${start_time} to ${end_time}`);
      
      res.status(201).json({
        message: "Reservation created successfully",
        data: {
          reservation_id: reservationRef.id,
          ...reservationData
        }
      });
      
    } catch (error) {
      console.error("❌ Error creating reservation:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create reservation"
      });
    }
  }
);

/**
 * Delete Reservation
 * DELETE /calendar/:reservation_id
 * Remove a reservation from the system
 */
router.delete(
  "/:reservation_id",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { reservation_id } = req.params;
      const user = req.user!;
      
      if (!reservation_id) {
        res.status(400).json({
          error: "Bad Request",
          message: "reservation_id is required"
        });
        return;
      }

      // Get reservation document
      const reservationDoc = await db.collection("reservations").doc(reservation_id).get();
      
      if (!reservationDoc.exists) {
        res.status(404).json({
          error: "Not Found",
          message: "Reservation not found"
        });
        return;
      }

      const reservationData = reservationDoc.data() as Reservation;
      
      // Verify user can delete this reservation (either their own reservation or house member)
      const userDoc = await db.collection("users").doc(user.uid).get();
      const userData = userDoc.data();
      
      if (reservationData.house_id !== userData?.house_id) {
        res.status(403).json({
          error: "Forbidden",
          message: "You can only delete reservations in your house"
        });
        return;
      }

      // Optional: Only allow users to delete their own reservations
      // Uncomment this if you want stricter permissions
      
      if (reservationData.person_id !== user.uid) {
        res.status(403).json({
          error: "Forbidden",
          message: "You can only delete your own reservations"
        });
        return;
      }
      

      // Delete reservation
      await db.collection("reservations").doc(reservation_id).delete();
      
      console.log(`🗑️ Reservation ${reservation_id} for ${reservationData.location} deleted by ${user.email}`);
      
      res.json({
        message: "Reservation deleted successfully",
        data: {
          reservation_id,
          deleted_at: new Date().toISOString(),
          location: reservationData.location,
          date: reservationData.date,
          time: `${reservationData.start_time} - ${reservationData.end_time}`
        }
      });
      
    } catch (error) {
      console.error("❌ Error deleting reservation:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to delete reservation"
      });
    }
  }
);

export default router; 