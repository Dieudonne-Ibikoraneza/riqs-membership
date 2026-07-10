"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCw, Globe, Mail, Phone, Loader2 } from "lucide-react";
import { applicantServices } from "@/services/applicant.services";

type MemberData = {
  name: string;
  designations: string;
  membershipGrade: string;
  practiceGrade: string;
  practiceLicenceNo: string;
  status: string;
  issueDate: string;
  expiryDate: string;
  membershipNo: string;
  photoUrl?: string;
};

const defaults: MemberData = {
  name: `QS Member`,
  designations: "MRIQS, LPQS",
  membershipGrade: "Corporate Member (MRIQS)",
  practiceGrade: "Licensed Professional Quantity Surveyor (LPQS)",
  practiceLicenceNo: "LPQS/2026/0045",
  status: "ACTIVE",
  issueDate: "01 January 2026",
  expiryDate: "31 December 2026",
  membershipNo: "RIQS/M/00045",
};

const mark = "/riqs-logo.png";
const qr = "/qrcode.png";
const defaultPhoto = "/cert-photo.png"; // Fallback, doesn't really exist but we will handle loading state

const NAVY = "#0b3363";
const GOLD = "#f1a500";

export function MembershipCard({ profileData }: { profileData?: any }) {
  const [flipped, setFlipped] = useState(false);
  const [passportUrl, setPassportUrl] = useState<string | null>(null);
  const [passportLoading, setPassportLoading] = useState(true);

  // Map profileData to MemberData
  const m: MemberData = { ...defaults };
  if (profileData) {
    m.name = profileData?.profile?.fullName || defaults.name;
    m.membershipNo = profileData?.profile?.membershipId || "RIQS/M/00000";
    
    let rawClass = profileData?.profile?.membershipClass || profileData?.application?.category_name || "";
    let formattedClass = rawClass.replace(/_/g, " ");
    
    // Add Fellow suffix if applicable
    if (profileData?.profile?.isFellow) {
      formattedClass = formattedClass ? `${formattedClass}, Fellow` : "Fellow";
    }

    m.designations = formattedClass || defaults.designations;
    
    const rawGrade = profileData?.application?.category_name || profileData?.profile?.membershipClass || defaults.membershipGrade;
    m.membershipGrade = rawGrade.replace(/_/g, " ");
    m.practiceGrade = m.membershipGrade;
    m.practiceLicenceNo = `LPQS/${new Date().getFullYear()}/${profileData?.profile?.id?.slice(0, 4).toUpperCase() || "0001"}`;
    m.status = profileData?.application?.status === "Approved" ? "ACTIVE" : "PENDING";
    
    let validUntilDate: Date | null = null;
    if ((profileData?.profile as any)?.membershipExpiresAt) {
      validUntilDate = new Date((profileData?.profile as any).membershipExpiresAt);
    }

    let approvedDate: Date | null = null;
    if (profileData?.application?.approvedAt) {
      approvedDate = new Date(profileData.application.approvedAt);
    } else if (profileData?.application?.status === "Approved" && profileData?.application?.updatedAt) {
      approvedDate = new Date(profileData.application.updatedAt);
    }

    m.issueDate = approvedDate
      ? approvedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
      : (validUntilDate ? new Date(validUntilDate.getFullYear() - 1, 0, 1).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "");
    
    m.expiryDate = validUntilDate
      ? validUntilDate.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
      : "";
  }

  const isFirm = profileData?.application?.entityType === "Firm" || m.membershipGrade.includes("Firm");

  useEffect(() => {
    if (profileData?.profile?.profilePhotoUrl) {
      setPassportUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/files/downloadByUrl?url=${encodeURIComponent(profileData.profile.profilePhotoUrl)}&token=${typeof window !== 'undefined' ? localStorage.getItem('riqs.auth.token') : ''}`);
      setPassportLoading(false);
      return;
    }

    if (!profileData?.documents) {
      setPassportLoading(false);
      return;
    }

    const passportDoc = profileData.documents.find(
      (d: any) =>
        d.documentType === "PassportPhoto" ||
        d.documentType === "Passport_Photo" ||
        d.documentType === "photo" ||
        d.documentType === "PassportSize" ||
        d.documentType === "passport_size_photo"
    );

    let active = true;

    if (passportDoc) {
      setPassportLoading(true);
      applicantServices
        .downloadDocument(passportDoc.id)
        .then((blob) => {
          if (!active) return;
          setPassportUrl(URL.createObjectURL(blob));
          setPassportLoading(false);
        })
        .catch(() => {
          if (active) setPassportLoading(false);
        });
    } else {
      setPassportLoading(false);
    }

    return () => {
      active = false;
      if (passportUrl && passportUrl.startsWith("blob:")) {
        URL.revokeObjectURL(passportUrl);
      }
    };
  }, [profileData]);

  if (isFirm) {
    return null; // Don't show ID card for firms for now, they get Certificates.
  }

  m.photoUrl = passportUrl || undefined;

  return (
    <div className="space-y-3 mb-6">
      <div
        className="mx-auto w-full max-w-[640px] cursor-pointer select-none"
        style={{ aspectRatio: "1586 / 992", containerType: "inline-size", overflow: "visible", perspective: "1500px" }}
        onClick={() => setFlipped((f) => !f)}
        role="button"
        aria-label="Flip membership card"
      >
        <div className={`relative w-full h-full transition-transform duration-700`} style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
          <div className="absolute w-full h-full backface-hidden" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
            <CardFront m={m} isLoading={passportLoading} />
          </div>
          <div className="absolute w-full h-full backface-hidden" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <CardBack m={m} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Button size="sm" variant="outline" onClick={() => setFlipped((f) => !f)}>
          <RotateCw className="mr-1.5 h-3.5 w-3.5" />
          Flip card · {flipped ? "Back" : "Front"}
        </Button>
        <span>Tap the card to flip</span>
      </div>
    </div>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden bg-white"
      style={{
        borderRadius: "4.2cqw",
        boxShadow: "0 2.2cqw 3.8cqw -2.2cqw rgba(0,0,0,.38), inset 0 0 0 .28cqw rgba(10,29,55,.16)",
        fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
        color: NAVY,
      }}
    >
      {children}
    </div>
  );
}

function CardFront({ m, isLoading }: { m: MemberData, isLoading: boolean }) {
  const photoSrc = m.photoUrl;

  return (
    <CardShell>
      {/* Template geometry */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none"
        viewBox="0 0 1586 992"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="frontNavy" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#092a52" />
            <stop offset=".45" stopColor={NAVY} />
            <stop offset="1" stopColor="#042548" />
          </linearGradient>
          <pattern id="frontHatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <line x1="0" y1="0" x2="0" y2="12" stroke="#ffffff" strokeOpacity=".045" strokeWidth="3" />
          </pattern>
        </defs>

        <rect width="1586" height="992" fill="#fff" />
        <rect x="1195" y="0" width="391" height="350" fill="url(#frontHatch)" />

        {/* Left navy sweep and bottom band copied from the reference proportions */}
        <path
          d="M0 0 H184 C152 70 111 132 87 196 C49 297 97 379 177 455 C262 535 304 641 361 724 C402 783 457 797 560 797 H1586 V992 H0 Z"
          fill="url(#frontNavy)"
        />
        <path
          d="M188 0 C156 71 116 132 92 194 C55 294 101 378 181 453 C264 532 308 638 365 720 C404 774 460 785 560 785 H1586"
          fill="none"
          stroke={GOLD}
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* subtle diagonal texture on navy */}
        <path
          d="M0 0 H184 C152 70 111 132 87 196 C49 297 97 379 177 455 C262 535 304 641 361 724 C402 783 457 797 560 797 H1586 V992 H0 Z"
          fill="url(#frontHatch)"
        />
      </svg>

      {/* faint building watermark */}
      <svg
        className="absolute pointer-events-none"
        style={{ left: "46.5%", top: "21%", width: "42.5%", height: "57%", opacity: 0.065 }}
        viewBox="0 0 760 620"
        fill="none"
        stroke={NAVY}
        strokeWidth="1.6"
      >
        <path d="M80 575V255l105-95 105 95v320" />
        <path d="M110 286h150M110 340h150M110 394h150M110 448h150M110 502h150" />
        <path d="M330 575V185l118-112 118 112v390" />
        <path d="M363 225h170M363 282h170M363 339h170M363 396h170M363 453h170M363 510h170" />
        <path d="M600 575V280l80-75 80 75v295" />
        <path d="M0 575h760" />
      </svg>

      {/* Header mark and title */}
      <img
        src={mark}
        alt="RIQS mark"
        className="absolute object-contain"
        style={{ left: "10.9%", top: "6.2%", width: "13.6%", height: "18.8%" }}
      />
      <div className="absolute" style={{ left: "25.5%", top: "10%", lineHeight: .98, whiteSpace: "nowrap" }}>
        <div style={{ color: GOLD, fontWeight: 800, fontSize: "4.45cqw" }}>Rwanda Institute of</div>
        <div style={{ color: NAVY, fontWeight: 800, fontSize: "4.55cqw" }}>Quantity Surveyors</div>
      </div>

      {/* QR */}
      <div className="absolute flex flex-col items-center" style={{ right: "5.4%", top: "7.5%", width: "13.1%" }}>
        <div className="bg-white p-[0.55cqw]" style={{ border: `.35cqw solid ${NAVY}`, borderRadius: "1cqw" }}>
          <img src={qr} alt="QR" className="block w-full" />
        </div>
        <div style={{ color: NAVY, fontWeight: 800, fontSize: "1.18cqw", marginTop: ".72cqw", letterSpacing: ".03em" }}>
          SCAN TO VERIFY
        </div>
      </div>

      {/* Passport photo */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: "8.05%",
          top: "33.6%",
          width: "20.05%",
          height: "38.4%",
          border: `.42cqw solid ${GOLD}`,
          borderRadius: "2.05cqw",
          background: "#f2f2f2",
        }}
      >
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : photoSrc ? (
          <img src={photoSrc} alt={m.name} className="h-full w-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">No Photo</div>
        )}
      </div>

      {/* Name + fields */}
      <div className="absolute" style={{ left: "32%", top: "32.6%", right: "26%" }}>
        <div style={{ color: NAVY, fontWeight: 800, fontSize: "3.35cqw", lineHeight: 1.08, whiteSpace: "nowrap" }}>
          {m.name}
        </div>
        <div style={{ color: "#6b84a6", fontWeight: 500, fontSize: "1.92cqw", marginTop: ".35cqw" }}>
          {m.designations}
        </div>
        <div style={{ height: ".22cqw", background: GOLD, marginTop: "1.25cqw", width: "47%" }} />
      </div>
      <div className="absolute" style={{ left: "32%", top: "48.2%", right: "16.4%" }}>
        <Row label="MEMBERSHIP GRADE" value={m.membershipGrade} />
        <Row label="PRACTICE GRADE" value={m.practiceGrade} valueColor={GOLD} />
        <Row label="REGISTRATION NUMBER" value={m.membershipNo} />
        <Row label="REGISTRATION STATUS" value={m.status} valueColor="#16a34a" />
        <Row label="ISSUE DATE" value={m.issueDate} />
        <Row label="EXPIRY DATE" value={m.expiryDate} />
      </div>

      {/* Bottom strip */}
      <div
        className="absolute"
        style={{ left: "7%", bottom: "4.6%", color: "#fff", fontWeight: 500, fontSize: "1.9cqw", letterSpacing: ".11em" }}
      >
        PROFESSIONAL MEMBERSHIP CARD
      </div>
      <div className="absolute text-center" style={{ right: "5.7%", bottom: "4%", color: "#fff", width: "18%" }}>
        <div
          style={{
            fontFamily: "'Great Vibes', cursive",
            color: "#fff",
            fontSize: "4.15cqw",
            lineHeight: .7,
            marginBottom: ".3cqw",
            transform: "rotate(-8deg)",
          }}
        >
          C.Lugira
        </div>
        <div style={{ height: ".16cqw", background: "rgba(255,255,255,.75)", margin: "0 auto .45cqw", width: "75%" }} />
        <div style={{ fontSize: "1.55cqw", letterSpacing: ".05em", fontWeight: 500 }}>REGISTRAR</div>
      </div>
    </CardShell>
  );
}

function Row({
  label,
  value,
  valueColor = NAVY,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      className="grid items-baseline"
      style={{ gridTemplateColumns: "39% 4% 57%", marginBottom: ".72cqw" }}
    >
      <div style={{ color: NAVY, fontWeight: 700, fontSize: "1.38cqw", letterSpacing: "0" }}>
        {label}
      </div>
      <div style={{ color: NAVY, fontSize: "1.38cqw", fontWeight: 700 }}>:</div>
      <div style={{ color: valueColor, fontWeight: 800, fontSize: "1.38cqw", lineHeight: 1.05 }}>{value}</div>
    </div>
  );
}

function CardBack({ m }: { m: MemberData }) {
  return (
    <CardShell>
      {/* Back template geometry */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none"
        viewBox="0 0 1586 992"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="backNavy" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={NAVY} />
            <stop offset="1" stopColor="#04284f" />
          </linearGradient>
          <pattern id="backHatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <line x1="0" y1="0" x2="0" y2="12" stroke="#ffffff" strokeOpacity=".035" strokeWidth="3" />
          </pattern>
        </defs>
        <rect width="1586" height="992" fill="#fff" />
        {/* soft grey wave field */}
        {Array.from({ length: 12 }).map((_, i) => (
          <path
            key={i}
            d={`M-60 ${345 + i * 16} C250 ${265 + i * 10} 520 ${465 + i * 8} 820 ${385 + i * 10} C1110 ${310 + i * 8} 1260 ${350 + i * 12} 1660 ${235 + i * 12}`}
            fill="none"
            stroke={NAVY}
            strokeOpacity=".045"
            strokeWidth="1.5"
          />
        ))}
        {/* top-right navy panel */}
        <path d="M894 0 H1586 V190 H1041 C996 190 969 174 947 136 Z" fill="url(#backNavy)" />
        <path d="M1205 190 H1586 V220 H1228 C1212 220 1200 208 1196 192 Z" fill={GOLD} />
        {/* divider and lower band */}
        <path d="M138 688 H1438" stroke={GOLD} strokeWidth="3.5" />
        <path d="M0 775 H1586 V992 H0 Z" fill="url(#backNavy)" />
        <path d="M1065 775 H1586 V992 H1214 Z" fill={GOLD} />
        <path d="M1065 775 L1120 775 L1090 820 Z" fill="#7b6719" opacity=".78" />
        <path d="M0 775 H1586" stroke={NAVY} strokeWidth="1" />
        <rect y="775" width="1586" height="217" fill="url(#backHatch)" />
      </svg>

      {/* Header logo + title */}
      <div className="absolute flex items-center" style={{ left: "8.5%", top: "6%", gap: "2.4cqw" }}>
        <img src={mark} alt="RIQS mark" style={{ width: "14.9cqw", height: "14.2cqw", objectFit: "contain" }} />
        <div style={{ lineHeight: .98, marginTop: "1cqw", whiteSpace: "nowrap" }}>
          <div style={{ color: GOLD, fontWeight: 800, fontSize: "3.18cqw" }}>Rwanda Institute of</div>
          <div style={{ color: NAVY, fontWeight: 800, fontSize: "3.75cqw" }}>Quantity Surveyors</div>
        </div>
      </div>

      {/* Membership No box */}
      <div className="absolute" style={{ right: "6%", top: "6.5%", width: "32.5%" }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: "2.28cqw", letterSpacing: ".02em", marginBottom: "1cqw" }}>
          MEMBERSHIP NO.
        </div>
        <div
          className="bg-white text-center"
          style={{
            color: NAVY,
            fontWeight: 800,
            fontSize: "2.08cqw",
            padding: "1.1cqw 1cqw",
            borderRadius: ".7cqw",
          }}
        >
          {m.membershipNo}
        </div>
      </div>

      {/* T&Cs */}
      <div className="absolute" style={{ left: "9%", top: "34.2%", right: "8%" }}>
        <div style={{ color: NAVY, fontWeight: 800, fontSize: "2.7cqw", letterSpacing: "0", marginBottom: "1.8cqw" }}>
          TERMS &amp; CONDITIONS
        </div>
        <ul style={{ color: "#111827", fontSize: "1.85cqw", lineHeight: 1.65, fontWeight: 450 }}>
          {[
            "This card is the property of the Rwanda Institute of Quantity Surveyors (RIQS).",
            "This card is non-transferable and shall be used only by the registered member.",
            "The bearer of this card is entitled to all rights and privileges as a member of RIQS.",
            "This card must be presented upon request and is valid only with a current membership.",
            "If found, please return this card to the nearest RIQS office or contact us.",
          ].map((t, i) => (
            <li key={i} style={{ display: "flex", gap: "1.1cqw", alignItems: "flex-start" }}>
              <span style={{ color: NAVY, fontSize: "2.3cqw", lineHeight: 1.1 }}>•</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Values */}
      <div
        className="absolute flex justify-center gap-[2cqw]"
        style={{ left: 0, right: 0, top: "71%", color: NAVY, fontWeight: 800, fontSize: "2.35cqw" }}
      >
        <span>Excellence</span>
        <span style={{ color: GOLD }}>|</span>
        <span>Integrity</span>
        <span style={{ color: GOLD }}>|</span>
        <span>Professionalism</span>
      </div>

      {/* Bottom contacts */}
      <div
        className="absolute flex items-center gap-[2.5cqw]"
        style={{ left: "5.2%", bottom: "9.3%", color: "#fff", fontSize: "1.8cqw", fontWeight: 600 }}
      >
        <ContactItem icon={Globe} text="www.riqs.rw" />
        <Divider />
        <ContactItem icon={Mail} text="info@riqs.rw" />
        <Divider />
        <ContactItem icon={Phone} text="+250 788 123 456" />
      </div>

      {/* Bottom-right QR */}
      <div
        className="absolute flex items-center gap-[0.8cqw]"
        style={{ right: "5.6%", bottom: "4.2%" }}
      >
        <div style={{ color: NAVY, fontWeight: 800, fontSize: "1.62cqw", letterSpacing: "0", textAlign: "right", lineHeight: 1.08 }}>
          SCAN<br />TO VERIFY <span style={{ color: "#fff" }}>▶</span>
        </div>
        <div className="bg-white p-[0.3cqw]">
          <img src={qr} alt="QR" style={{ width: "9.2cqw", height: "9.2cqw", display: "block" }} />
        </div>
      </div>
    </CardShell>
  );
}

function Chip() {
  return (
    <div
      className="absolute overflow-hidden"
      style={{
        right: "6.7%",
        top: "38.2%",
        width: "12.6%",
        height: "10.9%",
        borderRadius: "1.55cqw",
        background: "linear-gradient(135deg,#fff7b5 0%,#e5b32c 30%,#b17b08 58%,#f7d965 100%)",
        border: "0.24cqw solid #6f550c",
        boxShadow: "inset 0 .25cqw .6cqw rgba(255,255,255,.65), inset 0 -.25cqw .5cqw rgba(0,0,0,.25)",
      }}
    >
      <svg viewBox="0 0 170 112" className="h-full w-full" preserveAspectRatio="none">
        <path d="M68 4 C72 20 79 27 93 30 H122 C129 30 135 37 135 45 V67 C135 75 129 82 121 82 H94 C80 85 73 93 68 108" fill="none" stroke="#62470a" strokeWidth="3" />
        <path d="M102 4 C98 20 91 27 77 30 H48 C41 30 35 37 35 45 V67 C35 75 41 82 49 82 H76 C90 85 97 93 102 108" fill="none" stroke="#62470a" strokeWidth="3" />
        <path d="M0 28 H42M0 56 H35M0 84 H42M128 28 H170M135 56 H170M128 84 H170" stroke="#62470a" strokeWidth="3" />
        <rect x="62" y="34" width="46" height="44" rx="7" fill="none" stroke="#62470a" strokeWidth="3" />
      </svg>
    </div>
  );
}

function RoundSeal() {
  return (
    <div className="absolute" style={{ right: "6.8%", top: "55%", width: "14.4%", aspectRatio: "1" }}>
      <svg viewBox="0 0 210 210" className="h-full w-full">
        <defs>
          <radialGradient id="sealGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff" />
            <stop offset=".55" stopColor="#e9f0ef" />
            <stop offset="1" stopColor="#cdd9c7" />
          </radialGradient>
        </defs>
        <circle cx="105" cy="105" r="100" fill="url(#sealGlow)" opacity=".6" />
        <circle cx="105" cy="105" r="91" fill="none" stroke="#e7ece5" strokeWidth="9" />
        <circle cx="105" cy="105" r="83" fill="none" stroke={NAVY} strokeWidth="5" />
        <path id="sealText" d="M32 106a73 73 0 1 1 146 0a73 73 0 1 1-146 0" fill="none" />
        <text fontSize="13" fontWeight="800" fill="rgba(11,51,99,.46)" letterSpacing="2">
          <textPath href="#sealText" startOffset="2%">RWANDA INSTITUTE OF QUANTITY SURVEYORS • </textPath>
        </text>
        <circle cx="105" cy="105" r="43" fill="#fff" opacity=".92" />
      </svg>
      <img src={mark} alt="RIQS seal" className="absolute left-1/2 top-1/2 w-[38%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-90" />
    </div>
  );
}

function ContactItem({ icon: Icon, text }: { icon: React.ComponentType<{ size?: number | string }>; text: string }) {
  return (
    <div className="flex items-center gap-[0.6cqw]">
      <div
        className="flex items-center justify-center"
        style={{
          width: "3.2cqw",
          height: "3.2cqw",
          borderRadius: "50%",
          background: GOLD,
          color: "#fff",
        }}
      >
        <Icon size="58%" />
      </div>
      <span>{text}</span>
    </div>
  );
}

function Divider() {
  return <span style={{ width: ".2cqw", height: "6.2cqw", background: GOLD, opacity: .95 }} />;
}