"use client"
import React from "react"
import { motion } from "framer-motion"
import { Briefcase, Presentation, Users, Lightbulb, ArrowRight, Instagram } from "lucide-react"
import Link from "next/link"

const features = [
    {
        title: "Lead Generator",
        desc: "Automated discovery and scoring for target companies.",
        url: "/dashboard/leads",
        icon: Users,
        color: "from-fuchsia-500/10 to-transparent",
        borderColor: "group-hover:border-fuchsia-500/40",
        iconColor: "text-fuchsia-400"
    },
    {
        title: "Pitch Generator",
        desc: "Craft tailored elevator pitches for any audience or time limit.",
        url: "/dashboard/pitch",
        icon: Presentation,
        color: "from-fuchsia-500/10 to-transparent",
        borderColor: "group-hover:border-fuchsia-500/40",
        iconColor: "text-fuchsia-400"
    },
    {
        title: "LinkedIn Campaign",
        desc: "Strategize and generate high-converting LinkedIn content using AI.",
        url: "/dashboard/campaigns",
        icon: Briefcase,
        color: "from-fuchsia-500/10 to-transparent",
        borderColor: "group-hover:border-fuchsia-500/40",
        iconColor: "text-fuchsia-400"
    },
    {
        title: "Insta Automation",
        desc: "Automate your Instagram presence via n8n neural pipelines.",
        url: "/dashboard/instagram",
        icon: Instagram,
        color: "from-fuchsia-500/10 to-transparent",
        borderColor: "group-hover:border-fuchsia-500/40",
        iconColor: "text-fuchsia-400"
    },
    {
        title: "PitchLab",
        desc: "Simulate a high-stakes pitch and get brutal feedback from strategic Venture Partners.",
        url: "/dashboard/pitch-lab",
        icon: Lightbulb,
        color: "from-fuchsia-500/10 to-transparent",
        borderColor: "group-hover:border-fuchsia-500/40",
        iconColor: "text-fuchsia-400"
    }
]

export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-12 py-8">
            <div className="flex flex-col gap-4">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-7xl font-bold tracking-tighter"
                >
                    Targeted <br />
                    <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-600">Command Center</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl text-neutral-400 max-w-2xl leading-relaxed"
                >
                    Select a specialized intelligence module to accelerate your growth and dominate your market.
                </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((f, i) => (
                    <motion.div
                        key={f.title}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                    >
                        <Link
                            href={f.url}
                            className={`group relative flex flex-col p-8 rounded-3xl border border-white/10 bg-gradient-to-br ${f.color} backdrop-blur-xl transition-all duration-500 ${f.borderColor} hover:scale-[1.02] transform-gpu overflow-hidden h-full`}
                        >
                            {/* Decorative background element */}
                            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />

                            <div className={`p-4 rounded-2xl bg-black/40 border border-white/10 w-fit mb-6 ${f.iconColor} group-hover:scale-110 transition-transform duration-500`}>
                                <f.icon className="w-8 h-8" />
                            </div>

                            <h3 className="text-2xl font-bold mb-3 tracking-tight group-hover:translate-x-1 transition-transform">{f.title}</h3>
                            <p className="text-neutral-400 leading-relaxed mb-8">{f.desc}</p>

                            <div className="mt-auto flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                                <span>Launch Tool</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-12 p-8 rounded-3xl border border-white/5 bg-white/[0.02] flex flex-col md:flex-row items-center justify-between gap-8"
            >
                <div className="flex flex-col gap-2">
                    <h4 className="text-xl font-semibold">New intelligence modules arriving soon.</h4>
                    <p className="text-neutral-500">We're constantly training our agents on the latest market data.</p>
                </div>
                <div className="flex -space-x-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-12 h-12 rounded-full border-2 border-black bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-500">
                            AI
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
