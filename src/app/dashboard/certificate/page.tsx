"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ME_APPLICATION } from "@/lib/mock-data";

const logo = "/riqs-logo.png";
const certBg = "/certificate-bg.png";

const NAVY = "#0b3363";
const GOLD = "#f1a500";

// Helper function to calculate a mathematically perfect, smooth scalloped circle path
function getScallopedPath(points: number, innerR: number, outerR: number, cx = 100, cy = 100) {
  let pathData = "";
  for (let i = 0; i < points; i++) {
    const angle1 = (i * 360) / points;
    const angle2 = ((i + 0.5) * 360) / points;
    const angle3 = ((i + 1) * 360) / points;
    
    const rad1 = (angle1 * Math.PI) / 180;
    const rad2 = (angle2 * Math.PI) / 180;
    const rad3 = (angle3 * Math.PI) / 180;
    
    const x1 = cx + Math.cos(rad1) * innerR;
    const y1 = cy + Math.sin(rad1) * innerR;
    const x2 = cx + Math.cos(rad2) * outerR;
    const y2 = cy + Math.sin(rad2) * outerR;
    const x3 = cx + Math.cos(rad3) * innerR;
    const y3 = cy + Math.sin(rad3) * innerR;
    
    if (i === 0) {
      pathData += `M ${x1.toFixed(3)} ${y1.toFixed(3)}`;
    }
    pathData += ` Q ${x2.toFixed(3)} ${y2.toFixed(3)} ${x3.toFixed(3)} ${y3.toFixed(3)}`;
  }
  pathData += " Z";
  return pathData;
}

function Seal() {
  const points = 28;
  const innerR = 80;
  const outerR = 88;
  const scallopedPath = getScallopedPath(points, innerR, outerR);

  return (
    <svg viewBox="0 0 200 240" className="h-full w-full">
      {/* Background Ribbons - Rendered first so they sit behind the seal */}
      <g>
        {/* Left Ribbon */}
        <polygon 
          points="55,145 32,230 75,208 95,160" 
          fill={NAVY} 
          stroke={GOLD} 
          strokeWidth="2.5" 
          strokeLinejoin="round" 
        />
        {/* Right Ribbon */}
        <polygon 
          points="145,145 168,230 125,208 105,160" 
          fill={NAVY} 
          stroke={GOLD} 
          strokeWidth="2.5" 
          strokeLinejoin="round" 
        />
      </g>

      {/* Main Scalloped Circular Body */}
      <path 
        d={scallopedPath} 
        fill={NAVY} 
        stroke={GOLD} 
        strokeWidth="3" 
        strokeLinejoin="round" 
      />

      {/* Gold Inner Concentric Rings */}
      <circle cx="100" cy="100" r="72" fill="none" stroke={GOLD} strokeWidth="2.5" />
      <circle cx="100" cy="100" r="65" fill="none" stroke={GOLD} strokeWidth="1" />

      {/* Inner Central Dark Blue Area */}
      <circle cx="100" cy="100" r="64" fill="#082649" />

      {/* Ribbon Seal Text Elements matching official layout */}
      <text x="100" y="58" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="800" fontFamily="var(--font-plus-jakarta-sans), sans-serif" letterSpacing="0.5">RIQS&apos;</text>
      <text x="100" y="75" textAnchor="middle" fill={GOLD} fontSize="9.5" fontWeight="700" fontFamily="var(--font-plus-jakarta-sans), sans-serif">Certified</text>
      <text x="100" y="90" textAnchor="middle" fill={GOLD} fontSize="8.5" fontWeight="600" fontFamily="var(--font-plus-jakarta-sans), sans-serif">registered Professional</text>
      <text x="100" y="104" textAnchor="middle" fill={GOLD} fontSize="8.5" fontWeight="600" fontFamily="var(--font-plus-jakarta-sans), sans-serif">QS for the year</text>
      <text x="100" y="142" textAnchor="middle" fill={GOLD} fontSize="28" fontWeight="800" fontFamily="var(--font-plus-jakarta-sans), sans-serif" letterSpacing="0.5">2026</text>
    </svg>
  );
}

