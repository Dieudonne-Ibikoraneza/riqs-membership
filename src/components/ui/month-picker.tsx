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
  monthOnly?: boolean;
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
  monthOnly = false,
  placeholder = "Select Date",
  className,
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<"bottom" | "top">("bottom");
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"days" | "months" | "years">("days");

  // Parse current year/month/day from value or default to current date
  const parseValue = () => {
    if (!value || value.toLowerCase() === "present") {
      const d = new Date();
      return { year: d.getFullYear(), month: String(d.getMonth() + 1).padStart(2, "0"), day: String(d.getDate()).padStart(2, "0") };
    }
    const parts = value.split("-");
    return { year: parseInt(parts[0], 10), month: parts[1] || "01", day: parts[2] || "01" };
  };

  const { year: valYear, month: valMonth } = parseValue();
  const [activeYear, setActiveYear] = useState(valYear);
  const [activeMonth, setActiveMonth] = useState(valMonth);

  // Synchronize active year/month when value changes
  useEffect(() => {
    const { year, month } = parseValue();
    setActiveYear(year);
    setActiveMonth(month);
  }, [value]);

  // Reset view to 'days' when opening
  useEffect(() => {
    if (isOpen) {
      setView(monthOnly ? "months" : "days");
    }
  }, [isOpen]);

  // Measure space and decide popover position (above/below)
  useEffect(() => {
    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // The popover height is around 320px for the day grid
        if (spaceBelow < 320 && spaceAbove > spaceBelow) {
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
    const parts = value.split("-");
    if (parts.length >= 3) {
      const monthObj = MONTHS.find((mObj) => mObj.val === parts[1]);
      return monthObj ? `${parts[2]} ${monthObj.label} ${parts[0]}` : value;
    } else if (parts.length === 2) {
      const monthObj = MONTHS.find((mObj) => mObj.val === parts[1]);
      return monthObj ? `${monthObj.label} ${parts[0]}` : value;
    }
    return value;
  };

  const handleSelectMonth = (monthVal: string) => {
    setActiveMonth(monthVal);
    if (monthOnly) {
      onChange(`${activeYear}-${monthVal}`);
      setIsOpen(false);
      return;
    }
    setView("days");
  };

  const handleSelectDay = (day: number) => {
    const formattedDay = String(day).padStart(2, "0");
    onChange(`${activeYear}-${activeMonth}-${formattedDay}`);
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

  const handleToday = () => {
    const d = new Date();
    const curYear = d.getFullYear();
    const curMonth = String(d.getMonth() + 1).padStart(2, "0");
    if (monthOnly) {
      onChange(`${curYear}-${curMonth}`);
    } else {
      const curDay = String(d.getDate()).padStart(2, "0");
      onChange(`${curYear}-${curMonth}-${curDay}`);
    }
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    let m = parseInt(activeMonth, 10) - 1;
    let y = activeYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setActiveMonth(String(m).padStart(2, "0"));
    setActiveYear(y);
  };

  const handleNextMonth = () => {
    let m = parseInt(activeMonth, 10) + 1;
    let y = activeYear;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setActiveMonth(String(m).padStart(2, "0"));
    setActiveYear(y);
  };

  const daysInMonth = new Date(activeYear, parseInt(activeMonth, 10), 0).getDate();
  const firstDay = new Date(activeYear, parseInt(activeMonth, 10) - 1, 1).getDay();
  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
        <span className={cn("truncate font-medium font-sans", value?.toLowerCase() === "present" && "text-gold font-semibold")}>
          {getDisplayText() || placeholder}
        </span>
        <Calendar className="h-4.5 w-4.5 text-zinc-400 shrink-0 dark:text-zinc-500" />
      </button>

      {/* Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: position === "top" ? -8 : 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === "top" ? -8 : 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute left-0 z-50 w-[280px] rounded-none border border-input bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950",
              position === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
            )}
          >
            {view === "days" ? (
              <>
                {/* Header: Month/Year */}
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800/80">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="flex h-7 w-7 items-center justify-center rounded-none border border-input bg-transparent text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("months")}
                    className="text-sm font-bold text-navy dark:text-gold tracking-wide hover:underline cursor-pointer"
                  >
                    {MONTHS.find(m => m.val === activeMonth)?.label} {activeYear}
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="flex h-7 w-7 items-center justify-center rounded-none border border-input bg-transparent text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                {/* Days Grid */}
                <div className="pt-3">
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {DAYS.map(d => <div key={d} className="text-[10px] font-bold text-muted-foreground">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const formattedDay = String(day).padStart(2, "0");
                      const isSelected = value === `${activeYear}-${activeMonth}-${formattedDay}`;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleSelectDay(day)}
                          className={cn(
                            "h-7 w-7 flex items-center justify-center rounded-none text-xs font-medium cursor-pointer transition-colors mx-auto",
                            isSelected
                              ? "bg-navy text-white dark:bg-gold dark:text-[#1a1a1a] font-bold shadow-sm"
                              : "text-zinc-700 hover:bg-zinc-100 hover:text-navy dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-gold"
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : view === "months" ? (
              <>
                {/* Header: Year */}
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setActiveYear(y => y - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-none border border-input bg-transparent text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("years")}
                    className="text-sm font-bold text-navy dark:text-gold tracking-wide hover:underline cursor-pointer"
                  >
                    {activeYear}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveYear(y => y + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-none border border-input bg-transparent text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                {/* Months Grid */}
                <div className="grid grid-cols-4 gap-2 py-3.5">
                  {MONTHS.map((m) => {
                    const isSelected = activeMonth === m.val;
                    return (
                      <button
                        key={m.val}
                        type="button"
                        onClick={() => handleSelectMonth(m.val)}
                        className={cn(
                          "flex h-9 items-center justify-center rounded-none text-xs font-semibold transition-all duration-250 cursor-pointer",
                          isSelected
                            ? "bg-navy text-white shadow-md dark:bg-gold dark:text-[#1a1a1a]"
                            : "text-zinc-700 hover:bg-zinc-100 hover:text-navy dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-gold"
                        )}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800/80">
                  <span className="text-sm font-bold text-navy dark:text-gold tracking-wide">Select year</span>
                  <button
                    type="button"
                    onClick={() => setView("months")}
                    className="text-xs font-semibold text-muted-foreground hover:text-navy dark:hover:text-gold"
                  >
                    Back to months
                  </button>
                </div>
                <div className="grid max-h-56 grid-cols-3 gap-1.5 overflow-y-auto py-3 pr-1">
                  {Array.from({ length: 61 }, (_, index) => new Date().getFullYear() - 50 + index).map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => { setActiveYear(year); setView("months"); }}
                      className={cn(
                        "h-9 rounded-none text-xs font-semibold transition-colors cursor-pointer",
                        activeYear === year
                          ? "bg-navy text-white dark:bg-gold dark:text-[#1a1a1a]"
                          : "text-zinc-700 hover:bg-zinc-100 hover:text-navy dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-gold"
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-800/80 gap-1.5 mt-2">
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
                      value?.toLowerCase() === "present"
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-zinc-200 text-gold hover:bg-gold/5 dark:border-zinc-800"
                    )}
                  >
                    Present
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleToday}
                  className="text-xs font-bold text-navy hover:text-navy/85 dark:text-gold dark:hover:text-gold/85 py-1 px-2.5 rounded-none transition-colors cursor-pointer"
                >
                  {monthOnly ? "This Month" : "Today"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
