import { create } from 'zustand'

export interface HandState {
    x: number // Normalized 0-1
    y: number // Normalized 0-1
    z: number // Depth
    isPresent: boolean
    isPinching: boolean // Thumb + Index touching
    isPointing: boolean // Index extended, others closed (roughly)
}

export interface FloatingObject {
    id: string
    type: 'wireframe' | 'image' | 'text' | 'html'
    content: string // SVG code or keys
    position: [number, number, number] // 3D world coordinates
    scale: [number, number, number]
    rotation: [number, number, number]
}

interface AppState {
    // Hand State
    hand: HandState
    setHand: (hand: Partial<HandState>) => void

    // Scene State
    objects: FloatingObject[]
    addObject: (obj: FloatingObject) => void
    updateObject: (id: string, updates: Partial<FloatingObject>) => void
    removeObject: (id: string) => void
}

export const useStore = create<AppState>((set) => ({
    hand: { x: 0.5, y: 0.5, z: 0, isPresent: false, isPinching: false, isPointing: false },
    setHand: (updates) => set((state) => ({ hand: { ...state.hand, ...updates } })),

    objects: [],
    addObject: (obj) => set((state) => ({ objects: [...state.objects, obj] })),
    updateObject: (id, updates) =>
        set((state) => ({
            objects: state.objects.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj)),
        })),
    removeObject: (id) => set((state) => ({ objects: state.objects.filter((obj) => obj.id !== id) })),
}))