function RegSeal() {
  const points = 32;
  const innerR = 80;
  const outerR = 88;
  const scallopedPath = getScallopedPath(points, innerR, outerR);

  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      {/* Outer Scalloped Navy Base */}
      <path d={scallopedPath} fill={NAVY} />

      {/* Inner White Circular Area */}
      <circle cx="100" cy="100" r="76" fill="#ffffff" />

      {/* Thin Navy Inner Border */}
      <circle cx="100" cy="100" r="70" fill="none" stroke={NAVY} strokeWidth="1.5" />

      {/* Registry Title Label */}
      <text x="100" y="66" textAnchor="middle" fill={NAVY} fontSize="15" fontWeight="800" fontFamily="var(--font-plus-jakarta-sans), sans-serif">Reg No :</text>

      {/* Rounded Pill-Shaped Box - spans wider to overlap border naturally */}
      <rect x="15" y="80" width="170" height="40" rx="12" ry="12" fill="#ffffff" stroke={NAVY} strokeWidth="3" />

      {/* Verifiable Registry ID */}
      <text x="100" y="106" textAnchor="middle" fill={NAVY} fontSize="14" fontWeight="800" fontFamily="var(--font-plus-jakarta-sans), sans-serif" letterSpacing="0.2">RIQS/2015/PrQs/0001</text>
    </svg>
  );
}

