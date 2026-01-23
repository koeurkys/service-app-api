import { sql } from "../config/db.js";

export async function getReviews(req, res) {
  try {
    const reviews = await sql`SELECT * FROM reviews ORDER BY created_at DESC`;
    res.status(200).json(reviews);
  } catch (error) {
    console.log("Error getting reviews", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getReviewById(req, res) {
  try {
    const { id } = req.params;
    const review = await sql`SELECT * FROM reviews WHERE id = ${id}`;

    if (review.length === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json(review[0]);
  } catch (error) {
    console.log("Error getting review", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createReview(req, res) {
  try {
    const { service_id, booking_id, reviewer_id, provider_id, rating, comment, is_verified } = req.body;

    if (!service_id || !reviewer_id || !provider_id || !rating) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const review = await sql`
      INSERT INTO reviews(service_id, booking_id, reviewer_id, provider_id, rating, comment, is_verified)
      VALUES (${service_id}, ${booking_id}, ${reviewer_id}, ${provider_id}, ${rating}, ${comment}, ${is_verified})
      RETURNING *
    `;

    res.status(201).json(review[0]);
  } catch (error) {
    console.log("Error creating review", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateReview(req, res) {
  try {
    const { id } = req.params;
    const { rating, comment, reply, is_verified } = req.body;

    const updated = await sql`
      UPDATE reviews
      SET rating = COALESCE(${rating}, rating),
          comment = COALESCE(${comment}, comment),
          reply = COALESCE(${reply}, reply),
          is_verified = COALESCE(${is_verified}, is_verified),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json(updated[0]);
  } catch (error) {
    console.log("Error updating review", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    const result = await sql`DELETE FROM reviews WHERE id = ${id} RETURNING *`;

    if (result.length === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.log("Error deleting review", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
