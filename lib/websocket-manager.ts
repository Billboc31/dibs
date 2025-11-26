// Gestionnaire global des connexions WebSocket
const activeConnections = new Map<string, ReadableStreamDefaultController>()

export function registerWebSocketConnection(email: string, controller: ReadableStreamDefaultController) {
  activeConnections.set(email, controller)
  console.log('📡 WebSocket enregistré pour:', email, '- Total:', activeConnections.size)
}

export function unregisterWebSocketConnection(email: string) {
  activeConnections.delete(email)
  console.log('📡 WebSocket supprimé pour:', email, '- Total:', activeConnections.size)
}

export function sendToWebSocket(email: string, data: any): boolean {
  const controller = activeConnections.get(email)
  if (controller) {
    try {
      const encoder = new TextEncoder()
      const message = `data: ${JSON.stringify(data)}\n\n`
      controller.enqueue(encoder.encode(message))
      
      // Si c'est un message d'authentification réussie, fermer la connexion après un délai
      if (data.status === 'authenticated') {
        setTimeout(() => {
          try {
            controller.close()
            unregisterWebSocketConnection(email)
          } catch (error) {
            console.log('Connexion déjà fermée pour:', email)
          }
        }, 2000)
      }
      
      return true
    } catch (error) {
      console.error('Erreur envoi message WebSocket:', error)
      unregisterWebSocketConnection(email)
      return false
    }
  }
  return false
}

export function getActiveConnectionsCount(): number {
  return activeConnections.size
}
