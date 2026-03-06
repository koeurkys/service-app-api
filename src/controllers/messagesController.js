import { sql } from "../config/db.js";
import { io } from "../server.js";
import { syncBadgesForUser } from "./userBadgesController.js";

// Récupérer la conversation entre deux utilisateurs
export const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    // Récupérer l'utilisateur actuel depuis son clerk_id
    const [currentUser] = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;

    if (!currentUser) {
      return res.status(400).json({ error: "Utilisateur non trouvé" });
    }

    const currentUserId = currentUser.id;

    const conversations = await sql`
      SELECT 
        m.id,
        m.sender_id,
        m.receiver_id,
        m.content,
        m.is_read,
        m.created_at,
        u.name as sender_name,
        u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE 
        (m.sender_id = ${currentUserId} AND m.receiver_id = ${userId})
        OR
        (m.sender_id = ${userId} AND m.receiver_id = ${currentUserId})
      ORDER BY m.created_at ASC
    `;

    res.json(conversations);
  } catch (err) {
    console.error("Erreur récupération conversation:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Envoyer un message
export const sendMessage = async (req, res) => {
  try {
    const { receiver_id, content } = req.body;

    if (!receiver_id || !content) {
      return res.status(400).json({ error: "receiver_id et content sont requis" });
    }

    // Récupérer l'utilisateur actuel depuis son clerk_id
    const [currentUser] = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;

    if (!currentUser) {
      return res.status(400).json({ error: "Utilisateur non trouvé" });
    }

    const sender_id = currentUser.id;

    // Vérifier que l'utilisateur récepteur existe
    const [receiver] = await sql`
      SELECT id FROM users WHERE id = ${receiver_id}
    `;

    if (!receiver) {
      return res.status(404).json({ error: "Utilisateur récepteur non trouvé" });
    }

    const message = await sql`
      INSERT INTO messages (sender_id, receiver_id, content)
      VALUES (${sender_id}, ${receiver_id}, ${content})
      RETURNING id, sender_id, receiver_id, content, is_read, created_at
    `;

    // ✅ Émettre le nouveau message via Socket.IO au récepteur
    const messageData = message[0];
    io.emit(`message-${receiver_id}`, messageData);
    console.log(`📨 Message émis au récepteur ${receiver_id}`);

    // 🎯 Sync badges for the sender after sending first message
    await syncBadgesForUser(sender_id);

    res.status(201).json(messageData);
  } catch (err) {
    console.error("Erreur envoi message:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Marquer les messages comme lus
export const markAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;

    // Récupérer l'utilisateur actuel depuis son clerk_id
    const [currentUser] = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;

    if (!currentUser) {
      return res.status(400).json({ error: "Utilisateur non trouvé" });
    }

    const currentUserId = currentUser.id;

    await sql`
      UPDATE messages
      SET is_read = TRUE, read_at = NOW()
      WHERE sender_id = ${senderId} AND receiver_id = ${currentUserId}
    `;

    res.json({ message: "Messages marqués comme lus" });
  } catch (err) {
    console.error("Erreur marquage messages:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Récupérer les conversations de l'utilisateur
export const getUserConversations = async (req, res) => {
  try {
    // Récupérer l'utilisateur actuel depuis son clerk_id
    const [currentUser] = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;

    if (!currentUser) {
      return res.status(400).json({ error: "Utilisateur non trouvé" });
    }

    const currentUserId = currentUser.id;

    const conversations = await sql`
      SELECT 
        CASE 
          WHEN m.sender_id = ${currentUserId} THEN m.receiver_id
          ELSE m.sender_id
        END as other_user_id,
        u.name as other_user_name,
        u.avatar_url,
        m.content as last_message_text,
        m.sender_id as last_message_sender_id,
        m.is_read as last_message_is_read,
        m.created_at as last_message_date,
        (SELECT COUNT(*) FROM messages m2
         WHERE m2.sender_id = CASE 
                   WHEN m.sender_id = ${currentUserId} THEN m.receiver_id
                   ELSE m.sender_id
                 END 
         AND m2.receiver_id = ${currentUserId}
         AND m2.is_read = FALSE) as unread_count
      FROM messages m
      JOIN users u ON u.id = CASE 
                        WHEN m.sender_id = ${currentUserId} THEN m.receiver_id
                        ELSE m.sender_id
                      END
      WHERE (m.sender_id = ${currentUserId} OR m.receiver_id = ${currentUserId})
        AND m.created_at = (
          SELECT MAX(m2.created_at)
          FROM messages m2
          WHERE (m2.sender_id = ${currentUserId} AND m2.receiver_id = u.id)
             OR (m2.sender_id = u.id AND m2.receiver_id = ${currentUserId})
        )
      ORDER BY m.created_at DESC
    `;

    res.json(conversations);
  } catch (err) {
    console.error("Erreur récupération conversations:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
