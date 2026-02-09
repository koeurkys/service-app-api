import { sql } from "../config/db.js";

/* =======================
   GET ALL NOTIFICATIONS FOR CURRENT USER
======================= */
export async function getNotifications(req, res) {
  try {
    const userResult = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;

    if (userResult.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const userId = userResult[0].id;

    const notifications = await sql`
      SELECT 
        n.*,
        u.name AS sender_name,
        u.avatar_url AS sender_avatar,
        s.title AS service_title
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      LEFT JOIN services s ON n.service_id = s.id
      WHERE n.user_id = ${userId}
      ORDER BY n.created_at DESC
    `;

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/* =======================
   GET UNREAD NOTIFICATION COUNT
======================= */
export async function getUnreadCount(req, res) {
  try {
    const userResult = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;

    if (userResult.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const userId = userResult[0].id;

    const countResult = await sql`
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE user_id = ${userId} AND is_read = FALSE
    `;

    const unreadCount = countResult[0]?.unread_count || 0;
    res.status(200).json({ unread_count: unreadCount });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/* =======================
   MARK NOTIFICATION AS READ
======================= */
export async function markAsRead(req, res) {
  try {
    const { id } = req.params;

    const updated = await sql`
      UPDATE notifications
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json(updated[0]);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/* =======================
   MARK ALL NOTIFICATIONS AS READ
======================= */
export async function markAllAsRead(req, res) {
  try {
    const userResult = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;

    if (userResult.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const userId = userResult[0].id;

    const updated = await sql`
      UPDATE notifications
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND is_read = FALSE
      RETURNING *
    `;

    res.status(200).json({ 
      message: `${updated.length} notifications marked as read`,
      updated_count: updated.length
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/* =======================
   DELETE NOTIFICATION
======================= */
export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;

    const deleted = await sql`
      DELETE FROM notifications
      WHERE id = ${id}
      RETURNING *
    `;

    if (deleted.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/* =======================
   DELETE ALL NOTIFICATIONS
======================= */
export async function deleteAllNotifications(req, res) {
  try {
    const userResult = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;

    if (userResult.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const userId = userResult[0].id;

    const deleted = await sql`
      DELETE FROM notifications
      WHERE user_id = ${userId}
      RETURNING *
    `;

    res.status(200).json({ 
      message: `${deleted.length} notifications deleted`,
      deleted_count: deleted.length
    });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
