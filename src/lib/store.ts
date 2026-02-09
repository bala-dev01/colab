import { create } from 'zustand'
import { initFirebaseSync, broadcastObjectCreate, broadcastObjectUpdate, listenToObjects, syncCanvasMetadata, listenToCanvasMetadata } from './firebase-sync'

export interface HandState {
    x: number // Normalized 0-1
    y: number // Normalized 0-1
    z: number // Depth
    isPresent: boolean
    isPinching: boolean // Thumb + Index touching
    isPointing: boolean // Index extended, others closed (roughly)
}

export interface TwoHandState {
    leftHand: HandState | null
    rightHand: HandState | null
    isTwoHandPinching: boolean // Both hands pinching
    twoHandDistance: number // Distance between hands for scaling
}

export interface FloatingObject {
    id: string
    type: 'wireframe' | 'image' | 'text' | 'html'
    content: string // SVG code or keys
    position: [number, number, number] // 3D world coordinates
    scale: [number, number, number]
    rotation: [number, number, number]
}

export interface Canvas {
    id: string
    name: string
    createdAt: number
    objects: FloatingObject[]
}

export interface AppState {
    // Hand State
    hand: HandState
    setHand: (hand: Partial<HandState>) => void

    // Two-Hand State
    twoHandState: TwoHandState
    setTwoHandState: (state: Partial<TwoHandState>) => void

    // Canvas Management
    canvases: Canvas[]
    currentCanvasId: string
    loadCanvasesFromStorage: () => void
    createCanvas: (name: string) => void
    switchCanvas: (canvasId: string) => void
    deleteCanvas: (canvasId: string) => void
    renameCanvas: (canvasId: string, newName: string) => void

    // Scene State (current canvas)
    objects: FloatingObject[]
    selectedObjectId: string | null
    setSelectedObject: (id: string | null) => void
    meetSessionId: string | null
    firebaseUnsubscribe: (() => void) | null // Track Firebase listener for cleanup
    canvasMetadataUnsubscribe: (() => void) | null // Track canvas metadata listener
    initSync: (sessionId: string) => Promise<void>
    addObject: (obj: FloatingObject) => void
    updateObject: (id: string, updates: Partial<FloatingObject>) => void
    removeObject: (id: string) => void

    // Chat Input (for air writing)
    input: string
    setInput: (text: string) => void
}

