"use client"
import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Send, RefreshCw, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react"

const GlassSelect = ({ value, onChange, options, label }: { value: string, onChange: (val: string) => void, options: { label: string, value: string }[], label: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="flex flex-col gap-3 relative" ref={containerRef}>
            <label className="text-xs uppercase tracking-widest font-bold text-neutral-500 ml-1">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="h-12 w-full rounded-xl bg-black/40 border border-white/10 px-4 text-sm flex items-center justify-between focus:border-fuchsia-500/50 outline-none transition-all hover:bg-black/60 group"
            >
                <span className="text-neutral-200">{selectedOption?.label || value}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-4 h-4 text-neutral-500 group-hover:text-fuchsia-500" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-[calc(100%+8px)] left-0 w-full z-50 bg-[#0a0a0a] backdrop-blur-xl rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10"
                    >
                        <div className="max-h-40 overflow-y-auto py-2 px-1 custom-scrollbar">
                            {options.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-4 py-3 rounded-xl text-left text-sm transition-all hover:bg-white/5 flex items-center justify-between group/opt ${value === opt.value ? 'bg-fuchsia-500/10 text-fuchsia-400' : 'text-neutral-400'}`}
                                >
                                    <span>{opt.label}</span>
                                    {value === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.8)]" />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function PitchGeneratorPage() {
    const [product, setProduct] = useState("")
    const [audience, setAudience] = useState("customer")
    const [timeLimit, setTimeLimit] = useState("60s")
    const [tone, setTone] = useState("Confident")
    const [language, setLanguage] = useState("english")

    const audienceOptions = [
        { value: "investor", label: "Venture Capitalists" },
        { value: "customer", label: "End Customers" },
        { value: "b2b", label: "Enterprise Clients" },
        { value: "partner", label: "Strategic Partners" }
    ]
    const timeLimitOptions = [
        { value: "30s", label: "30s Elevator" },
        { value: "60s", label: "60s Standard" },
        { value: "120s", label: "120s Extended" }
    ]
    const toneOptions = [
        { value: "Confident", label: "Confident" },
        { value: "Enthusiastic", label: "Enthusiastic" },
        { value: "professional", label: "Professional" },
        { value: "friendly", label: "Friendly" },
        { value: "empathetic", label: "Empathetic" }
    ]
    const languageOptions = [
        { value: "english", label: "English" },
        { value: "hindi", label: "Hindi" },
        { value: "hinglish", label: "Hinglish" }
    ]

    const [loading, setLoading] = useState(false)
    const [pitch, setPitch] = useState("")
    const [feedback, setFeedback] = useState("")
    const [error, setError] = useState("")

    const generatePitch = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const res = await fetch(`${apiUrl}/api/pitch-generator/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ product, audience, time_limit: timeLimit, tone, language })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setPitch(data.pitch.script)
            } else {
                setError(data.detail || "Failed to generate pitch.")
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const regeneratePitch = async () => {
        if (!feedback) return
        setLoading(true)
        setError("")
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const res = await fetch(`${apiUrl}/api/pitch-generator/regenerate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ product, audience, time_limit: timeLimit, tone, language, previous_pitch: pitch, user_feedback: feedback })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setPitch(data.pitch.script)
                setFeedback("")
            } else {
                setError(data.detail || "Failed to regenerate pitch.")
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-12 max-w-6xl mx-auto w-full pt-4">
            <div className="flex flex-col gap-2">
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold tracking-tighter"
                >
                    AI Pitch <span className="text-fuchsia-400 italic font-serif opacity-80">Architect</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-neutral-400"
                >
                    Transform your product vision into a high-stakes narrative in seconds.
                </motion.p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Input Controls */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-5 flex flex-col gap-8"
                >
                    <div className="glass p-8 rounded-3xl relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-3xl opacity-20" />

                        <form onSubmit={generatePitch} className="flex flex-col gap-6 relative z-10">
                            <div className="flex flex-col gap-3">
                                <label className="text-xs uppercase tracking-widest font-bold text-neutral-500">Product Hypothesis</label>
                                <textarea
                                    value={product}
                                    onChange={(e) => setProduct(e.target.value)}
                                    required
                                    rows={4}
                                    className="w-full rounded-2xl bg-black/50 border border-white/10 p-4 text-sm focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all outline-none resize-none"
                                    placeholder="Describe your product, its core mission, and the problem it solves..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <GlassSelect
                                    label="Boardroom"
                                    value={audience}
                                    options={audienceOptions}
                                    onChange={setAudience}
                                />
                                <GlassSelect
                                    label="Clock"
                                    value={timeLimit}
                                    options={timeLimitOptions}
                                    onChange={setTimeLimit}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <GlassSelect
                                    label="Voice"
                                    value={tone}
                                    options={toneOptions}
                                    onChange={setTone}
                                />
                                <GlassSelect
                                    label="Language"
                                    value={language}
                                    options={languageOptions}
                                    onChange={setLanguage}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="mt-4 h-14 rounded-xl text-black bg-white hover:bg-neutral-200 font-bold uppercase tracking-widest transition-all group overflow-hidden"
                            >
                                <div className="relative z-10 flex items-center gap-2">
                                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                                    <span>{loading ? "Synthesizing..." : "Initiate Design"}</span>
                                </div>
                            </Button>
                        </form>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                            >
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Output Display */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex-1 min-h-[500px] glass rounded-3xl relative flex flex-col overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent pointer-events-none" />

                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${pitch ? 'bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.5)]' : 'bg-neutral-700'}`} />
                                <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Production Output</span>
                            </div>
                            {pitch && (
                                <div className="flex items-center gap-2 text-xs font-bold text-fuchsia-400 uppercase tracking-widest italic">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Success</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 p-10 overflow-y-auto">
                            {!pitch && !loading && (
                                <div className="h-full flex flex-col items-center justify-center text-center gap-6 opacity-40">
                                    <Sparkles className="w-16 h-16" />
                                    <div className="flex flex-col gap-2">
                                        <p className="text-lg font-bold">Waiting for input parameters.</p>
                                        <p className="text-sm">Enter your product details to generate a pitch.</p>
                                    </div>
                                </div>
                            )}
                            {loading && !pitch && (
                                <div className="h-full flex flex-col items-center justify-center gap-8">
                                    <div className="w-16 h-16 border-t-2 border-r-2 border-fuchsia-500/40 rounded-full animate-spin" />
                                    <p className="text-neutral-500 animate-pulse font-medium tracking-widest uppercase text-xs">Architecting Narrative...</p>
                                </div>
                            )}
                            {pitch && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-lg leading-relaxed text-neutral-200 whitespace-pre-wrap font-medium"
                                >
                                    {pitch}
                                </motion.div>
                            )}
                        </div>

                        {pitch && (
                            <div className="p-8 bg-black/40 border-t border-white/10 backdrop-blur-xl">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs uppercase tracking-widest font-bold text-neutral-500">Refinement Layer</label>
                                        <span className="text-[10px] text-neutral-600 font-bold uppercase">v1.2 // Neural Feedback</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <Input
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="e.g. Intensify the closing statement, emphasize ROI..."
                                            className="h-12 rounded-xl bg-black/50 border-white/10 focus:border-fuchsia-500/50"
                                        />
                                        <Button
                                            onClick={regeneratePitch}
                                            disabled={loading || !feedback}
                                            className="h-12 px-6 rounded-xl bg-fuchsia-600/10 text-fuchsia-300 hover:bg-fuchsia-600/20 border border-fuchsia-500/20 font-bold transition-all"
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            Refine
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
