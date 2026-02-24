"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Work() {
  const projects = [
    { title: "One Step", tags: "Web Design, Marketing", uid: 1 },
    { title: "Bold Moves", tags: "Web Design, Marketing", uid: 2 },
    { title: "Studio Focus", tags: "Web Design, Marketing", uid: 3 },
    { title: "Design Depth", tags: "Concept, Web Design", uid: 4 },
  ];

  return (
    <section className="py-24 px-6 bg-black text-white relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="uppercase font-semibold tracking-widest text-xs mb-8 text-neutral-400"
        >
          [ Featured work ]
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter leading-[1.1] max-w-4xl mb-24"
        >
          Excellence isn’t our goal <br />
          <span className="font-serif italic text-neutral-400 font-normal">
            — it’s our baseline
          </span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full text-left">
          {projects.map((p, i) => (
            <motion.a
              key={i}
              href="#"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group block"
            >
              <div className="w-full aspect-4/3 bg-neutral-900 rounded-3xl overflow-hidden relative mb-6">
                <div className="absolute inset-0 bg-neutral-800 transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-4xl font-bold tracking-tighter mix-blend-overlay">
                    PROJECT {p.uid}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center px-2">
                <h3 className="text-2xl font-bold tracking-tight">{p.title}</h3>
                <span className="text-sm font-medium text-neutral-400">
                  {p.tags}
                </span>
              </div>
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24"
        >
          <button className="group flex items-center shrink-0 gap-6 bg-white text-black pl-8 pr-2 py-2 rounded-full font-medium hover:bg-neutral-200 transition-colors">
            <span className="text-sm uppercase tracking-wider font-semibold">
              View all work
            </span>
            <span className="bg-black text-white p-3 rounded-full -rotate-45 group-hover:rotate-0 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
