"use client"
import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trophy, TrendingUp, AlertCircle, MessageSquare, Send, XCircle, Info, RefreshCw, BarChart3, Radio, Briefcase, UserPlus, Mic, Volume2 } from "lucide-react"

export default function PitchLabPage() {
    const [partners] = useState([
        { name: "Aman Gupta", trait: "Brand Specialist", color: "blue" },
        { name: "Ashneer Grover", trait: "Efficiency Critic", color: "red" },
        { name: "Anupam Mittal", trait: "Scale Expert", color: "purple" },
        { name: "Peyush Bansal", trait: "Tech Visionary", color: "cyan" },
        { name: "Vineeta Singh", trait: "Marketing Guru", color: "pink" },
        { name: "Nithin Kamath", trait: "Risk Analyzer", color: "green" },
        { name: "Deepinder Goyal", trait: "Ops Strategist", color: "orange" }
    ])
    const [selectedPartner, setSelectedPartner] = useState<any>(partners[0])
    const [customName, setCustomName] = useState("")
    const [isOther, setIsOther] = useState(false)

    const [sessionId, setSessionId] = useState("")
    const [messages, setMessages] = useState<{ role: "user" | "partner", content: string }[]>([])
    const [inputMsg, setInputMsg] = useState("")
    const [loading, setLoading] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [isVoiceModeActive, setIsVoiceModeActive] = useState(false)
    const [status, setStatus] = useState<"setup" | "active" | "concluded">("setup")
    const [feedback, setFeedback] = useState("")

    const chatRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight
        }
    }, [messages, loading, isListening])

    // Main loop for voice mode
    useEffect(() => {
        if (isVoiceModeActive && status === "active" && !loading && !isListening) {
            startVoiceChat()
        }
    }, [isVoiceModeActive, status])

    const startSession = async () => {
        const partnerName = isOther ? customName : selectedPartner.name
        if (!partnerName.trim()) return

        setLoading(true)
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const res = await fetch(`${apiUrl}/api/pitch-lab/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ partner_name: partnerName })
            })
            const data = await res.json()
            if (res.ok) {
                setSessionId(data.session_id)
                setStatus("active")
                if (isOther) {
                    setSelectedPartner({ name: partnerName, trait: "Custom Advisor" })
                }
                setMessages([{ role: "partner", content: data.message }])
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputMsg.trim()) return

        const userText = inputMsg
        setMessages(prev => [...prev, { role: "user", content: userText }])
        setInputMsg("")
        setLoading(true)

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const res = await fetch(`${apiUrl}/api/pitch-lab/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId, user_message: userText })
            })
            const data = await res.json()
            if (res.ok) {
                setMessages(prev => [...prev, { role: "partner", content: data.reply }])
                if (data.status === "invested" || data.status === "out") {
                    setStatus("concluded")
                    setIsVoiceModeActive(false)
                }
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const toggleVoiceMode = () => {
        setIsVoiceModeActive(!isVoiceModeActive)
    }

    const startVoiceChat = async () => {
        setLoading(true)
        setIsListening(true)
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const res = await fetch(`${apiUrl}/api/pitch-lab/voice-chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId })
            })
            const data = await res.json()
            if (res.ok) {
                if (data.user_text) {
                    setMessages(prev => [...prev, { role: "user", content: data.user_text }])
                }
                setMessages(prev => [...prev, { role: "partner", content: data.reply }])
                if (data.status === "invested" || data.status === "out") {
                    setStatus("concluded")
                    setIsVoiceModeActive(false)
                } else if (isVoiceModeActive) {
                    // Short delay before next listening cycle
                    setTimeout(() => {
                        if (isVoiceModeActive) startVoiceChat()
                    }, 500)
                }
            }
        } catch (err) {
            console.error(err)
            setIsVoiceModeActive(false)
        } finally {
            setLoading(false)
            setIsListening(false)
        }
    }

    const getFeedback = async () => {
        setLoading(true)
        setIsVoiceModeActive(false)
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const res = await fetch(`${apiUrl}/api/pitch-lab/feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId })
            })
            const data = await res.json()
            if (res.ok) {
                setFeedback(data.feedback)
                setStatus("concluded")
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-10 max-w-6xl mx-auto w-full h-[calc(100vh-140px)]">
            <div className="flex flex-col gap-2 shrink-0">
                <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-4xl font-bold tracking-tighter"
                >
                    Pitch<span className="text-fuchsia-500 italic font-serif opacity-80">Lab</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-neutral-400"
                >
                    Elite Venture Partner simulations. Stress-test your business model.
                </motion.p>
            </div>

            <AnimatePresence mode="wait">
                {status === "setup" ? (
                    <motion.div
                        key="setup"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="flex-1 flex flex-col items-center justify-center p-4"
                    >
                        <div className="glass p-8 md:p-10 rounded-[3rem] shadow-2xl overflow-hidden max-w-2xl w-full relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[100px] pointer-events-none" />
                            <div className="flex flex-col gap-8 relative z-10">
                                <div className="text-center flex flex-col gap-2">
                                    <h2 className="text-2xl font-bold tracking-tight">Consult with The Board</h2>
                                    <p className="text-neutral-500 text-sm">Select a Venture Partner to critique your pitch and strategy.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {partners.map(partner => (
                                        <button
                                            key={partner.name}
                                            onClick={() => { setSelectedPartner(partner); setIsOther(false); }}
                                            className={`flex flex-col items-start p-4 rounded-2xl border-2 transition-all duration-300 text-left ${!isOther && selectedPartner.name === partner.name
                                                ? 'bg-fuchsia-500/10 border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.15)]'
                                                : 'bg-black/40 border-white/5 hover:border-white/10'
                                                }`}
                                        >
                                            <span className={`text-xs font-bold tracking-wide uppercase ${!isOther && selectedPartner.name === partner.name ? 'text-fuchsia-400' : 'text-neutral-400'}`}>
                                                {partner.name}
                                            </span>
                                            <span className="text-[10px] text-neutral-500 font-medium mt-1 uppercase tracking-tighter">{partner.trait}</span>
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setIsOther(true)}
                                        className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed transition-all duration-300 ${isOther
                                            ? 'bg-fuchsia-500/10 border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.15)]'
                                            : 'bg-black/40 border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <UserPlus className={`w-4 h-4 ${isOther ? 'text-fuchsia-500' : 'text-neutral-500'}`} />
                                        <span className={`text-xs font-bold tracking-wide uppercase ${isOther ? 'text-fuchsia-400' : 'text-neutral-400'}`}>
                                            Other
                                        </span>
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {isOther && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex flex-col gap-3"
                                        >
                                            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-500 ml-1">Custom Advisor Name</label>
                                            <Input
                                                value={customName}
                                                onChange={(e) => setCustomName(e.target.value)}
                                                placeholder="e.g. Elon Musk, Naval Ravikant..."
                                                className="h-14 bg-black/50 border-white/10 rounded-xl px-6 focus:border-fuchsia-500/50"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <Button
                                    onClick={startSession}
                                    disabled={loading || (isOther && !customName.trim())}
                                    className="h-16 rounded-2xl bg-white text-black hover:bg-neutral-200 font-black uppercase tracking-[0.2em] shadow-2xl shadow-fuchsia-500/20 group"
                                >
                                    {loading ? (
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <span className="flex items-center gap-3">
                                            <Briefcase className="w-5 h-5 text-fuchsia-500" />
                                            Enter PitchLab
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="tank"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1 flex flex-col min-h-0 bg-neutral-900/50 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                    >
                        {/* Control Bar */}
                        <div className="bg-black/60 backdrop-blur-md border-b border-white/10 p-5 flex justify-between items-center px-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-fuchsia-600 flex items-center justify-center text-white font-black text-xl overflow-hidden uppercase shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                                    {selectedPartner.name[0]}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold uppercase tracking-widest">{selectedPartner.name}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
                                        <span className="text-[10px] text-neutral-500 font-bold uppercase">SECURE PARTNER SESSION // V-ENC</span>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden md:flex items-center gap-8">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Expertise Profile</span>
                                    <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-tight">{selectedPartner.trait}</span>
                                </div>
                                {status !== "concluded" && (
                                    <Button variant="ghost" size="sm" onClick={getFeedback} className="hover:bg-fuchsia-500/10 hover:text-fuchsia-400 text-neutral-500 font-bold uppercase tracking-widest text-[10px] border border-white/5">
                                        End Session / Request Feedback
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Chat Space */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-12 flex flex-col gap-8 scrollbar-hide" ref={chatRef}>
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: msg.role === "user" ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`max-w-[70%] flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                            {msg.role === "user" ? "Founder" : selectedPartner.name}
                                        </span>
                                        <div className={`p-6 rounded-[2rem] text-sm leading-relaxed font-medium shadow-xl ${msg.role === "user"
                                            ? 'bg-fuchsia-600 text-white rounded-br-none shadow-fuchsia-500/10 shadow-lg'
                                            : 'bg-white/5 text-neutral-200 rounded-bl-none border border-white/10'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="bg-white/5 p-6 rounded-[2rem] rounded-bl-none border border-white/10 flex gap-2 items-center">
                                        <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-bounce" />
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Input / Feedback State */}
                        <div className="p-8 md:p-10 bg-black/60 border-t border-white/10 backdrop-blur-2xl">
                            <AnimatePresence mode="wait">
                                {status === "active" ? (
                                    <motion.form
                                        key="form"
                                        onSubmit={sendMessage}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex gap-4 relative"
                                    >
                                        <Input
                                            value={inputMsg}
                                            onChange={e => setInputMsg(e.target.value)}
                                            placeholder={isListening ? "Listening... Speak now." : isVoiceModeActive ? "Voice Mode Active..." : `Address ${selectedPartner.name.split(' ')[0]}...`}
                                            disabled={loading || isListening}
                                            className={`h-16 bg-white/5 border-white/10 rounded-2xl px-10 text-lg transition-all font-medium ${(isListening || isVoiceModeActive) ? 'ring-2 ring-fuchsia-500' : 'focus:ring-fuchsia-500/30'}`}
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                onClick={toggleVoiceMode}
                                                disabled={loading && !isVoiceModeActive}
                                                className={`h-16 w-16 rounded-2xl transition-all shadow-xl ${isVoiceModeActive
                                                    ? 'bg-red-500 animate-pulse text-white shadow-red-500/20'
                                                    : 'bg-white/5 border border-white/10 text-fuchsia-400 hover:bg-white/10 shadow-fuchsia-500/5'
                                                    }`}
                                            >
                                                {isVoiceModeActive ? <Radio className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                                            </Button>
                                            <Button disabled={loading || !inputMsg.trim() || isListening} className="h-16 w-16 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-xl shadow-fuchsia-500/20 transition-all">
                                                <Send className="w-6 h-6" />
                                            </Button>
                                        </div>
                                    </motion.form>
                                ) : (
                                    <motion.div
                                        key="feedback"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col gap-6"
                                    >
                                        {feedback ? (
                                            <div className="flex flex-col gap-4 p-8 rounded-3xl bg-fuchsia-500/10 border border-fuchsia-500/20">
                                                <div className="flex items-center gap-3 text-fuchsia-400 uppercase tracking-[0.2em] font-black text-xs">
                                                    <BarChart3 className="w-4 h-4" />
                                                    <span>Venture Partner Evaluation</span>
                                                </div>
                                                <p className="text-fuchsia-100/80 font-medium leading-relaxed whitespace-pre-wrap italic">"{feedback}"</p>
                                                <Button onClick={() => setStatus("setup")} className="w-fit mt-4 bg-white text-black hover:bg-neutral-200 py-6 px-10 rounded-xl font-bold uppercase tracking-widest transition-all">
                                                    Consult Another Partner
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-4 py-4">
                                                <span className="text-neutral-500 font-bold uppercase tracking-widest text-xs">The Board is ready.</span>
                                                <Button onClick={getFeedback} disabled={loading} className="bg-white text-black hover:bg-neutral-200 py-6 px-12 rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all">
                                                    {loading ? <RefreshCw className="animate-spin" /> : "Request Final Decision & Feedback"}
                                                </Button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
