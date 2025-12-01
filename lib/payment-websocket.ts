/**
 * Payment WebSocket Manager
 * Gère les connexions WebSocket pour les paiements en temps réel
 */

interface PaymentConnection {
  controller: ReadableStreamDefaultController
  email: string
  userId: string
  sessionId: string
  createdAt: Date
}

// Map des connexions actives : sessionId -> PaymentConnection
const paymentConnections = new Map<string, PaymentConnection>()

/**
 * Ajouter une connexion de paiement
 */
export function addPaymentConnection(sessionId: string, connection: PaymentConnection) {
  paymentConnections.set(sessionId, connection)
  console.log(`💳 Payment connection added for session: ${sessionId}`)
  
  // Auto-cleanup après 30 minutes
  setTimeout(() => {
    removePaymentConnection(sessionId)
  }, 30 * 60 * 1000)
}

/**
 * Supprimer une connexion de paiement
 */
export function removePaymentConnection(sessionId: string) {
  const connection = paymentConnections.get(sessionId)
  if (connection) {
    try {
      connection.controller.close()
    } catch (error) {
      // Connexion déjà fermée
    }
    paymentConnections.delete(sessionId)
    console.log(`💳 Payment connection removed for session: ${sessionId}`)
  }
}

/**
 * Envoyer un message à une session de paiement
 */
export function sendPaymentMessage(sessionId: string, message: any) {
  const connection = paymentConnections.get(sessionId)
  if (connection) {
    try {
      const data = `data: ${JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
        sessionId
      })}\n\n`
      
      connection.controller.enqueue(data)
      console.log(`💳 Message sent to session ${sessionId}:`, message.type)
      return true
    } catch (error) {
      console.error(`❌ Error sending message to session ${sessionId}:`, error)
      removePaymentConnection(sessionId)
      return false
    }
  }
  return false
}

/**
 * Notifier le succès d'un paiement
 */
export function notifyPaymentSuccess(sessionId: string, data: any) {
  const success = sendPaymentMessage(sessionId, {
    type: 'payment_success',
    message: 'Paiement réussi !',
    ...data
  })
  
  if (success) {
    // Fermer la connexion après succès
    setTimeout(() => removePaymentConnection(sessionId), 2000)
  }
}

/**
 * Notifier l'échec d'un paiement
 */
export function notifyPaymentFailure(sessionId: string, error: string) {
  const success = sendPaymentMessage(sessionId, {
    type: 'payment_failed',
    message: 'Paiement échoué',
    error
  })
  
  if (success) {
    // Fermer la connexion après échec
    setTimeout(() => removePaymentConnection(sessionId), 2000)
  }
}

/**
 * Notifier l'annulation d'un paiement
 */
export function notifyPaymentCancelled(sessionId: string) {
  const success = sendPaymentMessage(sessionId, {
    type: 'payment_cancelled',
    message: 'Paiement annulé'
  })
  
  if (success) {
    // Fermer la connexion après annulation
    setTimeout(() => removePaymentConnection(sessionId), 2000)
  }
}

/**
 * Obtenir les statistiques des connexions
 */
export function getPaymentConnectionsStats() {
  return {
    activeConnections: paymentConnections.size,
    connections: Array.from(paymentConnections.entries()).map(([sessionId, conn]) => ({
      sessionId,
      email: conn.email,
      userId: conn.userId,
      createdAt: conn.createdAt
    }))
  }
}

/**
 * Nettoyer les connexions expirées
 */
export function cleanupExpiredConnections() {
  const now = new Date()
  const expiredSessions: string[] = []
  
  paymentConnections.forEach((connection, sessionId) => {
    const age = now.getTime() - connection.createdAt.getTime()
    if (age > 30 * 60 * 1000) { // 30 minutes
      expiredSessions.push(sessionId)
    }
  })
  
  expiredSessions.forEach(sessionId => {
    removePaymentConnection(sessionId)
  })
  
  if (expiredSessions.length > 0) {
    console.log(`🧹 Cleaned up ${expiredSessions.length} expired payment connections`)
  }
}

// Nettoyage automatique toutes les 5 minutes
setInterval(cleanupExpiredConnections, 5 * 60 * 1000)
