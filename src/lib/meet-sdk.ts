export class MeetAddon {
    static isMeetEnv(): boolean {
        return typeof window !== 'undefined' && window.parent !== window
    }

    static async init(): Promise<string | null> {
        // Always check URL params - works for both local testing and Meet iframe
        try {
            const params = new URLSearchParams(window.location.search)
            const sessionId = params.get('meetSessionId') || 'demo-session'
            console.log('🔗 MeetAddon.init() - Session ID:', sessionId)
            return sessionId
        } catch (e) {
            console.error("Meet SDK Config Error:", e)
            return null
        }
    }
}
