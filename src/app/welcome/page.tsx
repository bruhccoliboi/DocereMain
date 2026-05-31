"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-olive/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-olive/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 text-center max-w-lg"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-olive/20 border border-olive/40 mb-8">
          <span className="font-heading text-2xl font-bold text-olive">D</span>
        </div>

        <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-4">
          The Teacher&apos;s Journal
        </p>

        <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-text-primary tracking-tight mb-4">
          Docere
        </h1>

        <p className="text-lg text-text-secondary leading-relaxed mb-2">
          Latin for &ldquo;to teach.&rdquo;
        </p>

        <p className="text-sm text-text-muted leading-relaxed mb-10 max-w-md mx-auto">
          Your private workspace to remember every lesson, track learner progress,
          and focus on what matters: teaching as a craft.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/onboarding">
            <Button size="lg">Begin setup</Button>
          </Link>
          <p className="text-xs text-text-muted">
            Starts completely empty. No sample data.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
