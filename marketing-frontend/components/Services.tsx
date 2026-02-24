"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Megaphone,
  Share2,
  Target,
  PenTool,
  BarChart,
  TrendingUp,
} from "lucide-react";

export default function Services() {
  const services = [
    {
      title: "Marketing",
      desc: "Strategies to promote your brand, attract your client",
      icon: Megaphone,
    },
    {
      title: "Social media",
      desc: "Building your presence and engagement",
      icon: Share2,
    },
    {
      title: "Paid media",
      desc: "Targeted advertising campaigns to maximize reach",
      icon: Target,
    },
    {
      title: "Content creation",
      desc: "High quality visuals, copy, and media assets",
      icon: PenTool,
    },
    {
      title: "SEO Optimization",
      desc: "Search friendly strategies to improve rankings",
      icon: BarChart,
    },
    {
      title: "Growth Marketing",
      desc: "Data driven tactics to accelerate customer acquisition",
      icon: TrendingUp,
    },
  ];

  return (
    <section className="py-24 px-6 bg-black text-white relative z-10 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="uppercase font-semibold tracking-widest text-xs mb-6 text-neutral-400"
            >
              [ Why choose us ]
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight max-w-2xl"
            >
              Our teamwork blends sharp strategy{" "}
              <span className="font-serif italic text-neutral-400 font-normal">
                with inspired design
              </span>
            </motion.h2>
          </div>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="group flex items-center shrink-0 w-fit gap-6 bg-white text-black pl-8 pr-2 py-2 rounded-full font-medium hover:bg-neutral-200 transition-colors"
          >
            <span className="text-sm uppercase tracking-wider font-semibold">
              Let's talk
            </span>
            <span className="bg-black text-white p-3 rounded-full -rotate-45 group-hover:rotate-0 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </span>
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-neutral-900 border border-white/5 p-8 rounded-3xl flex flex-col gap-6 hover:bg-neutral-800 transition-colors group relative overflow-hidden"
            >
              <div className="bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center">
                <s.icon className="w-6 h-6 text-white" />
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold tracking-tight mb-3">
                  {s.title}
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed max-w-[80%]">
                  {s.desc}
                </p>
              </div>
              <div className="mt-12 pt-8">
                <button className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold group-hover:text-neutral-300 transition-colors">
                  Learn more{" "}
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Background large icon */}
              <s.icon className="absolute -bottom-10 -right-10 w-64 h-64 text-white/2 -rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
