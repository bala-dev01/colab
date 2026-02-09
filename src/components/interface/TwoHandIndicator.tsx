"use client"

import { useStore } from "@/lib/store"

export default function TwoHandIndicator() {
    const twoHandState = useStore((state) => state.twoHandState)
    
    if (!twoHandState.isTwoHandPinching) return null
    
    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-lg animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="text-2xl">🤏</div>
                    <div>
                        <div className="font-bold">Pinch to Zoom Active</div>
                        <div className="text-xs opacity-90">Move hands apart/together to scale</div>
                    </div>
                    <div className="text-2xl">🤏</div>
                </div>
            </div>
        </div>
    )
}
