import { sql } from "../config/db.js";
import { syncBadgesForUser } from "./userBadgesController.js";

// Créer une réservation
export async function createBooking(req, res) {
  try {
    const {
      service_id,
      booking_date,
      booking_time,
      duration_hours,
      quantity,
      unit_type,
      location_type,
      urgency,
      notes,
    } = req.body;

    // Récupérer l'utilisateur actuel depuis son clerk_id
    const [currentUser] = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;

    if (!currentUser) {
      return res.status(400).json({ error: "Utilisateur non trouvé" });
    }

    const client_id = currentUser.id;

    // Valider les données essentielles
    if (!service_id || !booking_date || !booking_time) {
      return res.status(400).json({ error: "service_id, booking_date et booking_time sont requis" });
    }

    // Récupérer le service et ses infos
    const [service] = await sql`
      SELECT id, user_id, price, status FROM services WHERE id = ${service_id}
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
    const d = duration_hours || 1;
    const urgencyMultiplier = urgency === "rush" ? 1.5 : 1;

    // Calcul du prix: prix × durée × quantité × urgence
    const total_price = parseFloat(service.price) * d * q * urgencyMultiplier;

    // Créer la réservation
    const booking = await sql`
      INSERT INTO bookings (
        service_id,
        client_id,
        provider_id,
        booking_date,
        booking_time,
        duration_hours,
        quantity,
        unit_type,
        location_type,
        urgency,
        total_price,
        notes,
        status
      )
      VALUES (
        ${service_id},
        ${client_id},
        ${provider_id},
        ${booking_date},
        ${booking_time},
        ${d},
        ${q},
        ${unit_type || null},
        ${location_type || 'on_site'},
        ${urgency || 'standard'},
        ${total_price},
        ${notes || null},
        'pending'
      )
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

    // 🎯 Sync badges for provider and client after booking acceptance
    await syncBadgesForUser(provider_id);
    await syncBadgesForUser(updated[0].client_id);

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

    // 🎯 Mettre à jour la fiabilité (ancien status → completed)
    await updateReliabilityScore(booking.client_id, booking.provider_id, booking.status, 'completed');

    // 🎯 Sync badges for both provider and client after booking completion
    await syncBadgesForUser(booking.provider_id);
    await syncBadgesForUser(booking.client_id);

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

    // 🎯 Mettre à jour la fiabilité (ancien status → cancelled, avec qui a annulé)
    await updateReliabilityScore(booking.client_id, booking.provider_id, booking.status, 'cancelled', cancelledBy);

    res.json(updated);
  } catch (error) {
    console.error("Erreur annulation réservation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

// ✅ Mettre à jour le statut d'une réservation et ajuster la fiabilité
export async function updateBookingStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, cancelled_by, cancelled_reason } = req.body;

    if (!id || !status) {
      return res.status(400).json({ message: "Missing id or status" });
    }

    const validStatuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // ✅ Récupérer la booking existante
    const [booking] = await sql`
      SELECT id, client_id, provider_id, status as old_status
      FROM bookings
      WHERE id = ${id}
    `;

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    console.log("📅 Updating booking", id, "from", booking.old_status, "to", status);

    // ✅ Mettre à jour le booking
    const [updated] = await sql`
      UPDATE bookings
      SET status = ${status}, 
          cancelled_by = ${cancelled_by || null},
          cancelled_reason = ${cancelled_reason || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    // ✅ Ajuster la fiabilité basée sur les transitions de statut
    if (booking.old_status !== status) {
      await updateReliabilityScore(booking.client_id, booking.provider_id, booking.old_status, status, cancelled_by);
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ✅ Fonction interne pour mettre à jour le score de fiabilité
async function updateReliabilityScore(client_id, provider_id, oldStatus, newStatus, cancelledBy) {
  try {
    console.log("🎯 Updating reliability:", { client_id, provider_id, oldStatus, newStatus, cancelledBy });

    let clientDelta = 0;
    let providerDelta = 0;

    // Logique de mutation de fiabilité
    if ((oldStatus === 'accepted' || oldStatus === 'in_progress') && newStatus === 'completed') {
      // ✅ Réservation complétée avec succès (depuis accepted ou in_progress)
      clientDelta = 5;
      providerDelta = 5;
      console.log("✅ COMPLETED: both +5");
    } else if (oldStatus === 'pending' && newStatus === 'cancelled') {
      // ❌ Annulation pendant pending (peu d'impact)
      clientDelta = -2;
      providerDelta = -2;
      console.log("❌ CANCELLED (pending): both -2");
    } else if ((oldStatus === 'accepted' || oldStatus === 'in_progress') && newStatus === 'cancelled') {
      // ❌ Annulation après acceptation
      if (cancelledBy === 'client') {
        clientDelta = -10; // Client a annulé = mauvaise fiabilité
        providerDelta = 0;
        console.log("❌ CANCELLED by client: client -10, provider +0");
      } else if (cancelledBy === 'provider') {
        clientDelta = 0;
        providerDelta = -10; // Provider a annulé = mauvaise fiabilité
        console.log("❌ CANCELLED by provider: client +0, provider -10");
      }
    } else if (newStatus === 'disputed') {
      // ⚠️ Litige = mauvaise fiabilité pour les deux
      clientDelta = -5;
      providerDelta = -5;
      console.log("⚠️ DISPUTED: both -5");
    }

    // ✅ Mettre à jour les scores (entre 0 et 100)
    if (clientDelta !== 0) {
      await sql`
        UPDATE profiles
        SET reliability_score = GREATEST(0, LEAST(100, reliability_score + ${clientDelta}))
        WHERE user_id = ${client_id}
      `;
      console.log("✅ Client reliability updated by", clientDelta);
    }

    if (providerDelta !== 0) {
      await sql`
        UPDATE profiles
        SET reliability_score = GREATEST(0, LEAST(100, reliability_score + ${providerDelta}))
        WHERE user_id = ${provider_id}
      `;
      console.log("✅ Provider reliability updated by", providerDelta);
    }
  } catch (error) {
    console.error("Error updating reliability score:", error);
    // Continue sans thrower - pas critique
  }
}
