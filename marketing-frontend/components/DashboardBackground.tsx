"use client";
import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function DashboardBackground() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth the mouse movement
    const springConfig = { damping: 25, stiffness: 150 };
    const smoothX = useSpring(mouseX, springConfig);
    const smoothY = useSpring(mouseY, springConfig);

    // Transform mouse position for subtle parallax on static glows
    const parallaxX = useTransform(smoothX, [0, 1920], [-30, 30]);
    const parallaxY = useTransform(smoothY, [0, 1080], [-30, 30]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <div className="fixed inset-0 z-[0] bg-black overflow-hidden select-none pointer-events-none">
            {/* Base Grid - subtle and deep */}
            <div
                className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]"
                style={{ backgroundSize: "4rem 4rem" }}
            />

            {/* Glass Grain Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-[1] contrast-150 brightness-150"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            {/* Static Magenta Glows with subtle parallax */}
            <motion.div
                style={{ x: parallaxX, y: parallaxY }}
                className="absolute top-[-5%] left-[-5%] w-[60%] h-[60%] bg-fuchsia-600/15 blur-[130px] rounded-full opacity-60"
            />
            <motion.div
                style={{ x: useTransform(parallaxX, v => -v), y: useTransform(parallaxY, v => -v) }}
                className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-purple-600/15 blur-[130px] rounded-full opacity-60"
            />

            {/* Interactive Mouse Follow Glow - The "Flashlight" effect */}
            <motion.div
                style={{
                    left: smoothX,
                    top: smoothY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                className="absolute w-[800px] h-[800px] bg-fuchsia-400/[0.1] blur-[120px] rounded-full"
            />

            {/* Floating 3D-like Orbs */}
            <motion.div
                animate={{
                    y: [0, -50, 0],
                    x: [0, 30, 0],
                    rotate: [0, 10, 0],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[15%] right-[15%] w-80 h-80 bg-fuchsia-500/10 blur-3xl rounded-full"
            />
            <motion.div
                animate={{
                    y: [0, 60, 0],
                    x: [0, -40, 0],
                    rotate: [0, -15, 0],
                    opacity: [0.1, 0.15, 0.1]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-purple-500/10 blur-3xl rounded-full"
            />

            {/* Moving Ambient Lines (Cyberpunk feel) */}
            <div className="absolute inset-0">
                {[...Array(4)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ left: "-100%" }}
                        animate={{ left: "200%" }}
                        transition={{
                            duration: 20 + i * 5,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 5
                        }}
                        className="absolute top-[30%] w-[60%] h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500/20 to-transparent rotate-[35deg]"
                        style={{ top: `${15 + i * 20}%` }}
                    />
                ))}
            </div>

            {/* Scanline effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[length:100%_4px] pointer-events-none opacity-20" />
        </div>
    );
}
