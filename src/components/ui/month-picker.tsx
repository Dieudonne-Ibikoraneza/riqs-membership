"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MonthYearPickerProps {
  id?: string;
  value: string; // "YYYY-MM" or "YYYY-MM-DD" or "present" or ""
  onChange: (val: string) => void;
  allowPresent?: boolean;
  monthOnly?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MONTHS = [
  { label: "Jan", full: "January", val: "01" },
  { label: "Feb", full: "February", val: "02" },
  { label: "Mar", full: "March", val: "03" },
  { label: "Apr", full: "April", val: "04" },
  { label: "May", full: "May", val: "05" },
  { label: "Jun", full: "June", val: "06" },
  { label: "Jul", full: "July", val: "07" },
  { label: "Aug", full: "August", val: "08" },
  { label: "Sep", full: "September", val: "09" },
  { label: "Oct", full: "October", val: "10" },
  { label: "Nov", full: "November", val: "11" },
  { label: "Dec", full: "December", val: "12" },
];

// Matches a month given as a number ("3", "03"), an abbreviation ("Mar"), or a full name
// ("March"/"Marc..."), case-insensitively. Returns the zero-padded "01".."12" value, or
// null if nothing recognizable was typed.
function matchMonth(token: string): string | null {
  const t = token.trim().toLowerCase();
  if (!t) return null;
  if (/^\d{1,2}$/.test(t)) {
    const n = parseInt(t, 10);
    return n >= 1 && n <= 12 ? String(n).padStart(2, "0") : null;
  }
  const byAbbr = MONTHS.find((m) => m.label.toLowerCase() === t);
  if (byAbbr) return byAbbr.val;
  const byFull = MONTHS.find((m) => m.full.toLowerCase() === t || m.full.toLowerCase().startsWith(t));
  return byFull ? byFull.val : null;
}

const POPOVER_WIDTH = 280;

// Finds the nearest ancestor that actually clips/scrolls its content (e.g. a Dialog with
// overflow-y-auto), so the popover's horizontal position can be checked against that
// boundary instead of the full viewport — a narrow field inside a centered dialog has
// plenty of *viewport* room to its right, but none inside the dialog itself.
function getScrollBoundary(node: HTMLElement | null): HTMLElement | null {
  let el = node?.parentElement || null;
  while (el && el !== document.body) {
    const style = getComputedStyle(el);
    if (/(auto|scroll|hidden)/.test(style.overflowX + style.overflowY)) return el;
    el = el.parentElement;
  }
  return null;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

// Parses free-typed text into this component's canonical value ("YYYY-MM" or "YYYY-MM-DD"),
// accepting the common ways someone would naturally type a date — numeric with either slash
// or dash separators in either order, or a month name/abbreviation with a year (and day, for
// full dates). Returns null when the text isn't recognized, so the caller can leave the
// field alone rather than committing garbage.
function parseTypedDate(raw: string, opts: { monthOnly: boolean; allowPresent: boolean }): string | null {
  const text = raw.trim();
  if (!text) return "";
  if (opts.allowPresent && /^present$/i.test(text)) return "present";

  if (opts.monthOnly) {
    let m = text.match(/^(\d{4})[-/](\d{1,2}|[A-Za-z]+)$/); // YYYY-MM or YYYY/Mon
    if (m) {
      const mon = matchMonth(m[2]);
      if (mon) return `${m[1]}-${mon}`;
    }
    m = text.match(/^(\d{1,2}|[A-Za-z]+)[-/](\d{4})$/); // MM-YYYY or Mon/YYYY
    if (m) {
      const mon = matchMonth(m[1]);
      if (mon) return `${m[2]}-${mon}`;
    }
    m = text.match(/^([A-Za-z]+)\.?\s+(\d{4})$/); // Mon YYYY / Month YYYY
    if (m) {
      const mon = matchMonth(m[1]);
      if (mon) return `${m[2]}-${mon}`;
    }
    return null;
  }

  let m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); // YYYY-MM-DD
  if (m) {
    const mon = matchMonth(m[2]);
    const day = parseInt(m[3], 10);
    if (mon && isValidCalendarDate(parseInt(m[1], 10), parseInt(mon, 10), day)) {
      return `${m[1]}-${mon}-${String(day).padStart(2, "0")}`;
    }
    return null;
  }
  m = text.match(/^(\d{1,2})[-/](\d{1,2}|[A-Za-z]+)[-/](\d{4})$/); // DD/MM/YYYY or DD-Mon-YYYY
  if (m) {
    const day = parseInt(m[1], 10);
    const mon = matchMonth(m[2]);
    if (mon && isValidCalendarDate(parseInt(m[3], 10), parseInt(mon, 10), day)) {
      return `${m[3]}-${mon}-${String(day).padStart(2, "0")}`;
    }
    return null;
  }
  m = text.match(/^(\d{1,2})\s+([A-Za-z]+)\.?,?\s+(\d{4})$/); // DD Mon YYYY
  if (m) {
    const day = parseInt(m[1], 10);
    const mon = matchMonth(m[2]);
    if (mon && isValidCalendarDate(parseInt(m[3], 10), parseInt(mon, 10), day)) {
      return `${m[3]}-${mon}-${String(day).padStart(2, "0")}`;
    }
    return null;
  }
  m = text.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/); // Mon DD, YYYY
  if (m) {
    const mon = matchMonth(m[1]);
    const day = parseInt(m[2], 10);
    if (mon && isValidCalendarDate(parseInt(m[3], 10), parseInt(mon, 10), day)) {
      return `${m[3]}-${mon}-${String(day).padStart(2, "0")}`;
    }
    return null;
  }
  return null;
}

