import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set, push, update } from 'firebase/database'
import { FloatingObject } from './store'

// Firebase config from your Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyAm6X7ufr1aKdGO8rSFt5X7QL2ILou3KSM",
    authDomain: "ghost-canvas.firebaseapp.com",
    databaseURL: "https://ghost-canvas-default-rtdb.firebaseio.com",
    projectId: "ghost-canvas",
    storageBucket: "ghost-canvas.firebasestorage.app",
    messagingSenderId: "68050399242",
    appId: "1:68050399242:web:950d5410871edd1c4e6ff3"
}

let app: any = null
let database: any = null

export const initFirebaseSync = (sessionId: string) => {
    if (typeof window === 'undefined') return null

    try {
        // Initialize Firebase (only once)
        if (!app) {
            app = initializeApp(firebaseConfig)
            database = getDatabase(app)
        }

        console.log('✅ Firebase Sync Initialized for session:', sessionId)
        return { database, sessionId }
    } catch (error) {
        console.error('Firebase init error:', error)
        return null
    }
}

export const broadcastObjectCreate = (sessionId: string, object: FloatingObject) => {
    if (!database) return

    const objectsRef = ref(database, `sessions/${sessionId}/objects/${object.id}`)
    set(objectsRef, object)
    console.log('📤 Broadcasting object creation to Firebase:', object.id)
}

export const broadcastObjectUpdate = (sessionId: string, objectId: string, changes: Partial<FloatingObject>) => {
    if (!database) return

    const objectRef = ref(database, `sessions/${sessionId}/objects/${objectId}`)
    update(objectRef, changes)
}

export const listenToObjects = (sessionId: string, callback: (objects: FloatingObject[]) => void) => {
    if (!database) return

    const objectsRef = ref(database, `sessions/${sessionId}/objects`)

    onValue(objectsRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
            const objects = Object.values(data) as FloatingObject[]
            console.log('📥 Received Firebase update:', objects.length, 'objects')
            callback(objects)
        }
    })
}
