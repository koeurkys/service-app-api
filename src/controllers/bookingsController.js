import { sql } from "../config/db.js";

export async function getBookings(req, res) {
  try {
    const bookings = await sql`SELECT * FROM bookings ORDER BY created_at DESC`;
    res.status(200).json(bookings);
  } catch (error) {
    console.log("Error getting bookings", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getBookingById(req, res) {
  try {
    const { id } = req.params;
    const booking = await sql`SELECT * FROM bookings WHERE id = ${id}`;

    if (booking.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json(booking[0]);
  } catch (error) {
    console.log("Error getting booking", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createBooking(req, res) {
  try {
    const { service_id, client_id, provider_id, booking_date, booking_time, duration_hours, total_price, status, notes } = req.body;

    if (!service_id || !client_id || !provider_id || !booking_date || !total_price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const booking = await sql`
      INSERT INTO bookings(service_id, client_id, provider_id, booking_date, booking_time, duration_hours, total_price, status, notes)
      VALUES (${service_id}, ${client_id}, ${provider_id}, ${booking_date}, ${booking_time}, ${duration_hours}, ${total_price}, ${status}, ${notes})
      RETURNING *
    `;

    res.status(201).json(booking[0]);
  } catch (error) {
    console.log("Error creating booking", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateBooking(req, res) {
  try {
    const { id } = req.params;
    const { booking_date, booking_time, duration_hours, total_price, status, notes, cancelled_reason, cancelled_by } = req.body;

    const updated = await sql`
      UPDATE bookings
      SET booking_date = COALESCE(${booking_date}, booking_date),
          booking_time = COALESCE(${booking_time}, booking_time),
          duration_hours = COALESCE(${duration_hours}, duration_hours),
          total_price = COALESCE(${total_price}, total_price),
          status = COALESCE(${status}, status),
          notes = COALESCE(${notes}, notes),
          cancelled_reason = COALESCE(${cancelled_reason}, cancelled_reason),
          cancelled_by = COALESCE(${cancelled_by}, cancelled_by),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json(updated[0]);
  } catch (error) {
    console.log("Error updating booking", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteBooking(req, res) {
  try {
    const { id } = req.params;
    const result = await sql`DELETE FROM bookings WHERE id = ${id} RETURNING *`;

    if (result.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.log("Error deleting booking", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