export const useStore = create<AppState>((set, get) => ({
    hand: { x: 0.5, y: 0.5, z: 0, isPresent: false, isPinching: false, isPointing: false },
    setHand: (updates) => set((state) => ({ hand: { ...state.hand, ...updates } })),

    twoHandState: {
        leftHand: null,
        rightHand: null,
        isTwoHandPinching: false,
        twoHandDistance: 0
    },
    setTwoHandState: (updates) => set((state) => ({
        twoHandState: { ...state.twoHandState, ...updates }
    })),

    // Canvas Management - Static initial state (hydration-safe)
    canvases: [{
        id: 'default',
        name: 'Main Canvas',
        createdAt: 0,
        objects: []
    }],
    currentCanvasId: 'default',

    // Load canvas metadata from localStorage (call on client mount)
    loadCanvasesFromStorage: () => {
        if (typeof window === 'undefined') return

        try {
            // Always create a fresh, empty session canvas on page load
            const sessionCanvas: Canvas = {
                id: `session-${Date.now()}`,
                name: `Session ${new Date().toLocaleTimeString()}`,
                createdAt: Date.now(),
                objects: [] // ALWAYS start empty
            }

            const saved = localStorage.getItem('colab-canvases')
            if (saved) {
                const metadata = JSON.parse(saved)
                const savedCanvases = metadata.map((m: any) => ({
                    ...m,
                    objects: [] // Don't load objects from localStorage
                }))

                // Session canvas first, then saved canvases
                set({
                    canvases: [sessionCanvas, ...savedCanvases],
                    currentCanvasId: sessionCanvas.id,
                    objects: [] // Start with empty canvas - Firebase will sync if needed
                })
            } else {
                // No saved canvases, just use the new session canvas
                set({
                    canvases: [sessionCanvas],
                    currentCanvasId: sessionCanvas.id,
                    objects: [] // Start empty
                })
            }
        } catch (e) {
            console.warn('Failed to load canvas metadata:', e)
        }
    },

    createCanvas: (name: string) => {
        set((state) => {
            const newCanvas: Canvas = {
                id: `canvas-${Date.now()}`,
                name,
                createdAt: Date.now(),
                objects: []
            }

            // Save current canvas objects before switching
            const updatedCanvases = state.canvases.map(c =>
                c.id === state.currentCanvasId ? { ...c, objects: state.objects } : c
            )

            console.log('[CREATE CANVAS] Switching to new canvas:', newCanvas.id)
            console.log('[CREATE CANVAS] Current objects being saved:', state.objects.length)
            console.log('[CREATE CANVAS] New canvas will have 0 objects')

            const finalCanvases = [...updatedCanvases, newCanvas]

            // Sync to Firebase if session active
            if (state.meetSessionId) {
                syncCanvasMetadata(state.meetSessionId, finalCanvases)
            }

            return {
                canvases: finalCanvases,
                currentCanvasId: newCanvas.id,
                objects: [] // CRITICAL: Clear objects for new canvas
            }
        })
        if (typeof window !== 'undefined') {
            try {
                // Save only metadata (id, name, createdAt) to avoid quota issues
                const canvasMetadata = get().canvases.map(c => ({
                    id: c.id,
                    name: c.name,
                    createdAt: c.createdAt
                }))
                localStorage.setItem('colab-canvases', JSON.stringify(canvasMetadata))
            } catch (e) {
                console.warn('Failed to save canvas metadata:', e)
            }
        }
    },

    switchCanvas: (canvasId: string) => {
        set((state) => {
            // Save current canvas objects before switching
            const updatedCanvases = state.canvases.map(c =>
                c.id === state.currentCanvasId ? { ...c, objects: state.objects } : c
            )
            const canvas = updatedCanvases.find(c => c.id === canvasId)
            if (canvas) {
                console.log('[SWITCH CANVAS] From:', state.currentCanvasId, 'To:', canvasId)
                console.log('[SWITCH CANVAS] Saving', state.objects.length, 'objects from current canvas')
                console.log('[SWITCH CANVAS] Loading', (canvas.objects || []).length, 'objects for new canvas')

                // Unsubscribe from Firebase for old canvas
                if (state.firebaseUnsubscribe) {
                    state.firebaseUnsubscribe()
                }

                // Subscribe to Firebase for new canvas (if session active)
                let newUnsubscribe = null
                if (state.meetSessionId) {
                    newUnsubscribe = listenToObjects(state.meetSessionId, canvasId, (objects: FloatingObject[]) => {
                        console.log('📥 Firebase sync: Received', objects.length, 'objects for canvas', canvasId)
                        set({ objects })
                    })
                }

                return {
                    canvases: updatedCanvases,
                    currentCanvasId: canvasId,
                    objects: canvas.objects || [], // Ensure empty array if no objects
                    firebaseUnsubscribe: newUnsubscribe
                }
            }
            return state
        })
    },

    deleteCanvas: (canvasId: string) => {
        set((state) => {
            const canvases = state.canvases.filter(c => c.id !== canvasId)
            if (canvases.length === 0) return state // Keep at least one canvas

            const newCurrentId = canvases[0].id
            const newCanvasesState = {
                canvases,
                currentCanvasId: newCurrentId,
                objects: canvases[0].objects
            }

            // Sync to Firebase if session active
            if (state.meetSessionId) {
                syncCanvasMetadata(state.meetSessionId, canvases)
            }
            return newCanvasesState
        })
        if (typeof window !== 'undefined') {
            try {
                const canvasMetadata = get().canvases.map(c => ({
                    id: c.id,
                    name: c.name,
                    createdAt: c.createdAt
                }))
                localStorage.setItem('colab-canvases', JSON.stringify(canvasMetadata))
            } catch (e) {
                console.warn('Failed to save canvas metadata:', e)
            }
        }
    },

    renameCanvas: (canvasId: string, newName: string) => {
        set((state) => {
            const updatedCanvases = state.canvases.map(c =>
                c.id === canvasId ? { ...c, name: newName } : c
            )
            // Sync to Firebase if session active
            if (state.meetSessionId) {
                syncCanvasMetadata(state.meetSessionId, updatedCanvases)
            }
            return { canvases: updatedCanvases }
        })
        if (typeof window !== 'undefined') {
            try {
                const canvasMetadata = get().canvases.map(c => ({
                    id: c.id,
                    name: c.name,
                    createdAt: c.createdAt
                }))
                localStorage.setItem('colab-canvases', JSON.stringify(canvasMetadata))
            } catch (e) {
                console.warn('Failed to save canvas metadata:', e)
            }
        }
    },

    objects: [],
    selectedObjectId: null,
    setSelectedObject: (id) => set({ selectedObjectId: id }),

    // Meet Session State
    meetSessionId: null,
    firebaseUnsubscribe: null,
    canvasMetadataUnsubscribe: null,

    initSync: async (sessionId: string) => {
        const state = get()

        // Unsubscribe from previous Firebase listeners if they exist
        if (state.firebaseUnsubscribe) {
            state.firebaseUnsubscribe()
        }
        if (state.canvasMetadataUnsubscribe) {
            state.canvasMetadataUnsubscribe()
        }

        set({ meetSessionId: sessionId })
        const result = initFirebaseSync(sessionId)

        if (result) {
            // Subscribe to Firebase for current canvas objects
            const currentCanvasId = state.currentCanvasId
            const objectsUnsubscribe = listenToObjects(sessionId, currentCanvasId, (objects: FloatingObject[]) => {
                console.log('📥 Firebase sync: Received', objects.length, 'objects for canvas', currentCanvasId)
                set({ objects })
            })

            // Subscribe to canvas metadata changes
            const metadataUnsubscribe = listenToCanvasMetadata(sessionId, (firebaseCanvases) => {
                const currentState = get()
                // Merge Firebase canvases with local session canvas
                const sessionCanvas = currentState.canvases.find(c => c.id.startsWith('session-'))

                // Ensure all Firebase canvases have objects property initialized
                const canvasesWithObjects = firebaseCanvases.map(c => ({
                    ...c,
                    objects: c.objects || [] // Initialize objects if not present
                }))

                const mergedCanvases = sessionCanvas
                    ? [sessionCanvas, ...canvasesWithObjects]
                    : canvasesWithObjects

                console.log('📥 Canvas metadata update: Merged', mergedCanvases.length, 'canvases')
                set({ canvases: mergedCanvases })
            })

            set({
                firebaseUnsubscribe: objectsUnsubscribe,
                canvasMetadataUnsubscribe: metadataUnsubscribe
            })
        }
    },

    addObject: (obj) => {
        set((state) => {
            if (state.meetSessionId) {
                broadcastObjectCreate(state.meetSessionId, state.currentCanvasId, obj)
            }
            return { objects: [...state.objects, obj] }
        })
    },

    updateObject: (id, updates) => {
        set((state) => {
            if (state.meetSessionId) {
                broadcastObjectUpdate(state.meetSessionId, state.currentCanvasId, id, updates)
            }
            return {
                objects: state.objects.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj)),
            }
        })
    },

    removeObject: (id) => set((state) => ({ objects: state.objects.filter((obj) => obj.id !== id) })),

    // Chat Input (for air writing)
    input: '',
    setInput: (text: string) => set({ input: text })
}))
