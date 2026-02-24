"use client";
import React from "react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-32 pb-8 px-6 border-t border-white/10 mt-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-32 relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 max-w-4xl leading-[1.1]"
          >
            Smarter marketing{" "}
            <span className="font-serif italic font-normal text-neutral-400">
              starts here
            </span>
            .<br />
            Close more deals.
          </motion.h2>
          <p className="text-neutral-400 max-w-xl text-lg md:text-xl mb-12 font-medium leading-relaxed">
            Stop guessing and start converting. Join thousands of marketers
            using our AI platform to outpace the competition.
          </p>
          <button className="group flex items-center gap-6 bg-white text-black pl-8 pr-2 py-2 rounded-full font-medium hover:bg-neutral-200 transition-colors">
            <span className="text-sm uppercase tracking-wider font-semibold">
              Get Started For Free
            </span>
            <span className="bg-black text-white p-3 rounded-full group-hover:rotate-45 transition-transform">
              <ArrowUpRight className="w-5 h-5" />
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 font-medium text-sm text-neutral-400 mb-24 border-t border-white/10 pt-16 relative z-10">
          <div>
            <div className="uppercase tracking-widest text-xs font-semibold text-white mb-6">
              [ General Contact ]
            </div>
            <a
              href="#"
              className="block hover:text-white transition-colors mb-2"
            >
              hello@website.com
            </a>
          </div>
          <div>
            <div className="uppercase tracking-widest text-xs font-semibold text-white mb-6">
              [ New Ventures ]
            </div>
            <a
              href="#"
              className="block hover:text-white transition-colors mb-2"
            >
              work@website.com
            </a>
          </div>
          <div>
            <div className="uppercase tracking-widest text-xs font-semibold text-white mb-6">
              [ Address ]
            </div>
            <p className="leading-relaxed">
              123 Broadway
              <br />
              New York, NY
              <br />
              10006, USA
            </p>
          </div>
          <div>
            <div className="uppercase tracking-widest text-xs font-semibold text-white mb-6">
              [ Follow us ]
            </div>
            <div className="flex flex-col gap-2">
              <a href="#" className="hover:text-white transition-colors">
                Twitter (X)
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Instagram
              </a>
              <a href="#" className="hover:text-white transition-colors">
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-neutral-600 font-semibold uppercase tracking-widest border-t border-white/10 pt-8 relative z-10">
          <div>[ ©Copyright 2026 MarketEasy. powered by Next.js ]</div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-neutral-300 transition-colors">
              [ Style Guide ]
            </a>
            <a href="#" className="hover:text-neutral-300 transition-colors">
              [ Licenses ]
            </a>
          </div>
        </div>
      </div>

      {/* Decorative center glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[80vw] h-[40vw] bg-white/5 blur-[120px] pointer-events-none rounded-[100%]" />
    </footer>
  );
}
