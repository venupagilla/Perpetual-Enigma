"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen pt-32 pb-16 px-6 flex flex-col justify-center overflow-hidden bg-black text-white">
      {/* Background Gradients and Grid */}
      <div className="absolute inset-0 z-0 bg-black">
        {/* Purple glow gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_20%,rgba(100,20,160,0.6),transparent_60%)]" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]"
          style={{ backgroundSize: "4rem 4rem" }}
        />
      </div>

      {/* Floating 3D Cubes Layer - Pushed backward */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
        <motion.img
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          src="https://cdn.prod.website-files.com/68812a9817966bb0f2885937/68812a9817966bb0f2885ac3_cube_1.webp"
          alt="Cube"
          className="absolute top-[10%] right-[15%] w-[15vw] min-w-[150px] object-contain drop-shadow-2xl animate-[float_6s_ease-in-out_infinite]"
        />
        <motion.img
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
          src="https://cdn.prod.website-files.com/68812a9817966bb0f2885937/68812a9817966bb0f2885abf_cube_2.webp"
          alt="Cube"
          className="absolute top-[40%] right-[30%] w-[12vw] min-w-[120px] object-contain drop-shadow-2xl animate-[float_8s_ease-in-out_infinite_reverse]"
        />
        <motion.img
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
          src="https://cdn.prod.website-files.com/68812a9817966bb0f2885937/68812a9817966bb0f2885ac0_cube_3.webp"
          alt="Cube"
          className="absolute top-[50%] right-[5%] w-[18vw] min-w-[180px] object-contain drop-shadow-2xl animate-[float_7s_ease-in-out_infinite]"
        />
        <motion.img
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
          src="https://cdn.prod.website-files.com/68812a9817966bb0f2885937/68812a9817966bb0f2885ac1_cube_4.webp"
          alt="Cube"
          className="absolute top-[75%] right-[25%] w-[20vw] min-w-[200px] object-contain drop-shadow-2xl animate-[float_9s_ease-in-out_infinite_reverse]"
        />
        <motion.img
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
          src="https://cdn.prod.website-files.com/68812a9817966bb0f2885937/68812a9817966bb0f2885ac2_cube_5.webp"
          alt="Cube"
          className="absolute top-[80%] right-[5%] w-[15vw] min-w-[150px] object-contain drop-shadow-2xl animate-[float_6s_ease-in-out_infinite]"
        />
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col">
        {/* Typographical Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="uppercase font-semibold tracking-widest text-[10px] sm:text-xs mb-8 text-neutral-400"
        >
          [ Introducing Brandeuver AI ]
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[3.5rem] sm:text-[5rem] md:text-[7rem] lg:text-[110px] xl:text-[130px] font-medium tracking-tight leading-[1] mb-12 relative z-20 pointer-events-none"
        >
          AUTOMATE <br />
          YOUR GROWTH <br />
          WITH{" "}
          <span className="text-neutral-300 font-serif italic font-normal lowercase tracking-normal bg-clip-text text-transparent bg-gradient-to-r from-neutral-200 to-neutral-400">
            precision
          </span>
          <br />
          <span className="text-neutral-300 font-serif italic font-normal lowercase tracking-normal pl-0 md:pl-2 bg-clip-text text-transparent bg-gradient-to-r from-neutral-200 to-neutral-500">
            marketing
          </span>
        </motion.h1>

        {/* Buttons and Subtext Container */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mt-auto w-full gap-12 border-t border-white/10 pt-8">
          {/* Glowing Pill Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group"
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-white/50 blur-xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <Link
              href="#"
              className="relative flex items-center gap-6 bg-white/95 backdrop-blur-sm text-black pl-8 pr-2 py-2 rounded-full font-medium shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-105 transition-all duration-300"
            >
              <span className="text-sm uppercase tracking-wider font-semibold opacity-80 group-hover:opacity-100">
                Get Started
              </span>
              <span className="bg-transparent text-black p-3 rounded-full flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 group-hover:rotate-45 transition-transform" />
              </span>
            </Link>
          </motion.div>

          {/* Subheading paragraphs */}
          <div className="flex flex-col justify-end max-w-sm">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-neutral-400 leading-snug mb-4 font-medium"
            >
              Stop guessing. Generate high-converting campaigns, score leads
              instantly, and simulate personas with our{" "}
              <strong className="text-white font-semibold">
                AI-driven marketing engine.
              </strong>
            </motion.p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
      `}</style>
    </section>
  );
}
