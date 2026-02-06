import { sql } from "../config/db.js";

// Créer une réservation
export async function createBooking(req, res) {
  try {
    const { service_id, booking_date, booking_time, quantity, notes } = req.body;

    // Récupérer l'utilisateur actuel depuis son clerk_id
    const [currentUser] = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;

    if (!currentUser) {
      return res.status(400).json({ error: "Utilisateur non trouvé" });
    }

    const client_id = currentUser.id;

    // Valider les données
    if (!service_id || !booking_date || !booking_time) {
      return res.status(400).json({ error: "service_id, booking_date et booking_time sont requis" });
    }

    // Récupérer le service et ses infos
    const [service] = await sql`
      SELECT id, user_id, price, is_hourly, status FROM services WHERE id = ${service_id}
    `;

    if (!service) {
      return res.status(404).json({ error: "Service non trouvé" });
    }

    if (service.status !== "active") {
      return res.status(400).json({ error: "Le service n'est pas actif" });
    }

    if (client_id === service.user_id) {
      return res.status(400).json({ error: "Impossible de réserver son propre service" });
    }

    const provider_id = service.user_id;
    const q = quantity || 1;
    const total_price = service.price * q;

    // Créer la réservation
    const booking = await sql`
      INSERT INTO bookings (
        service_id,
        client_id,
        provider_id,
        booking_date,
        booking_time,
        total_price,
        notes,
        status
      )
      VALUES (${service_id}, ${client_id}, ${provider_id}, ${booking_date}, ${booking_time}, ${total_price}, ${notes || null}, 'pending')
      RETURNING *
    `;

    res.status(201).json(booking[0]);
  } catch (error) {
    console.error("Erreur création réservation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// Récupérer les réservations de l'utilisateur (en tant que client)
export async function getMyBookings(req, res) {
  try {
    // Récupérer l'utilisateur actuel depuis son clerk_id
    const [currentUser] = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;

    if (!currentUser) {
      return res.status(400).json({ error: "Utilisateur non trouvé" });
    }

    const client_id = currentUser.id;

    const bookings = await sql`
      SELECT 
        b.*,
        s.title as service_title,
        s.description as service_description,
        s.image_url,
        u.name as provider_name,
        u.avatar_url as provider_avatar
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.provider_id = u.id
      WHERE b.client_id = ${client_id}
      ORDER BY b.created_at DESC
    `;

    res.json(bookings);
  } catch (error) {
    console.error("Erreur récupération réservations:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// Récupérer les réservations reçues (en tant que prestataire)
export async function getReceivedBookings(req, res) {
  try {
    // Récupérer l'utilisateur actuel depuis son clerk_id
    const [currentUser] = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;

    if (!currentUser) {
      return res.status(400).json({ error: "Utilisateur non trouvé" });
    }

    const provider_id = currentUser.id;

    const bookings = await sql`
      SELECT 
        b.*,
        s.title as service_title,
        s.description as service_description,
        s.image_url,
        u.name as client_name,
        u.avatar_url as client_avatar,
        u.email as client_email
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.client_id = u.id
      WHERE b.provider_id = ${provider_id}
      ORDER BY b.created_at DESC
    `;

    res.json(bookings);
  } catch (error) {
    console.error("Erreur récupération réservations reçues:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// Récupérer une réservation spécifique
export async function getBookingById(req, res) {
  try {
    const { id } = req.params;

    // Récupérer l'utilisateur actuel depuis son clerk_id
    const [currentUser] = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;

    if (!currentUser) {
      return res.status(400).json({ error: "Utilisateur non trouvé" });
    }

    const userId = currentUser.id;

    const [booking] = await sql`
      SELECT 
        b.*,
        s.title as service_title,
        s.description as service_description,
        s.image_url,
        u.name as client_name,
        u.avatar_url as client_avatar,
        u.email as client_email,
        p.name as provider_name,
        p.avatar_url as provider_avatar
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.client_id = u.id
      JOIN users p ON b.provider_id = p.id
      WHERE b.id = ${id}
    `;

    if (!booking) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    // Vérifier que l'utilisateur a accès à cette réservation
    if (booking.client_id !== userId && booking.provider_id !== userId) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Erreur récupération réservation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// Accepter une réservation (prestataire)
export async function acceptBooking(req, res) {
  try {
    const { id } = req.params;

    // Récupérer l'utilisateur actuel depuis son clerk_id
    const [currentUser] = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;

    if (!currentUser) {
      return res.status(400).json({ error: "Utilisateur non trouvé" });
    }

    const provider_id = currentUser.id;

    // Vérifier que la réservation existe et appartient au prestataire
    const [booking] = await sql`
      SELECT * FROM bookings WHERE id = ${id} AND provider_id = ${provider_id}
    `;

    if (!booking) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ error: "Seules les réservations en attente peuvent être acceptées" });
    }

    const [updated] = await sql`
      UPDATE bookings
      SET status = 'accepted', updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    res.json(updated);
  } catch (error) {
    console.error("Erreur acceptation réservation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// Marquer une réservation comme complétée
export async function completeBooking(req, res) {
  try {
    const { id } = req.params;

    // Récupérer l'utilisateur actuel depuis son clerk_id
    const [currentUser] = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;

    if (!currentUser) {
      return res.status(400).json({ error: "Utilisateur non trouvé" });
    }

    const provider_id = currentUser.id;

    const [booking] = await sql`
      SELECT * FROM bookings WHERE id = ${id} AND provider_id = ${provider_id}
    `;

    if (!booking) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    const [updated] = await sql`
      UPDATE bookings
      SET status = 'completed', updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    res.json(updated);
  } catch (error) {
    console.error("Erreur complétude réservation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// Annuler une réservation
export async function cancelBooking(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Récupérer l'utilisateur actuel depuis son clerk_id
    const [currentUser] = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;

    if (!currentUser) {
      return res.status(400).json({ error: "Utilisateur non trouvé" });
    }

    const userId = currentUser.id;

    // Vérifier que la réservation existe
    const [booking] = await sql`
      SELECT * FROM bookings WHERE id = ${id}
    `;

    if (!booking) {
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    // Vérifier que le statut permet l'annulation
    if (["completed", "cancelled", "disputed"].includes(booking.status)) {
      return res.status(400).json({ error: "Cette réservation ne peut pas être annulée" });
    }

    // Vérifier que l'utilisateur peut annuler (client ou prestataire)
    if (booking.client_id !== userId && booking.provider_id !== userId) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const cancelledBy = booking.client_id === userId ? "client" : "provider";

    const [updated] = await sql`
      UPDATE bookings
      SET status = 'cancelled', cancelled_reason = ${reason || null}, cancelled_by = ${cancelledBy}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    res.json(updated);
  } catch (error) {
    console.error("Erreur annulation réservation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}
