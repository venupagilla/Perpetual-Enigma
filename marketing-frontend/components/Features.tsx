"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const features = [
  {
    title: "PitchLab",
    desc: "Pitch your startup to top investors and receive brutal feedback or investment decisions.",
    iconSrc:
      "https://cdn.prod.website-files.com/68812a9817966bb0f2885937/689b073a70997746c0e951d4_megaphone.webp",
    bgIconSrc:
      "https://cdn.prod.website-files.com/68812a9817966bb0f2885937/689b15e63a6461ac092eb203_megaphone%20(1).webp",
  },
  {
    title: "AI Pitch Generator",
    desc: "Create compelling scripts for any audience, timeline, or tone in seconds.",
    iconSrc:
      "https://cdn.prod.website-files.com/68812a9817966bb0f2885937/689b18a6678e350e5a704bcb_share.webp",
    bgIconSrc:
      "https://cdn.prod.website-files.com/68812a9817966bb0f2885937/689b18a6678e350e5a704bcb_share.webp",
  },
  {
    title: "B2B Lead Generation",
    desc: "Automated company discovery, web scraping, and AI signal scoring.",
    iconSrc:
      "https://cdn.prod.website-files.com/68812a9817966bb0f2885937/689b190343f291c83217f782_bullseye-arrow.webp",
    bgIconSrc:
      "https://cdn.prod.website-files.com/68812a9817966bb0f2885937/689b190343f291c83217f782_bullseye-arrow.webp",
  },
  {
    title: "LinkedIn Campaigns",
    desc: "Strategize and draft viral LinkedIn content to boost your organic reach.",
    iconSrc:
      "https://cdn.prod.website-files.com/68812a9817966bb0f2885937/689b1a2dd426c3c7b280c8b6_pencil-paintbrush.webp",
    bgIconSrc:
      "https://cdn.prod.website-files.com/68812a9817966bb0f2885937/689b1a2dd426c3c7b280c8b6_pencil-paintbrush.webp",
  },
];

export default function Features() {
  return (
    <section
      id="services"
      className="py-24 px-6 bg-black text-white relative z-10 w-full overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="uppercase font-semibold tracking-widest text-xs mb-8 text-neutral-400"
        >
          [ What We Do ]
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.1] max-w-5xl mb-24 capitalize"
        >
          Everything you need to <br />
          <span className="font-serif italic text-neutral-400 font-normal lowercase xl:tracking-tight">
            grow your brand.
          </span>
        </motion.h2>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full border-t border-white/10 pt-20">
          {features.map((f, i) => (
            <Feature key={i} {...f} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Feature({
  title,
  desc,
  iconSrc,
  bgIconSrc,
  delay,
}: {
  title: string;
  desc: string;
  iconSrc: string;
  bgIconSrc: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex items-start gap-6 p-8 md:p-12 bg-[#0a0a0a] border border-white/5 rounded-3xl hover:bg-[#111] transition-all duration-500 overflow-hidden text-left shadow-2xl min-h-[250px] lg:min-h-[280px]"
    >
      {/* Absolute Background Icon (Fixed Overlap by placing it far right, back, and low opacity) */}
      <div className="absolute top-1/2 -translate-y-1/2 right-[-2rem] md:-right-8 w-48 md:w-64 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700 pointer-events-none z-0">
        <img
          src={bgIconSrc}
          alt=""
          className="w-full h-auto object-contain drop-shadow-2xl grayscale"
          loading="lazy"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />

      {/* Content Container (z-10 ensures it stays above the absolute background icon) */}
      <div className="relative z-10 flex flex-col h-full w-full">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 backdrop-blur-md group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 shadow-lg">
          <img
            src={iconSrc}
            alt={title}
            className="w-8 h-8 object-contain"
            loading="lazy"
          />
        </div>

        <div className="relative flex flex-col gap-4 flex-grow">
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-white capitalize">
            {title}
          </h3>
          <p className="text-base text-neutral-400 leading-relaxed font-medium max-w-[85%]">
            {desc}
          </p>
        </div>

        {/* Animated Learn More Link */}
        <div className="mt-12 flex items-center gap-2 group/link cursor-pointer w-fit text-sm font-bold uppercase tracking-widest text-white group-hover/link:text-neutral-300 transition-colors">
          <span>Learn More</span>
          <div className="w-8 h-[2px] bg-white relative overflow-hidden group-hover/link:w-12 transition-all duration-300 ml-1">
            <div className="absolute inset-0 bg-neutral-400 transform -translate-x-full group-hover/link:translate-x-0 transition-transform duration-500 ease-out" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
