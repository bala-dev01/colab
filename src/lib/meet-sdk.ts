export class MeetAddon {
    static isMeetEnv(): boolean {
        return typeof window !== 'undefined' && window.parent !== window
    }

    static async init(): Promise<string | null> {
        // Try to get session from Meet iframe context
        if (this.isMeetEnv()) {
            try {
                // In a real Meet Add-on, you'd use the Meet Add-ons SDK
                // For now, we'll try to extract from URL or use postMessage
                const meetSessionFromUrl = this.extractMeetSessionFromUrl()
                if (meetSessionFromUrl) {
                    console.log('🔗 Detected Meet session from URL:', meetSessionFromUrl)
                    return meetSessionFromUrl
                }
            } catch (e) {
                console.error('Meet session detection error:', e)
            }
        }

        // Fallback: Check URL params (works for both standalone and Meet)
        const params = new URLSearchParams(window.location.search)
        const sessionId = params.get('meetSessionId') || params.get('sessionId') || 'demo-session'
        console.log('🔗 MeetAddon.init() - Session ID:', sessionId)
        return sessionId
    }

    private static extractMeetSessionFromUrl(): string | null {
        // Try to extract Meet code from referrer or parent URL
        try {
            const url = window.location.href
            const meetCodeMatch = url.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/)
            if (meetCodeMatch) {
                return meetCodeMatch[1]
            }
        } catch (e) {
            console.error('URL extraction error:', e)
        }
        return null
    }

    static async getMeetParticipants(): Promise<string[]> {
        // Placeholder for future Meet SDK integration
        // Would use meet.addon.getParticipants() in production
        return []
    }
}
