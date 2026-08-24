"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Download, 
  Printer, 
  Loader2, 
  Lock, 
  Clock, 
  AlertCircle, 
  ArrowRight 
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/services/queryKeys";
import { applicantServices } from "@/services/applicant.services";
import Link from "next/link";

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

function Seal({ year, isLifetime, isVisiting }: { year: number, isLifetime?: boolean, isVisiting?: boolean }) {
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
      <text x="100" y="58" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="800" fontFamily="var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif" letterSpacing="0.5">RIQS&apos;</text>
      <text x="100" y="75" textAnchor="middle" fill={GOLD} fontSize="9.5" fontWeight="700" fontFamily="var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif">Certified</text>
      {isLifetime ? (
        <>
          <text x="100" y="94" textAnchor="middle" fill={GOLD} fontSize="8.5" fontWeight="600" fontFamily="var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif">registered Lifetime</text>
          <text x="100" y="108" textAnchor="middle" fill={GOLD} fontSize="8.5" fontWeight="600" fontFamily="var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif">Member</text>
          <text x="100" y="142" textAnchor="middle" fill={GOLD} fontSize="28" fontWeight="800" fontFamily="var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif" letterSpacing="0.5">∞</text>
        </>
      ) : isVisiting ? (
        <>
          <text x="100" y="94" textAnchor="middle" fill={GOLD} fontSize="8.5" fontWeight="600" fontFamily="var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif">registered Visiting</text>
          <text x="100" y="108" textAnchor="middle" fill={GOLD} fontSize="8.5" fontWeight="600" fontFamily="var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif">Member</text>
          <text x="100" y="142" textAnchor="middle" fill={GOLD} fontSize="28" fontWeight="800" fontFamily="var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif" letterSpacing="0.5">✓</text>
        </>
      ) : (
        <>
          <text x="100" y="90" textAnchor="middle" fill={GOLD} fontSize="8.5" fontWeight="600" fontFamily="var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif">registered Professional</text>
          <text x="100" y="104" textAnchor="middle" fill={GOLD} fontSize="8.5" fontWeight="600" fontFamily="var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif">QS for the year</text>
          <text x="100" y="142" textAnchor="middle" fill={GOLD} fontSize="28" fontWeight="800" fontFamily="var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif" letterSpacing="0.5">{year}</text>
        </>
      )}
    </svg>
  );
}

function RegSeal({ regNo }: { regNo: string }) {
  const points = 32;
  const innerR = 80;
  const outerR = 88;
  const scallopedPath = getScallopedPath(points, innerR, outerR, 130, 100);

  return (
    <svg viewBox="0 0 260 200" className="h-full w-full">
      {/* Outer Scalloped Navy Base */}
      <path d={scallopedPath} fill={NAVY} />

      {/* Inner White Circular Area */}
      <circle cx="130" cy="100" r="76" fill="#ffffff" />

      {/* Thin Navy Inner Border */}
      <circle cx="130" cy="100" r="70" fill="none" stroke={NAVY} strokeWidth="1.5" />

      {/* Registry Title Label */}
      <text x="130" y="62" textAnchor="middle" fill={NAVY} fontSize="20" fontWeight="900" fontFamily="var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif">Reg No :</text>

      {/* Rounded Pill-Shaped Box - spans wider to overlap border naturally */}
      <rect x="6" y="78" width="248" height="50" rx="16" ry="16" fill="#ffffff" stroke={NAVY} strokeWidth="4" />

      {/* Verifiable Registry ID */}
      <text x="130" y="110" textAnchor="middle" fill={NAVY} fontSize="14" fontWeight="900" fontFamily="var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif" letterSpacing="0.2">{regNo}</text>
    </svg>
  );
}