function CertificateContent() {
  const me = ME_APPLICATION;
  const certRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // CSS custom property-based scaling — avoids React re-renders that cause flickering
  useEffect(() => {
    const zone = zoneRef.current;
    const card = certRef.current;
    if (!zone || !card) return;

    function updateCertScale() {
      if (!zone || !card) return;
      const containerWidth = zone.clientWidth;
      const certWidth = 1000;
      const scale = containerWidth < certWidth ? containerWidth / certWidth : 1;
      card.style.setProperty("--cert-scale", scale.toString());
      card.style.marginBottom = `${(scale - 1) * 707}px`;
    }

    updateCertScale();

    const ro = new ResizeObserver(updateCertScale);
    ro.observe(zone);

    return () => {
      ro.disconnect();
    };
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    if (!certRef.current) return;
    setDownloading(true);

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      // Render the certificate at full resolution (1000x707)
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 1000,
        height: 707,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById("certificate-card");
          if (el) {
            el.style.transform = "none";
            el.style.marginBottom = "0";
          }
        },
      });

      // A4 landscape PDF
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgData = canvas.toDataURL("image/png", 1.0);
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save(`RIQS_Certificate_${me.applicantName.replace(/\s+/g, "_")}_2026.pdf`);

      toast.success("Certificate PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [me.applicantName]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="space-y-6">
      {/* Print styles: isolate the certificate card only */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }

          /* Hide everything by default */
          body * {
            visibility: hidden;
          }

          /* Show only the certificate card and its contents */
          #certificate-card,
          #certificate-card * {
            visibility: visible;
          }

          /* Position the certificate to fill the printed page */
          #certificate-card {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            transform: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            z-index: 99999 !important;
            background-size: cover !important;
            background-position: center !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
        }
      `}} />

      <div className="flex flex-wrap items-end justify-between gap-3 no-print">
        <div>
          <h1 className="text-2xl font-bold text-navy">Annual Practicing License</h1>
          <p className="text-sm text-muted-foreground">Your official, digitally signed RIQS certificate.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />Print
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold"
          >
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {downloading ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-4 md:p-8 bg-zinc-50/50 dark:bg-zinc-950/10 border border-zinc-100 dark:border-zinc-800 no-print-card">
        <div ref={zoneRef} id="certificate-print-zone" className="w-full flex justify-center overflow-hidden">
          {/* 
            CSS-based scaling: use a container that constrains width to 100%,
            and scale the fixed-size certificate card using CSS.
            This avoids React state-driven re-renders that cause flickering.
          */}
          <div
            className="w-full"
            style={{
              maxWidth: "1000px",
            }}
          >
            <div
              ref={certRef}
              id="certificate-card"
              className="relative bg-white border border-zinc-200 rounded-sm origin-top-left"
              style={{
                width: "1000px",
                height: "707px",
                fontFamily: "var(--font-plus-jakarta-sans), sans-serif",
                backgroundImage: `url(${certBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                /* CSS-based scaling: scale to fit container width, no JS needed */
                transform: "scale(var(--cert-scale, 1))",
                transformOrigin: "top left",
                marginBottom: "calc((var(--cert-scale, 1) - 1) * 707px)",
              }}
            >
              {/* Seal top-right (inside frame, away from ribbon decoration) */}
              <div className="absolute right-[8%] top-[12%] h-[24%] w-[14%] z-10">
                <Seal />
              </div>

              {/* Main content - perfectly static container coordinates */}
              <div className="relative flex h-full flex-col items-center px-[12%] pt-[5%] pb-[6%] text-center" style={{ color: NAVY }}>
                <img src={logo} alt="RIQS logo" className="h-[14%] w-auto object-contain" />

                <div
                  className="mt-[1.5%] text-[38px] leading-none"
                  style={{ fontFamily: "var(--font-great-vibes), cursive", color: NAVY }}
                >
                  Annual Practicing License
                </div>

                <div 
                  className="mt-[1.5%] text-[17px] font-medium italic"
                  style={{ fontFamily: "var(--font-cormorant-garamond), serif" }}
                >
                  This is to certify that
                </div>

                <div 
                  className="mt-[2.5%] text-[32px] font-bold italic" 
                  style={{ fontFamily: "var(--font-cormorant-garamond), serif", color: NAVY }}
                >
                  QS. {me.applicantName}
                </div>

                <p className="mt-[2%] max-w-[80%] text-[14.5px] italic leading-[1.6]">
                  Is a registered and licensed <strong className="not-italic font-bold">Professional Quantity Surveyor</strong> in the year 2026 with practicing License
                  No: <strong className="not-italic font-bold">RIQS/2015/PrQs/0001</strong> pursuant to the Law No: <strong className="not-italic font-bold">023/2025 of 01/09/2025</strong> Governing the profession of Quantity Surveying in Rwanda.
                </p>

                <p className="mt-[1.5%] max-w-[82%] text-[14.5px] italic leading-[1.6]">
                  In witness where of the common seal has been here to affixed at a meeting of the Governing Council held to admit this member.
                </p>

                <p className="mt-[1.5%] text-[16px] font-bold italic">
                  This certificate is valid until 31<sup>st</sup> December 2026.
                </p>

                <div className="mt-auto h-[16%] w-[12%]">
                  <RegSeal />
                </div>

                <div className="mt-[2%] grid w-full grid-cols-3 items-end gap-6 px-[2%] text-[13px]" style={{ fontFamily: "var(--font-plus-jakarta-sans), sans-serif" }}>
                  <div className="flex flex-col items-center">
                    <div className="h-px w-[85%]" style={{ background: NAVY }} />
                    <div className="mt-1 font-bold not-italic">QS. David Louis Mugabe</div>
                    <div 
                      className="italic text-[13px]"
                      style={{ fontFamily: "var(--font-cormorant-garamond), serif" }}
                    >
                      Registrar
                    </div>
                  </div>
                  <div />
                  <div className="flex flex-col items-center">
                    <div className="h-px w-[85%]" style={{ background: NAVY }} />
                    <div className="mt-1 font-bold not-italic">QS. Charles Lugira</div>
                    <div 
                      className="italic text-[13px]"
                      style={{ fontFamily: "var(--font-cormorant-garamond), serif" }}
                    >
                      Chairman
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>


    </div>
  );
}

import dynamic from "next/dynamic";

const Certificate = dynamic(() => Promise.resolve(CertificateContent), {
  ssr: false,
});

export default Certificate;
