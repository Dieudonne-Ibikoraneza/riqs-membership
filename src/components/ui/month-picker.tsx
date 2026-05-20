"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MonthYearPickerProps {
  id?: string;
  value: string; // "YYYY-MM" or "present" or ""
  onChange: (val: string) => void;
  allowPresent?: boolean;
  placeholder?: string;
  className?: string;
}

const MONTHS = [
  { label: "Jan", val: "01" },
  { label: "Feb", val: "02" },
  { label: "Mar", val: "03" },
  { label: "Apr", val: "04" },
  { label: "May", val: "05" },
  { label: "Jun", val: "06" },
  { label: "Jul", val: "07" },
  { label: "Aug", val: "08" },
  { label: "Sep", val: "09" },
  { label: "Oct", val: "10" },
  { label: "Nov", val: "11" },
  { label: "Dec", val: "12" },
];

export function MonthYearPicker({
  id,
  value,
  onChange,
  allowPresent = false,
  placeholder = "Select Month/Year",
  className,
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current year/month from value or default to current date
  const parseValue = () => {
    if (!value || value.toLowerCase() === "present") {
      const d = new Date();
      return { year: d.getFullYear(), month: String(d.getMonth() + 1).padStart(2, "0") };
    }
    const [y, m] = value.split("-");
    return { year: parseInt(y, 10), month: m };
  };

  const { year: valYear, month: valMonth } = parseValue();
  const [activeYear, setActiveYear] = useState(valYear);

  // Synchronize active year when value changes
  useEffect(() => {
    const { year } = parseValue();
    setActiveYear(year);
  }, [value]);

  // Click away listener to close popover
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

  // Format value for display
  const getDisplayText = () => {
    if (!value) return "";
    if (value.toLowerCase() === "present") return "Present";
    const [y, m] = value.split("-");
    const monthObj = MONTHS.find((mObj) => mObj.val === m);
    return monthObj ? `${monthObj.label} ${y}` : `${m}/${y}`;
  };

  const handleSelectMonth = (monthVal: string) => {
    const formattedMonth = String(monthVal).padStart(2, "0");
    onChange(`${activeYear}-${formattedMonth}`);
    setIsOpen(false);
  };

  const handleSelectPresent = () => {
    onChange("present");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const handleThisMonth = () => {
    const d = new Date();
    const curYear = d.getFullYear();
    const curMonth = String(d.getMonth() + 1).padStart(2, "0");
    onChange(`${curYear}-${curMonth}`);
    setIsOpen(false);
  };

  const isCurrentSelection = (monthVal: string) => {
    if (!value || value.toLowerCase() === "present") return false;
    const [y, m] = value.split("-");
    return parseInt(y, 10) === activeYear && m === monthVal;
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Input Field Button */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-none border border-input bg-white px-3 py-2 text-sm text-left transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950 dark:border-zinc-800",
          !value && "text-muted-foreground"
        )}
      >
        <span className={cn("truncate font-medium font-sans", value.toLowerCase() === "present" && "text-gold font-semibold")}>
          {getDisplayText() || placeholder}
        </span>
        <Calendar className="h-4.5 w-4.5 text-zinc-400 shrink-0 dark:text-zinc-500" />
      </button>

      {/* Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 z-50 mt-1.5 w-[280px] rounded-none border border-input bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
          >
            {/* Header: Year Selector */}
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={() => setActiveYear((y) => y - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-none border border-input bg-transparent text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-bold text-navy dark:text-gold tracking-wide">
                {activeYear}
              </span>
              <button
                type="button"
                onClick={() => setActiveYear((y) => y + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-none border border-input bg-transparent text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Grid of Months */}
            <div className="grid grid-cols-4 gap-2 py-3.5">
              {MONTHS.map((m) => {
                const active = isCurrentSelection(m.val);
                return (
                  <button
                    key={m.val}
                    type="button"
                    onClick={() => handleSelectMonth(m.val)}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-none text-xs font-semibold transition-all duration-250 cursor-pointer",
                      active
                        ? "bg-navy text-white shadow-md dark:bg-gold dark:text-[#1a1a1a]"
                        : "text-zinc-700 hover:bg-zinc-100 hover:text-navy dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-gold"
                    )}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-800/80 gap-1.5">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition-colors py-1 px-2 rounded-none hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                Clear
              </button>
              <div className="flex gap-1.5">
                {allowPresent && (
                  <button
                    type="button"
                    onClick={handleSelectPresent}
                    className={cn(
                      "text-xs font-bold py-1 px-2.5 rounded-none border transition-colors cursor-pointer",
                      value.toLowerCase() === "present"
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-zinc-200 text-gold hover:bg-gold/5 dark:border-zinc-800"
                    )}
                  >
                    Present
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleThisMonth}
                  className="text-xs font-bold text-navy hover:text-navy/85 dark:text-gold dark:hover:text-gold/85 py-1 px-2.5 rounded-none transition-colors cursor-pointer"
                >
                  This month
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
