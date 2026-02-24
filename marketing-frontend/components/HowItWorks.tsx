"use client";
import React from "react";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Define Target & Goal",
    desc: "Input your client's industry, target persona, and campaign objective. Our AI analyzes market trends instantly.",
  },
  {
    number: "02",
    title: "Generate Assets",
    desc: "Click generate to instantly receive campaign ideas, ad copy variations, and high-converting CTAs.",
  },
  {
    number: "03",
    title: "Score & Refine",
    desc: "Use the built-in Persona Simulator to test your pitch, score leads, and refine your messaging before launch.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-zinc-950 text-white relative z-10 border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-16 md:gap-8 justify-between">
          {/* Header Column */}
          <div className="md:w-1/3 flex flex-col items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="uppercase font-semibold tracking-widest text-xs mb-8 text-neutral-400"
            >
              [ Workflow ]
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold tracking-tighter leading-[1.1]"
            >
              How it <br />
              <span className="font-serif italic text-neutral-400 font-normal">
                works
              </span>
            </motion.h2>
          </div>

          {/* Steps Column */}
          <div className="md:w-2/3 flex flex-col gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="flex gap-6 md:gap-12"
              >
                <div className="text-3xl md:text-4xl font-serif italic text-neutral-600 font-light pt-1">
                  {step.number}
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                    {step.title}
                  </h3>
                  <p className="text-neutral-400 leading-relaxed font-medium max-w-lg">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
