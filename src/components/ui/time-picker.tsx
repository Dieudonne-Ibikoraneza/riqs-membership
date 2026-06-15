"use client";

import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TimePickerProps {
  id?: string;
  value: string; // "HH:MM" (24-hour format like "09:00" or "14:30")
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function ScrollColumn({ 
  options, 
  value, 
  onChange 
}: { 
  options: string[], 
  value: string, 
  onChange: (val: string) => void 
}) {
  const currentIndex = options.indexOf(value) >= 0 ? options.indexOf(value) : 0;
  const lastScrollTime = useRef(0);
  
  const getIndex = (offset: number) => {
    return (currentIndex + offset + options.length) % options.length;
  };

  const indices = [
    getIndex(-2),
    getIndex(-1),
    currentIndex,
    getIndex(1),
    getIndex(2)
  ];

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    
    // Throttle scroll events to prevent hypersensitivity on trackpads
    const now = Date.now();
    if (now - lastScrollTime.current < 120) return;
    
    // Ignore tiny sub-pixel scrolls
    if (Math.abs(e.deltaY) < 5) return;

    if (e.deltaY > 0) {
      onChange(options[getIndex(1)]);
      lastScrollTime.current = now;
    } else if (e.deltaY < 0) {
      onChange(options[getIndex(-1)]);
      lastScrollTime.current = now;
    }
  };

  return (
    <div className="flex flex-col items-center select-none w-16 relative z-10" onWheel={handleWheel}>
      {indices.map((idx, i) => {
        const isCurrent = i === 2;
        const isAdjacent = i === 1 || i === 3;
        return (
          <div
            key={`${i}-${idx}`}
            className={cn(
              "h-10 w-full flex items-center justify-center cursor-pointer transition-all duration-200 font-sans",
              isCurrent ? "text-3xl font-bold text-navy dark:text-gold" : 
              isAdjacent ? "text-xl font-medium text-zinc-400 opacity-60 hover:text-navy dark:hover:text-gold" : 
              "text-base font-medium text-zinc-300 opacity-30 hover:text-navy dark:hover:text-gold dark:text-zinc-600"
            )}
            onClick={() => onChange(options[idx])}
          >
            {options[idx]}
          </div>
        );
      })}
    </div>
  );
}

export function TimePicker({
  id,
  value,
  onChange,
  placeholder = "Select time",
  className,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<"bottom" | "top">("bottom");
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial 24h value
  const parseValue = () => {
    if (!value) return { h: "09", m: "00" };
    try {
      const [h24, m] = value.split(":");
      return { 
        h: h24.padStart(2, "0"), 
        m: m.padStart(2, "0")
      };
    } catch {
      return { h: "09", m: "00" };
    }
  };

  const [localTime, setLocalTime] = useState(parseValue());

  useEffect(() => {
    if (isOpen) {
      setLocalTime(parseValue());
    }
  }, [isOpen, value]);

  useEffect(() => {
    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < 280 && spaceAbove > spaceBelow) {
          setPosition("top");
        } else {
          setPosition("bottom");
        }
      }
    };
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, { passive: true });
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getDisplayText = () => {
    if (!value) return "";
    const parsed = parseValue();
    return `${parsed.h}:${parsed.m}`;
  };

  const handleApply = () => {
    const formatted24 = `${localTime.h}:${localTime.m}`;
    onChange(formatted24);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm text-left transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950 dark:border-zinc-800",
          !value && "text-muted-foreground",
          isOpen && "border-gold ring-2 ring-gold/30"
        )}
      >
        <span className="truncate font-medium font-sans">
          {getDisplayText() || placeholder}
        </span>
        <Clock className="h-4.5 w-4.5 text-zinc-400 shrink-0 dark:text-zinc-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: position === "top" ? -8 : 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === "top" ? -8 : 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute left-0 z-50 w-[240px] rounded-xl border border-zinc-200 bg-white/95 backdrop-blur-md shadow-2xl dark:border-zinc-800 dark:bg-zinc-950/95 overflow-hidden",
              position === "top" ? "bottom-full mb-2" : "top-full mt-2"
            )}
          >
            <div className="relative py-4 px-6 flex justify-center items-center gap-2">
              {/* Unified Highlight Lens */}
              <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-12 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-xl pointer-events-none" />
              
              <ScrollColumn 
                options={HOURS} 
                value={localTime.h} 
                onChange={(h) => setLocalTime(prev => ({ ...prev, h }))} 
              />
              
              <div className="h-10 flex items-center justify-center z-10 px-1">
                <span className="text-3xl font-bold text-navy/50 dark:text-gold/50 pb-1">:</span>
              </div>
              
              <ScrollColumn 
                options={MINUTES} 
                value={localTime.m} 
                onChange={(m) => setLocalTime(prev => ({ ...prev, m }))} 
              />
            </div>
            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
              <button
                type="button"
                onClick={handleApply}
                className="w-full h-10 rounded-lg text-sm font-bold bg-navy text-white hover:bg-navy/90 dark:bg-gold dark:text-[#1a1a1a] dark:hover:bg-gold/90 transition-all shadow-sm active:scale-[0.98]"
              >
                Confirm Time
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
