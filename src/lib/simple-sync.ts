import { FloatingObject } from './store'

// Simple BroadcastChannel for cross-tab communication (works locally!)
let channel: BroadcastChannel | null = null

export const initSimpleSync = (sessionId: string) => {
    if (typeof window === 'undefined') return

    // Create a broadcast channel for this session
    channel = new BroadcastChannel(`colab-${sessionId}`)

    console.log('✅ Simple Sync Initialized for session:', sessionId)

    return channel
}

export const getChannel = () => channel

export const broadcastObjectCreate = (object: FloatingObject) => {
    if (channel) {
        channel.postMessage({ type: 'object-created', object })
        console.log('📤 Broadcasting object creation:', object.id)
    }
}

export const broadcastObjectUpdate = (objectId: string, changes: Partial<FloatingObject>) => {
    if (channel) {
        channel.postMessage({ type: 'object-updated', objectId, changes })
    }
}

export const onSyncMessage = (callback: (data: any) => void) => {
    if (channel) {
        channel.onmessage = (event) => {
            console.log('📥 Received sync message:', event.data.type)
            callback(event.data)
        }
    }
}
