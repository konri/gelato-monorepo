import { Response } from 'express'

/**
 * In-process SSE connection registry.
 * Maintains three maps:
 *   sessionConnections: sessionToken → Set of Response objects (Mode 2)
 *   queueConnections:   storeId      → Set of Response objects (Mode 3)
 *   userConnections:    userId       → Set of Response objects (CLIENT)
 */
class SseRegistryClass {
  private sessionConnections = new Map<string, Set<Response>>()
  private queueConnections = new Map<string, Set<Response>>()
  private userConnections = new Map<string, Set<Response>>()

  // ── Session connections (Mode 2) ──────────────────────────────────────────

  addSessionConnection(sessionToken: string, res: Response): void {
    if (!this.sessionConnections.has(sessionToken)) {
      this.sessionConnections.set(sessionToken, new Set())
    }
    this.sessionConnections.get(sessionToken)!.add(res)
  }

  removeSessionConnection(sessionToken: string, res: Response): void {
    const set = this.sessionConnections.get(sessionToken)
    if (!set) return
    set.delete(res)
    if (set.size === 0) this.sessionConnections.delete(sessionToken)
  }

  broadcastToSession(sessionToken: string, data: string): void {
    const set = this.sessionConnections.get(sessionToken)
    if (!set) return
    const payload = `event: status\ndata: ${data}\n\n`
    set.forEach((res) => {
      try {
        res.write(payload)
      } catch {
        // connection already closed
      }
    })
  }

  closeSessionConnections(sessionToken: string): void {
    const set = this.sessionConnections.get(sessionToken)
    if (!set) return
    const payload = `event: expired\ndata: {}\n\n`
    set.forEach((res) => {
      try {
        res.write(payload)
        res.end()
      } catch {
        // already closed
      }
    })
    this.sessionConnections.delete(sessionToken)
  }

  // ── Queue connections (Mode 3) ────────────────────────────────────────────

  addQueueConnection(storeId: string, res: Response): void {
    if (!this.queueConnections.has(storeId)) {
      this.queueConnections.set(storeId, new Set())
    }
    this.queueConnections.get(storeId)!.add(res)
  }

  removeQueueConnection(storeId: string, res: Response): void {
    const set = this.queueConnections.get(storeId)
    if (!set) return
    set.delete(res)
    if (set.size === 0) this.queueConnections.delete(storeId)
  }

  broadcastToQueue(storeId: string, data: string): void {
    const set = this.queueConnections.get(storeId)
    if (!set) return
    const payload = `event: queue\ndata: ${data}\n\n`
    set.forEach((res) => {
      try {
        res.write(payload)
      } catch {
        // connection already closed
      }
    })
  }

  getQueueConnectionCount(storeId: string): number {
    return this.queueConnections.get(storeId)?.size ?? 0
  }

  // ── User connections (CLIENT) ─────────────────────────────────────────────

  addUserConnection(userId: string, res: Response): void {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set())
    }
    this.userConnections.get(userId)!.add(res)
  }

  removeUserConnection(userId: string, res: Response): void {
    const set = this.userConnections.get(userId)
    if (!set) return
    set.delete(res)
    if (set.size === 0) this.userConnections.delete(userId)
  }

  broadcastToUser(userId: string, data: string): void {
    const set = this.userConnections.get(userId)
    if (!set) return
    const payload = `event: order-update\ndata: ${data}\n\n`
    set.forEach((res) => {
      try {
        res.write(payload)
      } catch {
        // connection already closed
      }
    })
  }
}

// Singleton — shared across the process
export const SseRegistry = new SseRegistryClass()