function CertificateContent() {
  const certRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [passportUrl, setPassportUrl] = useState<string | null>(null);
  const [passportLoading, setPassportLoading] = useState(true);
  const [scale, setScale] = useState(1);

  // Fetch applicant profile
  const { data: profileData, isLoading } = useQuery({
    queryKey: queryKeys.applicant.profile(),
    queryFn: applicantServices.getProfile,
  });

  const membershipClass = (profileData?.profile as any)?.membershipClass || "";
  const isAdminCreatedMember = membershipClass.includes("Visiting") || membershipClass.includes("Honorary") || membershipClass.includes("Life");

  const appStatus = profileData?.application?.status || (isAdminCreatedMember ? "Approved" : "None");
  const isApproved = appStatus === "Approved";

  // Credentials are issued only after the first-year membership fee is cleared.
  const firstYearFeeTx = profileData?.financialTransactions?.find(
    (tx: any) => tx.txType === "First_Year_Fee"
  );
  const hasMembershipId = Boolean((profileData?.profile as any)?.membershipId);
  // Preserve access for legacy/admin-created members that have no application fee transaction.
  const isFirstYearFeeCleared = isAdminCreatedMember || (firstYearFeeTx ? firstYearFeeTx.status === "Paid" : hasMembershipId);
  const isFullyActive = isApproved && hasMembershipId && isFirstYearFeeCleared;

  // Lazy-load passport photo if approved
  useEffect(() => {
    if (isLoading) return;

    if (!isFullyActive) {
      setPassportLoading(false);
      return;
    }

    if ((profileData?.profile as any)?.profilePhotoUrl) {
      setPassportUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/files/downloadByUrl?url=${encodeURIComponent((profileData?.profile as any)?.profilePhotoUrl || '')}&token=${typeof window !== 'undefined' ? localStorage.getItem('riqs.auth.token') : ''}`);
      setPassportLoading(false);
      return;
    }

    if (!profileData?.documents) {
      setPassportLoading(false);
      return;
    }

    let active = true;

    let passportDoc = profileData.documents.find((d: any) =>
      d.documentType === "PassportPhoto" ||
      d.documentType === "Passport_Photo" ||
      d.documentType === "photo" ||
      d.documentType === "PassportSize" ||
      d.documentType === "passport_size_photo"
    );
    // Do NOT fall back to id/passport copy documents – only a genuine photo upload is shown

    if (passportDoc) {
      setPassportLoading(true);
      applicantServices.downloadDocument(passportDoc.id)
        .then(blob => {
          if (!active) return;
          const url = URL.createObjectURL(blob);
          setPassportUrl(url);
          setPassportLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch passport photo:", err);
          if (active) {
            setPassportLoading(false);
          }
        });
    } else {
      setPassportLoading(false);
    }

    return () => {
      active = false;
    };
  }, [profileData, isFullyActive, isLoading]);

  // Dynamic scale calculation based on parent container width
  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone || !isFullyActive) return;

    function updateCertScale() {
      if (!zone) return;
      const containerWidth = zone.clientWidth;
      if (containerWidth === 0) return;

      const certWidth = 1200;
      const newScale = containerWidth < certWidth ? containerWidth / certWidth : 1;
      setScale(newScale);
    }

    updateCertScale();

    const ro = new ResizeObserver(updateCertScale);
    ro.observe(zone);

    return () => {
      ro.disconnect();
    };
  }, [isFullyActive, isLoading, passportLoading]);

  const handleDownloadPDF = useCallback(async () => {
    if (!certRef.current || !profileData?.profile?.fullName) return;
    setDownloading(true);

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 1200,
        height: 848,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById("certificate-card");
          if (el) {
            el.style.transform = "none";
            el.style.position = "relative";
            el.style.top = "0";
            el.style.left = "0";
          }
        },
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgData = canvas.toDataURL("image/png", 1.0);
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save(`RIQS_Practicing_License_${profileData.profile.fullName.replace(/\s+/g, "_")}_2026.pdf`);

      toast.success("License PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [profileData]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // 1. Loading State Screen (waits for both profileData and passport image download if approved)
  if (isLoading || (isFullyActive && passportLoading)) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="text-sm text-muted-foreground font-sans">Loading progression details...</p>
      </div>
    );
  }

  // 2. UNREADY / PENDING APP SCREEN
  if (!isFullyActive) {
    let badgeText = "Under Board Review";
    let descText = "Your application has been locked and submitted to the RIQS Governing Board. Our reviewers are verifying your credentials and logbooks. We appreciate your patience during this process.";
    let showButton = false;
    let buttonLabel = "Go to Application";
    let buttonHref = "/dashboard/application";

    if (appStatus === "Draft") {
      badgeText = "Draft Registration";
      descText = "Your membership application is currently in Draft. Please head to the Application section to fill in your personal details, education, employment, and submit it for Board review.";
      showButton = true;
    } else if (appStatus === "Correction_Required") {
      badgeText = "Correction Required";
      descText = "The review board has flagged items in your application that require correction. Please review the reviewer comments and update your application details immediately.";
      showButton = true;
    } else if (appStatus === "Rejected") {
      badgeText = "Application Rejected";
      descText = "Regrettably, your professional membership application was not approved by the Governing Council. Please consult the registrar or check your email for official reviewer notes.";
    } else if (appStatus === "None") {
      badgeText = "No Application Found";
      descText = "You have not started your professional membership application yet. To get licensed, you must submit an application packet.";
      showButton = true;
    } else if (appStatus === "Approved" && !isFirstYearFeeCleared) {
      badgeText = "First-Year Fee Required";
      descText = "Your application has been approved, but your membership credentials have not been issued yet. Please pay and submit proof of payment for the first-year membership fee, then wait for verification before accessing your certificate.";
      showButton = true;
      buttonLabel = "Go to Payments";
      buttonHref = "/dashboard/payments";
    }

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-navy">Annual Practicing License</h1>
          <p className="text-sm text-muted-foreground font-sans font-normal mt-1">Your official, digitally signed RIQS practicing license certificate.</p>
        </div>

        <Card className="border-dashed border-2 bg-zinc-50/20 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center max-w-lg mx-auto gap-4">
            <div className="h-14 w-14 rounded-full bg-gold/10 flex items-center justify-center text-gold relative shadow-gold/5">
              <Lock className="h-6 w-6" />
              <Clock className="h-4.5 w-4.5 text-navy absolute right-[-2px] bottom-[-2px] bg-white dark:bg-zinc-950 p-0.5 rounded-full border border-gold" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <AlertCircle className="h-3.5 w-3.5 text-gold" /> {badgeText}
              </div>
              <h2 className="text-xl font-bold text-navy dark:text-zinc-150 font-sans pt-1">Practicing License Not Issued Yet</h2>
              <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                {descText}
              </p>
            </div>

            {showButton && (
              <Link href={buttonHref} className="mt-2">
                <Button className="bg-gold text-[#1a1a1a] hover:bg-gold/90 font-bold gap-1.5 shadow-gold border-none">
                  {buttonLabel} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. LICENSED CERTIFICATE VIEW (AppStatus === Approved)
  const fullName = profileData?.profile?.fullName || "Member Name";
  const regNo = profileData?.profile?.membershipId || `RIQS/2026/PrQs/${profileData?.profile?.id?.slice(0, 4).toUpperCase() || "0001"}`;
  const categoryName = profileData?.application?.category_name || (profileData?.profile?.membershipClass || "Professional Quantity Surveyor").replace(/_/g, " ");

  // Use actual expiration date from the backend profile
  let validUntilDate: Date;
  let paymentYear: number;
  
  if ((profileData?.profile as any)?.membershipExpiresAt) {
    validUntilDate = new Date((profileData?.profile as any).membershipExpiresAt);
    paymentYear = validUntilDate.getUTCFullYear();
  } else {
    // Fallback for legacy records or before admin sets expiry
    const paymentDate = profileData?.application?.approvedAt
      ? new Date(profileData.application.approvedAt)
      : new Date();
    validUntilDate = new Date(paymentDate);
    validUntilDate.setUTCFullYear(validUntilDate.getUTCFullYear() + 1);
    paymentYear = validUntilDate.getUTCFullYear();
  }
  const formattedValidUntil = validUntilDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });

  let certTitle = "Annual Practicing License";
  if (membershipClass.includes("Visiting")) certTitle = "Temporary Practicing License";
  else if (membershipClass.includes("Honorary")) certTitle = "Honorary Membership Certificate";
  else if (membershipClass.includes("Life")) certTitle = "Life Membership Certificate";
  
  const isLifetime = membershipClass.includes("Life") || membershipClass.includes("Honorary");
  const isVisiting = membershipClass.includes("Visiting");

  const honorsList: string[] = [];
  if ((profileData?.profile as any)?.isFellow || membershipClass === "Fellow") {
    honorsList.push("Fellow");
  }
  if ((profileData?.profile as any)?.isHonorary) {
    if (!honorsList.includes("Honorary Member")) honorsList.push("Honorary Member");
  }
  const extraHonors = (profileData?.profile as any)?.honors || [];
  extraHonors.forEach((h: string) => {
    if (!honorsList.includes(h)) honorsList.push(h);
  });

  return (
    <div className="space-y-6">
      {/* Print styles: isolate the certificate card only with explicit webfont loading and scaling */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Great+Vibes&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

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

          /* Position the certificate to fill the printed page perfectly with scale */
          #certificate-card {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 1200px !important;
            height: 848px !important;
            transform: scale(calc(100vw / 1200)) !important;
            transform-origin: top left !important;
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
          <h1 className="text-2xl font-bold text-navy dark:text-zinc-150">{certTitle}</h1>
          <p className="text-sm text-muted-foreground font-sans">Your official, digitally signed RIQS practicing license certificate.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <Printer className="mr-2 h-4 w-4" />Print
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none font-bold"
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

      <Card className="overflow-hidden p-4 md:p-8 bg-zinc-50/50 dark:bg-zinc-950/10 border border-zinc-150 dark:border-zinc-850 no-print-card shadow-sm">
        <div ref={zoneRef} id="certificate-print-zone" className="w-full flex justify-center overflow-hidden">
          {/* 
            CSS-based scaling: use a container that constrains width to 100%,
            and scale the fixed-size certificate card using CSS.
          */}
          <div
            style={{
              width: "100%",
              maxWidth: "1200px",
              aspectRatio: "1200 / 848",
              position: "relative",
              overflow: "hidden",
            }}
            className="no-print-wrapper"
          >
            <div
              ref={certRef}
              id="certificate-card"
              className="bg-white border border-zinc-200 rounded-sm"
              style={{
                width: "1200px",
                height: "848px",
                fontFamily: "var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif",
                backgroundImage: `url(${certBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            >
              {/* Passport Photo top-left (symmetric to Seal, border matching layout) */}
              {passportUrl && (
                <div className="absolute left-[5.5%] top-[12%] h-[18%] w-[12.5%] z-10 border-2 border-[#0b3363]/40 bg-zinc-50 p-1.5 rounded-sm overflow-hidden shadow-sm flex items-center justify-center">
                  <img src={passportUrl} className="w-full h-full object-cover" alt="Passport Photo" />
                </div>
              )}

              {/* Seal top-right (inside frame, away from ribbon decoration) */}
              <div className="absolute right-[5.5%] top-[12%] h-[21%] w-[12.5%] z-10">
                <Seal year={paymentYear} isLifetime={isLifetime} isVisiting={isVisiting} />
              </div>

              {/* Main content - perfectly static container coordinates with pb-[7%] to avoid bottom border overlap */}
              <div className="relative flex h-full flex-col items-center px-[15%] pt-[3%] pb-[7%] text-center" style={{ color: NAVY }}>
                <img src={logo} alt="RIQS logo" className="h-[10.5%] w-auto object-contain" />

                <div
                  className="mt-[0.5%] text-[54px] leading-none font-normal"
                  style={{ fontFamily: "var(--font-great-vibes), 'Great Vibes', cursive", color: NAVY }}
                >
                  {certTitle}
                </div>

                <div 
                  className="mt-[0.5%] text-[24px] font-medium italic"
                  style={{ fontFamily: "var(--font-cormorant-garamond), 'Cormorant Garamond', serif" }}
                >
                  This is to certify that
                </div>

                <div 
                  className="mt-[1%] text-[42px] font-bold italic" 
                  style={{ fontFamily: "var(--font-cormorant-garamond), 'Cormorant Garamond', serif", color: NAVY }}
                >
                  {fullName}
                </div>

                {isAdminCreatedMember ? (
                  <p className="mt-[0.8%] max-w-[96%] text-[17px] italic leading-[1.45]">
                    Has been duly admitted as a <strong className="not-italic font-bold">{categoryName}</strong> of the Rwanda Institute of Quantity Surveyors with Registration
                    No: <strong className="not-italic font-bold">{regNo}</strong> pursuant to the Law No: <strong className="not-italic font-bold">023/2025 of 01/09/2025</strong> Governing the profession of Quantity Surveying in Rwanda.
                  </p>
                ) : (
                  <p className="mt-[0.8%] max-w-[96%] text-[17px] italic leading-[1.45]">
                    Is a registered and licensed <strong className="not-italic font-bold">{categoryName}</strong> in the year {paymentYear} with practicing License
                    No: <strong className="not-italic font-bold">{regNo}</strong> pursuant to the Law No: <strong className="not-italic font-bold">023/2025 of 01/09/2025</strong> Governing the profession of Quantity Surveying in Rwanda.
                  </p>
                )}

                <p className="mt-[0.3%] max-w-[90%] text-[17px] italic leading-[1.45]">
                  In witness where of the common seal has been here to affixed at a meeting of the Governing Council held to admit this member.
                </p>

                {isLifetime ? (
                  <p className="mt-[0.3%] text-[19px] font-bold italic">
                    This certificate is valid for Life.
                  </p>
                ) : isVisiting ? null : (
                  <p className="mt-[0.3%] text-[19px] font-bold italic">
                    This certificate is valid until {formattedValidUntil}.
                  </p>
                )}


                <div className="mt-auto h-[12.5%] w-[18%]">
                  <RegSeal regNo={regNo} />
                </div>

                {/* Spacing above the signature lines matches professional layouts and prevents overlaps */}
                <div className="mt-[1%] grid w-full grid-cols-3 items-end gap-6 px-[2%] text-[15px]" style={{ fontFamily: "var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif" }}>
                  <div className="flex flex-col items-center justify-end">
                    <div className="w-[85%] border-t border-[#0b3363] pt-2 flex flex-col items-center">
                      <div className="font-bold not-italic">QS. David Louis Mugabe</div>
                      <div 
                        className="italic text-[15px]"
                        style={{ fontFamily: "var(--font-cormorant-garamond), 'Cormorant Garamond', serif" }}
                      >
                        Registrar
                      </div>
                    </div>
                  </div>
                  
                  <div />
                  
                  <div className="flex flex-col items-center relative">
                    {/* QR Code placed at the top of the Chairman signature area with high padding bottom for better spacing */}
                    <img src="/qrcode.png" alt="Verification QR Code" className="h-[90px] w-[90px] object-contain mb-6" />
                    <div className="w-[85%] border-t border-[#0b3363] pt-2 flex flex-col items-center">
                      <div className="font-bold not-italic">QS. Charles Lugira</div>
                      <div 
                        className="italic text-[15px]"
                        style={{ fontFamily: "var(--font-cormorant-garamond), 'Cormorant Garamond', serif" }}
                      >
                        Chairman
                      </div>
                    </div>
                  </div>
                </div>

                {/* Honorable Mentions - perfectly spaced below signatures */}
                {honorsList.length > 0 && (
                  <div className="mt-[2.5%] flex flex-col items-center gap-1.5 w-full border-t border-[#0b3363]/20 pt-[1.5%] pb-[1%]">
                    <p
                      className="text-[11px] italic text-navy/60"
                      style={{ fontFamily: "var(--font-cormorant-garamond), 'Cormorant Garamond', serif" }}
                    >
                      In recognition of distinguished service, this member has been awarded:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {honorsList.map((honor, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-0.5 border border-gold/70 text-gold/90 rounded-full text-[10px] font-semibold"
                          style={{
                            fontFamily: "var(--font-plus-jakarta-sans), sans-serif",
                            backgroundColor: "rgba(241, 165, 0, 0.06)",
                            letterSpacing: "0.4px"
                          }}
                        >
                          {honor.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
