"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Globe, TrendingUp, Info, AlertCircle, Loader2, ExternalLink } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function LeadGenPage() {
    const [product, setProduct] = useState("")
    const [industries, setIndustries] = useState("")

    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<any[]>([])
    const [error, setError] = useState("")

    const runPipeline = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setResults([])
        try {
            const target_industries = industries.split(",").map(i => i.trim()).filter(i => i)
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const res = await fetch(`${apiUrl}/api/leadgen/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ product, target_industries })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setResults(data.results || [])
            } else {
                setError(data.detail || "Failed to run lead gen pipeline.")
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-10 max-w-7xl mx-auto w-full pt-4 h-full">
            <div className="flex flex-col gap-2">
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold tracking-tighter"
                >
                    Market <span className="text-fuchsia-400 italic font-serif opacity-80">Discovery</span> Engine
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-neutral-400 max-w-2xl"
                >
                    Identify, analyze, and score high-intent leads across global markets with autonomous AI agents.
                </motion.p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass p-10 rounded-3xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[100px] pointer-events-none opacity-20" />

                <form onSubmit={runPipeline} className="flex flex-col md:flex-row gap-6 items-end relative z-10 w-full">
                    <div className="flex flex-col gap-3 flex-1 w-full">
                        <label className="text-xs uppercase tracking-widest font-bold text-neutral-500">Value Proposition</label>
                        <Input
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                            required
                            placeholder="What are you offering? (e.g. Cybersecurity for Fintech)"
                            className="h-14 rounded-2xl bg-black/50 border-white/10 px-6 focus:border-fuchsia-500/40"
                        />
                    </div>
                    <div className="flex flex-col gap-3 flex-1 w-full">
                        <label className="text-xs uppercase tracking-widest font-bold text-neutral-500">Market Vertical (comma separated)</label>
                        <Input
                            value={industries}
                            onChange={(e) => setIndustries(e.target.value)}
                            required
                            placeholder="e.g. SaaS, Fintech, Crypto"
                            className="h-14 rounded-2xl bg-black/50 border-white/10 px-6 focus:border-fuchsia-500/40"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="h-14 px-10 rounded-2xl bg-white text-black hover:bg-neutral-200 font-bold uppercase tracking-widest transition-all shadow-xl shadow-fuchsia-500/10 group overflow-hidden w-full md:w-fit"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Running Pipeline</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span>Initiate Discovery</span>
                            </div>
                        )}
                    </Button>
                </form>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                        >
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-3xl overflow-hidden flex-1 shadow-2xl relative"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent pointer-events-none" />

                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${results.length > 0 ? 'bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.5)]' : 'bg-neutral-700'}`} />
                        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Intelligence Report</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-bold uppercase">
                            <Globe className="w-3 h-3" />
                            <span>Global Monitoring Active</span>
                        </div>
                        {results.length > 0 && <span className="text-xs text-fuchsia-400 font-bold uppercase tracking-widest">{results.length} Leads Found</span>}
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/5 hover:bg-transparent px-8">
                                <TableHead className="text-neutral-500 uppercase tracking-widest text-[10px] font-bold py-6 pl-10">Target Entity</TableHead>
                                <TableHead className="text-neutral-500 uppercase tracking-widest text-[10px] font-bold py-6">Digital Footprint</TableHead>
                                <TableHead className="text-neutral-500 uppercase tracking-widest text-[10px] font-bold py-6">Propensity Score</TableHead>
                                <TableHead className="text-neutral-500 uppercase tracking-widest text-[10px] font-bold py-6 px-10 text-right">Extracted Signals</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.length === 0 && !loading && (
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableCell colSpan={4} className="h-[400px] text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                                            <Search className="w-12 h-12" />
                                            <p className="text-lg font-bold">No active intelligence threads.</p>
                                            <p className="text-sm">Configure parameters and initiate discovery to populate data.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {loading && results.length === 0 && (
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableCell colSpan={4} className="h-[400px] text-center">
                                        <div className="flex flex-col items-center justify-center gap-6">
                                            <div className="w-12 h-12 border-t-2 border-r-2 border-fuchsia-500/40 rounded-full animate-spin" />
                                            <div className="flex flex-col gap-2">
                                                <p className="text-neutral-300 font-bold tracking-widest uppercase text-xs animate-pulse">Running Multi-Stage Pipeline</p>
                                                <p className="text-neutral-500 text-xs px-12 max-w-md mx-auto">Scraping web pages, extracting AI signals, and calculating ICP alignment scores...</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {results.map((lead, idx) => (
                                <motion.tr
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="border-white/5 hover:bg-white/[0.03] transition-colors group"
                                >
                                    <TableCell className="py-6 pl-10">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-white text-lg tracking-tight group-hover:text-fuchsia-400 transition-colors uppercase">{lead.company}</span>
                                            <span className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase">Validated Lead</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-6">
                                        <a
                                            href={`https://${lead.domain}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-400 text-xs hover:text-white hover:border-white/20 transition-all font-medium"
                                        >
                                            {lead.domain}
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </TableCell>
                                    <TableCell className="py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${lead.score}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className={`h-full rounded-full bg-fuchsia-500/40 shadow-[0_0_10px_rgba(217,70,239,0.1)]`}
                                                />
                                            </div>
                                            <span className={`text-sm font-bold w-12 text-fuchsia-400`}>
                                                {lead.score}%
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-6 px-10 text-right">
                                        <div className="flex flex-wrap gap-2 justify-end">
                                            {Object.entries(lead.signals).map(([k, v]) => (
                                                <div key={k} className="group/signal relative bg-black/40 border border-white/5 px-2.5 py-1 rounded-md flex items-center gap-2 cursor-help hover:border-white/20 transition-all">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${v ? 'bg-fuchsia-500' : 'bg-white/10'}`} />
                                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">{k}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </motion.div>
        </div>
    )
}
