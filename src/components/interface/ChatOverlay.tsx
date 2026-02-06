"use client"

import { useState, useEffect } from "react"
import { Mic, Send, Sparkles } from "lucide-react"
import { generateUI } from "@/app/actions"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { MeetAddon } from "@/lib/meet-sdk"

export default function ChatOverlay() {
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCollaborating, setIsCollaborating] = useState(false)
  
  const addObject = useStore((state) => state.addObject)
  const initSync = useStore((state) => state.initSync)

  useEffect(() => {
    // Initialize Collaboration if in Meet or forced via URL
    const checkMeet = async () => {
        const sessionId = await MeetAddon.init()
        if (sessionId) {
            console.log("Initializing Collaboration for Session:", sessionId)
            await initSync(sessionId)
            setIsCollaborating(true)
        }
    }
    checkMeet()
  }, [initSync])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isGenerating) return

    setIsGenerating(true)
    
    // Call Server Action
    const result = await generateUI(input)
    
    if ('content' in result && result.content) {
        // Add to 3D store
        addObject({
            id: Math.random().toString(36).substring(7),
            type: 'html',
            content: result.content,
            // Spawn in front of camera (roughly)
            position: [0, 0, 0], 
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
        })
    } else if ('error' in result && result.error) {
        alert(result.error)
    }

    setInput("")
    setIsGenerating(false)
  }

  return (
    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-full max-w-lg z-50 px-4">
      {/* Collaboration Status Badge */}
      {isCollaborating && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-green-500/30 px-3 py-1 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-medium tracking-wide">MEET SYNC ACTIVE</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-2 shadow-2xl">
          <Sparkles className={cn("w-5 h-5 ml-3 mr-3 text-purple-400", isGenerating && "animate-pulse")} />
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isGenerating ? "Gemini is dreaming..." : "Dream it. Say 'Login Screen'..."}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 font-medium"
            disabled={isGenerating}
          />
          
          <button 
            type="button" // Todo: Implement Web Speech API
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <Mic className="w-5 h-5" />
          </button>
          
          <button 
            type="submit" 
            disabled={!input.trim() || isGenerating}
            className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg ml-2 transition-all text-white"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
