"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Send, RefreshCw, AlertCircle, CheckCircle2, Instagram, Zap } from "lucide-react"

export default function InstagramAutomationPage() {
    const [context, setContext] = useState("")
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
    const [message, setMessage] = useState("")

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!context.trim()) return

        setLoading(true)
        setStatus("idle")
        setMessage("")

        try {
            const response = await fetch("https://tagoregalla.app.n8n.cloud/webhook-test/instagram-post", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ context }),
            })

            if (response.ok) {
                setStatus("success")
                setMessage("Instagram post automation triggered successfully!")
                setContext("")
            } else {
                throw new Error("Failed to trigger automation.")
            }
        } catch (err: any) {
            setStatus("error")
            setMessage(err.message || "An unexpected error occurred.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-12 max-w-4xl mx-auto w-full pt-12">
            <div className="flex flex-col gap-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-fuchsia-500/20">
                        <Instagram className="w-8 h-8 text-white" />
                    </div>
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl font-bold tracking-tighter"
                >
                    Insta<span className="text-fuchsia-400 italic font-serif opacity-80">Automator</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-neutral-400 max-w-xl mx-auto"
                >
                    Connect your narrative to the visual world. Seamlessly automate your Instagram presence with a single click.
                </motion.p>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="glass p-10 md:p-14 rounded-[3rem] relative overflow-hidden shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[120px] pointer-events-none" />

                <form onSubmit={handlePost} className="flex flex-col gap-8 relative z-10">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-xs uppercase tracking-[0.3em] font-black text-neutral-500">Post Context</label>
                            <span className="text-[10px] text-fuchsia-500/50 font-bold uppercase tracking-widest italic">n8n // Neural Pipeline</span>
                        </div>
                        <textarea
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            required
                            rows={6}
                            className="w-full rounded-3xl bg-black/40 border border-white/10 p-8 text-lg focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all outline-none resize-none placeholder:text-neutral-700 font-medium"
                            placeholder="Briefly describe what your post should be about..."
                        />
                    </div>

                    <div className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            disabled={loading || !context.trim()}
                            className="h-20 rounded-2.5xl bg-white text-black hover:bg-neutral-200 font-black uppercase tracking-[0.3em] shadow-2xl shadow-fuchsia-500/20 group transition-all"
                        >
                            <div className="flex items-center gap-4">
                                {loading ? (
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                ) : (
                                    <Zap className="w-6 h-6 text-fuchsia-600 group-hover:scale-110 transition-transform" />
                                )}
                                <span>{loading ? "Transmitting..." : "Execute Automation"}</span>
                            </div>
                        </Button>

                        <AnimatePresence>
                            {status !== "idle" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, y: 10 }}
                                    animate={{ opacity: 1, height: "auto", y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: 10 }}
                                    className={`flex items-center gap-4 p-6 rounded-2xl border ${status === "success"
                                            ? "bg-green-500/10 border-green-500/20 text-green-400"
                                            : "bg-red-500/10 border-red-500/20 text-red-400"
                                        }`}
                                >
                                    {status === "success" ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                    <p className="text-sm font-bold uppercase tracking-widest">{message}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </form>
            </motion.div>

            <div className="flex justify-center gap-12 opacity-30 mt-4">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
                    <span className="text-[10px] uppercase tracking-tighter font-bold">Encrypted Webhook</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
                    <span className="text-[10px] uppercase tracking-tighter font-bold">n8n Automation</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
                    <span className="text-[10px] uppercase tracking-tighter font-bold">API Verified</span>
                </div>
            </div>
        </div>
    )
}
