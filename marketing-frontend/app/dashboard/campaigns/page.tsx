"use client"
import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Linkedin, Send, CheckCircle2, AlertCircle, RefreshCw, MessageSquare, Newspaper, Clock, ThumbsUp, Share2, Globe } from "lucide-react"

export default function LinkedInCampaignPage() {
    const [threadId] = useState(() => crypto.randomUUID())
    const [messages, setMessages] = useState<{ role: "user" | "assistant", content: string }[]>([])
    const [inputMsg, setInputMsg] = useState("")
    const [loading, setLoading] = useState(false)
    const [draft, setDraft] = useState<any>(null)
    const [draftFeedback, setDraftFeedback] = useState("")
    const [error, setError] = useState("")

    const chatRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight
        }
    }, [messages, loading, draft])

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputMsg.trim()) return

        const userText = inputMsg
        setMessages(prev => [...prev, { role: "user", content: userText }])
        setInputMsg("")
        setLoading(true)
        setError("")

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const res = await fetch(`${apiUrl}/api/linkedin/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ thread_id: threadId, user_message: userText })
            })
            const data = await res.json()
            if (res.ok) {
                if (data.intent === "chat" || data.intent === "campaign_generation") {
                    let reply = data.response?.chat_reply || ""
                    setMessages(prev => [...prev, { role: "assistant", content: reply }])
                } else if (data.intent === "post_generation") {
                    setDraft(data.post_draft)
                    setMessages(prev => [...prev, { role: "assistant", content: "Optimization complete. I've drafted a potential viral post for your review." }])
                }
            } else {
                setError(data.detail || "Error communicating with the agent.")
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const processDraft = async (approved: boolean) => {
        setLoading(true)
        setError("")
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const res = await fetch(`${apiUrl}/api/linkedin/process`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    thread_id: threadId,
                    approve: approved,
                    user_feedback: approved ? "" : draftFeedback
                })
            })
            const data = await res.json()
            if (res.ok) {
                if (approved) {
                    setMessages(prev => [...prev, { role: "assistant", content: "Post successfully dispatched to distribution channels." }])
                    setDraft(null)
                } else {
                    setMessages(prev => [...prev, { role: "assistant", content: "Copy adjusted based on your technical feedback. Reviewing revised version..." }])
                    setDraftFeedback("")
                    if (data.status === "pending" && data.draft) {
                        setDraft(data.draft)
                    } else {
                        setDraft(null)
                    }
                }
            } else {
                setError(data.detail || "Error processing draft.")
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-10 max-w-7xl mx-auto w-full h-[calc(100vh-140px)]">
            <div className="flex flex-col gap-2 shrink-0">
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold tracking-tighter"
                >
                    Social <span className="text-fuchsia-400 italic font-serif opacity-80">Engine</span> Optimization
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-neutral-400"
                >
                    Engineer viral LinkedIn narratives with our autonomous campaign agents.
                </motion.p>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 gap-10 min-h-0">

                {/* Chat Interface */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col flex-1 glass rounded-[2.5rem] overflow-hidden shadow-2xl relative"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[100px] pointer-events-none opacity-20" />

                    <div className="bg-black/40 border-b border-white/10 p-6 flex justify-between items-center px-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-fuchsia-600 flex items-center justify-center border border-white/10">
                                <Linkedin className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">Campaign Analyst // v4.0</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
                            <span className="text-[10px] text-neutral-500 font-bold uppercase">Streaming Active</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 md:p-12 flex flex-col gap-6" ref={chatRef}>
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center gap-6 opacity-30 text-center px-20">
                                <Newspaper className="w-16 h-16" />
                                <div className="flex flex-col gap-2">
                                    <p className="text-lg font-bold">Waiting for Initialization.</p>
                                    <p className="text-sm">Describe your goal, product, or target audience to begin architecting your campaign.</p>
                                </div>
                            </div>
                        )}
                        <AnimatePresence>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: msg.role === "user" ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`max-w-[85%] flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">{msg.role}</span>
                                        <div className={`p-6 rounded-[2rem] text-sm leading-relaxed font-medium ${msg.role === "user"
                                            ? "bg-fuchsia-600 text-white rounded-br-none shadow-fuchsia-500/10 shadow-lg"
                                            : "bg-white/5 text-neutral-200 rounded-bl-none border border-white/10 shadow-xl"
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {loading && !draft && (
                            <div className="flex justify-start">
                                <div className="p-6 rounded-[2rem] rounded-bl-none border border-white/10 flex gap-2 items-center bg-white/5">
                                    <div className="w-1.5 h-1.5 bg-fuchsia-500/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-fuchsia-500/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-fuchsia-500/40 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-10 bg-black/40 border-t border-white/10 backdrop-blur-2xl">
                        <form onSubmit={sendMessage} className="flex gap-4">
                            <Input
                                value={inputMsg}
                                onChange={e => setInputMsg(e.target.value)}
                                placeholder="Instruct the agent..."
                                disabled={loading || draft !== null}
                                className="h-16 bg-white/5 border-white/10 rounded-2xl px-10 text-lg focus:ring-fuchsia-500/20 font-medium"
                            />
                            <Button type="submit" disabled={loading || !inputMsg.trim() || draft !== null} className="h-16 w-16 rounded-2xl bg-white text-black hover:bg-neutral-200 shadow-xl">
                                <Send className="w-6 h-6" />
                            </Button>
                        </form>
                    </div>
                </motion.div>

                {/* Draft Review Sidebar */}
                <AnimatePresence>
                    {draft && (
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 40 }}
                            className="flex flex-col w-full lg:w-[450px] gap-6"
                        >
                            <div className="glass rounded-[2rem] flex flex-col flex-1 overflow-hidden shadow-2xl relative">
                                <div className="absolute inset-0 bg-fuchsia-500/5 pointer-events-none opacity-20" />

                                <div className="bg-white/5 border-b border-white/10 p-6 flex justify-between items-center px-8 relative z-10">
                                    <span className="text-xs font-bold uppercase tracking-widest text-fuchsia-400 italic">Technical Review</span>
                                    <div className="px-2 py-0.5 rounded bg-fuchsia-500 text-white text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-fuchsia-500/20">Action Required</div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-10 relative z-10">
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                            <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-lg font-bold text-neutral-500">ME</div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold">MarketEasy Autonomous Agent</span>
                                                <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Optimized for 10:00 AM EST</span>
                                                    <span className="mx-1">•</span>
                                                    <Globe className="w-3 h-3" />
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-sm md:text-base text-neutral-200 leading-relaxed whitespace-pre-wrap font-medium font-sans">
                                            {draft.content || JSON.stringify(draft, null, 2)}
                                        </p>

                                        <div className="flex items-center justify-between border-t border-white/5 pt-6 text-neutral-500">
                                            <div className="flex items-center gap-6">
                                                <ThumbsUp className="w-4 h-4 hover:text-fuchsia-400 transition-colors" />
                                                <MessageSquare className="w-4 h-4 hover:text-fuchsia-400 transition-colors" />
                                                <Share2 className="w-4 h-4 hover:text-fuchsia-400 transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-neutral-900 border-t border-white/10 backdrop-blur-xl relative z-10">
                                    <div className="flex flex-col gap-4">
                                        <Button onClick={() => processDraft(true)} disabled={loading} className="h-14 w-full bg-fuchsia-600 text-white hover:bg-fuchsia-700 font-black uppercase tracking-widest shadow-xl shadow-fuchsia-500/10 transition-all">
                                            Deploy Campaign
                                        </Button>
                                        <div className="flex items-center gap-4">
                                            <div className="h-[1px] bg-white/10 flex-1" />
                                            <span className="text-[10px] text-neutral-500 font-bold uppercase shrink-0">Modify Logic</span>
                                            <div className="h-[1px] bg-white/10 flex-1" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                value={draftFeedback}
                                                onChange={e => setDraftFeedback(e.target.value)}
                                                placeholder="Critique..."
                                                className="bg-black/40 border-white/10 h-12 rounded-xl text-sm focus:border-fuchsia-500/40"
                                            />
                                            <Button onClick={() => processDraft(false)} disabled={loading || !draftFeedback.trim()} className="h-12 px-6 rounded-xl bg-white/5 text-neutral-400 hover:bg-white/10 border border-white/10 font-bold text-xs uppercase transition-all">
                                                Adjust
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    )
}