export function MonthYearPicker({
  id,
  value,
  onChange,
  allowPresent = false,
  monthOnly = false,
  placeholder = "Select Date",
  className,
  disabled = false,
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<"bottom" | "top">("bottom");
  const [offsetX, setOffsetX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

        // Clamp horizontally against the nearest clipping/scrolling ancestor (a Dialog,
        // typically) rather than the viewport — a narrow field inside a centered dialog can
        // have plenty of viewport room to its right while having none inside the dialog,
        // which is exactly what let the popover spill past the dialog's edge and trigger a
        // stray horizontal scrollbar there. Computed as a precise pixel offset (rather than
        // just flipping to a flush right-0) with a small margin, since the field's own edge
        // can itself sit a couple of px from the true boundary due to ordinary layout
        // rounding — flush-aligning to it would just reintroduce the same overflow.
        const boundary = getScrollBoundary(containerRef.current);
        const boundaryRect = boundary
          ? boundary.getBoundingClientRect()
          : { left: 0, right: window.innerWidth };
        const margin = 8;
        let offset = 0;
        const overflowRight = rect.left + POPOVER_WIDTH - (boundaryRect.right - margin);
        if (overflowRight > 0) offset = -overflowRight;
        const resultingLeft = rect.left + offset;
        if (resultingLeft < boundaryRect.left + margin) offset = boundaryRect.left + margin - rect.left;
        setOffsetX(offset);
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

  // The text field's own draft state — kept separate from `value` so a keystroke doesn't
  // have to be a valid, complete date to stay on screen while the person is still typing it.
  const [inputText, setInputText] = useState(getDisplayText());
  const [isTyping, setIsTyping] = useState(false);

  // Keep the field's displayed text in sync with the real value, but only while the person
  // isn't actively editing it — otherwise an external update (e.g. picking a day from the
  // calendar) would be expected to overwrite it, but the person's own keystrokes shouldn't be.
  useEffect(() => {
    if (!isTyping) setInputText(getDisplayText());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isTyping]);

  const commitTypedText = () => {
    setIsTyping(false);
    const parsed = parseTypedDate(inputText, { monthOnly, allowPresent });
    if (parsed === null) {
      // Not a date we recognize — revert to the last valid value instead of silently
      // accepting (or worse, saving) something unparseable.
      setInputText(getDisplayText());
      return;
    }
    if (parsed !== value) onChange(parsed);
    else setInputText(getDisplayText());
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
    <div ref={containerRef} className={cn("relative w-full min-w-0", className)}>
      {/* Editable text field — type a date directly — plus a button that opens the same
          calendar popover as before, for anyone who'd rather pick than type. */}
      <div
        className={cn(
          "flex h-10 w-full min-w-0 items-center rounded-none border border-input bg-white transition-all focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30 dark:bg-zinc-950 dark:border-zinc-800",
          disabled && "cursor-not-allowed opacity-50 bg-zinc-50 dark:bg-zinc-900",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={inputText}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setIsTyping(true)}
          onChange={(e) => setInputText(e.target.value)}
          onBlur={commitTypedText}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              inputRef.current?.blur();
            } else if (e.key === "Escape") {
              setInputText(getDisplayText());
              setIsTyping(false);
              inputRef.current?.blur();
            }
          }}
          className={cn(
            "h-full min-w-0 flex-1 border-none bg-transparent px-3 py-2 text-sm font-medium font-sans text-left placeholder:text-muted-foreground placeholder:font-normal focus-visible:outline-none disabled:cursor-not-allowed",
            value?.toLowerCase() === "present" && "text-gold font-semibold"
          )}
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen((o) => !o)}
          disabled={disabled}
          aria-label="Open calendar"
          className="flex h-full shrink-0 items-center px-3 text-zinc-400 transition-colors hover:text-navy disabled:cursor-not-allowed disabled:hover:text-zinc-400 dark:text-zinc-500 dark:hover:text-gold dark:disabled:hover:text-zinc-500"
        >
          <Calendar className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: position === "top" ? -8 : 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === "top" ? -8 : 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ left: offsetX }}
            className={cn(
              "absolute z-50 w-[280px] rounded-none border border-input bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950",
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
