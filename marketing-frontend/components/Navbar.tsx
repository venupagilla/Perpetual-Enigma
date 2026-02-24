"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const navLinks = [
  { name: "Lead Generator", href: "/dashboard/leads" },
  { name: "Pitch Generator", href: "/dashboard/pitch" },
  { name: "LinkedIn Campaign", href: "/dashboard/campaigns" },
  { name: "Insta Automation", href: "/dashboard/instagram" },
  { name: "PitchLab", href: "/dashboard/pitch-lab" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-6 mix-blend-difference text-white">
        <Link
          href="/"
          className="text-xl font-bold tracking-tighter hover:opacity-80 transition-opacity z-50"
        >
          ©MarketEasy
        </Link>

        <div className="flex items-center gap-4 z-50">
          <Link
            href="/dashboard"
            className="hidden md:flex uppercase text-xs font-semibold tracking-widest hover:text-neutral-300 transition-colors"
          >
            [ Dashboard ]
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-center gap-2 group bg-white/5 border border-white/20 px-4 py-2.5 rounded-xl backdrop-blur-md hover:bg-white/10 transition-all cursor-pointer"
          >
            <span className="uppercase text-xs font-semibold tracking-widest mr-2">
              {isOpen ? "Close" : "Menu"}
            </span>
            <div className="w-5 h-4 flex flex-col justify-between items-end relative overflow-hidden">
              <motion.span
                animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                className="w-full h-[2px] bg-white origin-center"
              />
              <motion.span
                animate={isOpen ? { opacity: 0, x: 10 } : { opacity: 1, x: 0 }}
                className="w-3/4 h-[2px] bg-white"
              />
              <motion.span
                animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                className="w-full h-[2px] bg-white origin-center"
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Full Screen Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 bg-black/98 backdrop-blur-xl flex flex-col justify-center px-6 md:px-24"
          >
            <div className="flex flex-col gap-6 md:gap-10">
              {navLinks.map((link, i) => (
                <div key={link.name} className="overflow-hidden">
                  <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{
                      delay: i * 0.1,
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="text-5xl md:text-8xl font-medium tracking-tighter hover:text-neutral-400 hover:italic transition-all duration-300 block w-fit"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="absolute bottom-12 left-6 md:left-24 flex gap-8 items-center"
            >
              <Link
                href="#"
                className="uppercase text-xs font-semibold tracking-widest text-neutral-400 hover:text-white transition-colors"
              >
                Twitter
              </Link>
              <Link
                href="#"
                className="uppercase text-xs font-semibold tracking-widest text-neutral-400 hover:text-white transition-colors"
              >
                LinkedIn
              </Link>
              <Link
                href="#"
                className="uppercase text-xs font-semibold tracking-widest text-neutral-400 hover:text-white transition-colors"
              >
                Instagram
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
