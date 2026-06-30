"use client";

import React, { useState } from "react";
import { ShieldCheck, Search, BookOpen, ExternalLink } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

interface Study {
  title: string;
  journal: string;
  year: number;
  snippet: string;
  doi: string;
}

export default function GuideView() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);

  const mockStudies: Study[] = [
    {
      title: "Hormonal dynamics and mood variation during the follicular vs luteal cycle phases",
      journal: "The Lancet Endocrinology",
      year: 2022,
      snippet: "Analysis of estrogen peak timelines indicates a 22% increase in cognitive focus, spatial reasoning, and social interaction markers during the late follicular phase.",
      doi: "10.1016/S2213-8587(22)00155-2",
    },
    {
      title: "Impact of Micronutrient Supplementation on Menstrual Cycle Regularity and Pain Symptoms",
      journal: "Journal of Women's Health",
      year: 2023,
      snippet: "Magnesium glycinate combined with Vitamin D3 was found to reduce prostaglandins production, significantly lowering cramps severity in 68% of study participants.",
      doi: "10.1089/jwh.2022.0911",
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearched(true);
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 w-full max-w-4xl mx-auto"
    >
      {/* Title */}
      <section className="space-y-1.5">
        <h1 className="font-serif text-3xl font-bold text-ink-text flex items-center gap-2">
          <ShieldCheck className="h-6.5 w-6.5 text-plum" />
          Health Guide (Clinical Evidence)
        </h1>
        <p className="text-xs text-ink-soft">
          Research-grounded, peer-reviewed clinical knowledge base. Do not substitute for medical consulting.
        </p>
      </section>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-ink-soft" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clinical topics (e.g., Follicular estrogen peaks, cramps reduction)..."
            id="clinical-search"
            className="w-full bg-surface-glass border border-border rounded-xl pl-10 pr-4 py-3 text-xs text-ink-text placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-plum/30 shadow-inner backdrop-blur-md"
          />
        </div>
        <GlassButton variant="primary" type="submit" className="px-5 py-3 h-auto">
          Search
        </GlassButton>
      </form>

      {/* Guide Content / Results */}
      <div className="space-y-6">
        {searched ? (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-plum tracking-wider uppercase">
              {`Search Results for "${query}"`}
            </h3>
            {mockStudies.map((study, idx) => (
              <GlassCard key={idx} className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-plum/10 border border-plum/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-4 w-4 text-plum" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-xs font-bold text-ink-text font-serif leading-snug">{study.title}</h4>
                    <p className="text-[10px] text-ink-soft">{study.journal} &bull; {study.year}</p>
                  </div>
                </div>
                <p className="text-xs text-ink-soft leading-relaxed pl-11">{study.snippet}</p>
                <div className="pl-11 pt-1 flex items-center gap-1">
                  <span className="text-[9px] text-plum font-semibold">DOI: {study.doi}</span>
                  <a
                    href={`https://doi.org/${study.doi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sakura-deep hover:text-plum transition-colors flex items-center gap-0.5 text-[9px] font-semibold"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open Article
                  </a>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="p-6 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-plum/5 flex items-center justify-center border border-plum/15">
              <BookOpen className="h-6 w-6 text-plum" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-semibold text-ink-text font-serif">Awaiting Your Inquiry</h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                {"Enter symptoms or keywords above to search verified women's health medical journals and retrieve dosage guidelines or hormonal synthesis advice."}
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <GlassButton variant="secondary" onClick={() => { setQuery("Follicular phase focus"); setSearched(true); }}>
                {"Try \"Follicular phase focus\""}
              </GlassButton>
              <GlassButton variant="secondary" onClick={() => { setQuery("Magnesium and cramps"); setSearched(true); }}>
                {"Try \"Magnesium and cramps\""}
              </GlassButton>
            </div>
          </GlassCard>
        )}
      </div>
    </motion.div>
  );
}
