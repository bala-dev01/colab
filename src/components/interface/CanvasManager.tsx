"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { Plus, FolderOpen, Trash2, Edit2, Check, X } from "lucide-react"

export default function CanvasManager() {
    const [isOpen, setIsOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [newCanvasName, setNewCanvasName] = useState("")
    
    const canvases = useStore((state) => state.canvases)
    const currentCanvasId = useStore((state) => state.currentCanvasId)
    const loadCanvasesFromStorage = useStore((state) => state.loadCanvasesFromStorage)
    const createCanvas = useStore((state) => state.createCanvas)
    const switchCanvas = useStore((state) => state.switchCanvas)
    const deleteCanvas = useStore((state) => state.deleteCanvas)
    const renameCanvas = useStore((state) => state.renameCanvas)
    
    // Load canvases from localStorage on mount
    useEffect(() => {
        loadCanvasesFromStorage()
    }, [loadCanvasesFromStorage])
    
    const handleCreateCanvas = () => {
        if (newCanvasName.trim()) {
            createCanvas(newCanvasName.trim())
            setNewCanvasName("")
        }
    }
    
    const startEdit = (id: string, currentName: string) => {
        setEditingId(id)
        setEditName(currentName)
    }
    
    const saveEdit = () => {
        if (editingId && editName.trim()) {
            renameCanvas(editingId, editName.trim())
        }
        setEditingId(null)
        setEditName("")
    }
    
    const cancelEdit = () => {
        setEditingId(null)
        setEditName("")
    }
    
    return (
        <div className="fixed top-24 right-8 z-40">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
            >
                <FolderOpen className="w-5 h-5" />
                <span className="font-medium">Canvases ({canvases.length})</span>
            </button>
            
            {/* Canvas Panel */}
            {isOpen && (
                <div className="absolute top-14 right-0 w-80 bg-black/90 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
                        <h3 className="text-white font-bold text-lg">Canvas Manager</h3>
                        <p className="text-white/70 text-xs">Create and switch between canvases</p>
                    </div>
                    
                    {/* Create New Canvas */}
                    <div className="p-4 border-b border-purple-500/20">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newCanvasName}
                                onChange={(e) => setNewCanvasName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateCanvas()}
                                placeholder="New canvas name..."
                                className="flex-1 bg-white/5 border border-purple-500/30 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 text-sm"
                            />
                            <button
                                onClick={handleCreateCanvas}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm font-medium">Create</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* Canvas List */}
                    <div className="max-h-96 overflow-y-auto">
                        {canvases.map((canvas) => (
                            <div
                                key={canvas.id}
                                className={`p-4 border-b border-purple-500/10 transition-all ${
                                    currentCanvasId === canvas.id
                                        ? 'bg-purple-600/20 border-l-4 border-l-purple-500'
                                        : 'hover:bg-white/5'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    {editingId === canvas.id ? (
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit()
                                                    if (e.key === 'Escape') cancelEdit()
                                                }}
                                                className="flex-1 bg-white/10 border border-purple-500/50 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
                                                autoFocus
                                            />
                                            <button
                                                onClick={saveEdit}
                                                className="text-green-400 hover:text-green-300 p-1"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="text-red-400 hover:text-red-300 p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => switchCanvas(canvas.id)}
                                                className="flex-1 text-left"
                                            >
                                                <div className="text-white font-medium">{canvas.name}</div>
                                                <div className="text-white/50 text-xs mt-1">
                                                    {canvas.objects.length} object{canvas.objects.length !== 1 ? 's' : ''}
                                                    {currentCanvasId === canvas.id && (
                                                        <span className="ml-2 text-purple-400">● Active</span>
                                                    )}
                                                </div>
                                            </button>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => startEdit(canvas.id, canvas.name)}
                                                    className="text-white/50 hover:text-white p-1 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                {canvases.length > 1 && (
                                                    <button
                                                        onClick={() => deleteCanvas(canvas.id)}
                                                        className="text-red-400/50 hover:text-red-400 p-1 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
