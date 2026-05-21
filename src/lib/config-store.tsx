"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Option = { id: string; name: string; description: string };
export type DocReq = { id: string; name: string; required: boolean };
export type CategoryDef = { id: string; name: string; description: string; documents: DocReq[] };
export type EmailTemplate = { id: string; name: string; subject: string; body: string; category: string; description: string; };

export interface AppConfig {
  practiceLocations: Option[];
  entityTypes: Option[];
  categories: CategoryDef[];
  emailTemplates: EmailTemplate[];
}

const DEFAULTS: AppConfig = {
  practiceLocations: [
    { id: "local", name: "Local Practitioner", description: "Practicing in Rwanda" },
    { id: "foreign", name: "Foreign Practitioner", description: "Based outside Rwanda" },
  ],
  entityTypes: [
    { id: "individual", name: "Individual", description: "Apply as a person" },
    { id: "firm", name: "Firm", description: "Apply as a registered firm or company" },
  ],
  categories: [
    { id: "student", name: "Student", description: "Currently enrolled in a QS programme",
      documents: [
        { id: "id", name: "National ID / Passport", required: true },
        { id: "photo", name: "Passport photo", required: true },
        { id: "enroll", name: "Proof of enrollment", required: true },
      ] },
    { id: "graduate", name: "Graduate", description: "Recent QS graduate, mentorship required",
      documents: [
        { id: "id", name: "National ID / Passport", required: true },
        { id: "photo", name: "Passport photo", required: true },
        { id: "degree", name: "Notarized degree / diploma", required: true },
        { id: "cv", name: "Curriculum Vitae", required: true },
      ] },
    { id: "technologist", name: "Technologist", description: "Technologist-level practitioner",
      documents: [
        { id: "id", name: "National ID / Passport", required: true },
        { id: "photo", name: "Passport photo", required: true },
        { id: "degree", name: "Notarized degree / diploma", required: true },
        { id: "cv", name: "Curriculum Vitae", required: true },
        { id: "logbook", name: "Mentorship logbook", required: true },
      ] },
    { id: "professional", name: "Professional", description: "Full professional QS",
      documents: [
        { id: "id", name: "National ID / Passport", required: true },
        { id: "photo", name: "Passport photo", required: true },
        { id: "degree", name: "Notarized degree / diploma", required: true },
        { id: "cv", name: "Curriculum Vitae", required: true },
        { id: "experience", name: "Experience certificates", required: true },
      ] },
    { id: "fellow", name: "Fellow", description: "Senior fellow membership",
      documents: [
        { id: "id", name: "National ID / Passport", required: true },
        { id: "photo", name: "Passport photo", required: true },
        { id: "cv", name: "Curriculum Vitae", required: true },
        { id: "rec", name: "Two recommendation letters", required: true },
      ] },
    { id: "firm", name: "Firm", description: "Registered consultancy firm",
      documents: [
        { id: "rdb", name: "RDB registration certificate", required: true },
        { id: "tax", name: "Tax clearance", required: true },
        { id: "staff", name: "List of qualified staff", required: true },
      ] },
  ],
  emailTemplates: [
    {
      id: "welcome",
      name: "Welcome to RIQS",
      category: "Onboarding",
      subject: "Welcome to the Rwanda Institute of Quantity Surveyors",
      description: "Sent to newly approved members after their application is accepted.",
      body: `<p class="mb-4">Dear <strong>{{name}}</strong>,</p>\n<p class="mb-4">On behalf of the Council and entire membership of the <strong>Rwanda Institute of Quantity Surveyors (RIQS)</strong>, we are delighted to officially welcome you as a registered member of the Institute.</p>\n<p class="mb-4">Your application has been <strong>reviewed and approved</strong>. You are now entitled to all privileges associated with your membership category, including:</p>\n<ul class="list-disc pl-5 mb-4 space-y-2">\n  <li>Access to your <strong>digital Annual Practicing License</strong> and verifiable certificate</li>\n  <li>Participation in <strong>Continuing Professional Development (CPD)</strong> events and workshops</li>\n  <li>Listing in the <strong>RIQS public members directory</strong></li>\n  <li>Eligibility to bid on <strong>government and private sector QS tenders</strong></li>\n  <li>Access to the <strong>mentorship programme</strong> for career advancement</li>\n</ul>\n<p class="mb-4">Please log in to the <strong>RIQS Members Portal</strong> to download your certificate, update your profile, and explore upcoming CPD opportunities.</p>\n<p class="mb-4">We look forward to your active participation in advancing the Quantity Surveying profession in Rwanda.</p>\n<p class="mb-4">Warm regards,<br/><strong>RIQS Secretariat</strong><br/>Rwanda Institute of Quantity Surveyors</p>`,
    },
    {
      id: "renewal",
      name: "Annual Renewal Reminder",
      category: "Billing",
      subject: "RIQS Annual Membership Renewal — Action Required",
      description: "Reminder sent to members whose annual license is approaching expiry.",
      body: `<p class="mb-4">Dear <strong>{{name}}</strong>,</p>\n<p class="mb-4">This is a friendly reminder that your <strong>RIQS Annual Practicing License</strong> is due for renewal. To maintain your active membership status and continue enjoying all member privileges, please complete the renewal process before the expiry date.</p>\n<p class="mb-4"><strong>Renewal Steps:</strong></p>\n<ol class="list-decimal pl-5 mb-4 space-y-2">\n  <li>Log in to the <strong>RIQS Members Portal</strong></li>\n  <li>Navigate to the <strong>Payments</strong> section</li>\n  <li>Complete the annual subscription payment via Mobile Money (Code: <strong>604516</strong>) or bank transfer</li>\n  <li>Upload your <strong>proof of payment</strong></li>\n</ol>\n<p class="mb-4"><strong>Important:</strong> Failure to renew before the deadline may result in temporary suspension of your practicing license, removal from the public directory, and inability to participate in CPD events.</p>\n<p class="mb-4">If you have already completed the renewal, please disregard this message. For any questions, contact our Secretariat at <strong>info@riqs.rw</strong>.</p>\n<p class="mb-4">Best regards,<br/><strong>RIQS Finance Department</strong><br/>Rwanda Institute of Quantity Surveyors</p>`,
    },
    {
      id: "cpd",
      name: "CPD Event Invitation",
      category: "Events",
      subject: "You're Invited: Upcoming RIQS CPD Professional Development Session",
      description: "Invitation to attend a scheduled CPD workshop or seminar.",
      body: `<p class="mb-4">Dear <strong>{{name}}</strong>,</p>\n<p class="mb-4">We are pleased to invite you to our upcoming <strong>Continuing Professional Development (CPD)</strong> session organized by the Rwanda Institute of Quantity Surveyors.</p>\n<p class="mb-4"><strong>Event Details:</strong></p>\n<ul class="list-disc pl-5 mb-4 space-y-2">\n  <li><strong>Topic:</strong> Modern Cost Estimation Techniques in East African Construction</li>\n  <li><strong>Date:</strong> Saturday, 15th June 2026</li>\n  <li><strong>Time:</strong> 09:00 AM — 01:00 PM (CAT)</li>\n  <li><strong>Venue:</strong> Kigali Convention Centre, Main Auditorium</li>\n  <li><strong>CPD Points:</strong> 4 points will be awarded upon completion</li>\n</ul>\n<p class="mb-4">This session will feature presentations by leading industry experts and will cover practical methodologies for improving project cost accuracy, risk assessment frameworks, and digital BIM integration in quantity surveying workflows.</p>\n<p class="mb-4"><strong>Registration is mandatory.</strong> Please confirm your attendance by replying to this email or through the Members Portal before <strong>10th June 2026</strong>.</p>\n<p class="mb-4">We look forward to seeing you there!</p>\n<p class="mb-4">Kind regards,<br/><strong>RIQS CPD Committee</strong><br/>Rwanda Institute of Quantity Surveyors</p>`,
    },
    {
      id: "mentorship-assign",
      name: "Mentorship Assignment",
      category: "Mentorship",
      subject: "RIQS Mentorship Programme — Mentor Assignment Confirmation",
      description: "Notification sent when a graduate is paired with a professional mentor.",
      body: `<p class="mb-4">Dear <strong>{{name}}</strong>,</p>\n<p class="mb-4">We are pleased to inform you that you have been successfully matched with a <strong>Professional Mentor</strong> under the RIQS Mentorship Programme.</p>\n<p class="mb-4"><strong>Your Assigned Mentor:</strong></p>\n<ul class="list-disc pl-5 mb-4 space-y-2">\n  <li><strong>Name:</strong> Eng. Patrick Nshuti, MRIQS</li>\n  <li><strong>Registration ID:</strong> RIQS-2020-P-015</li>\n  <li><strong>Specialization:</strong> Infrastructure & Civil Works Quantity Surveying</li>\n  <li><strong>Experience:</strong> 12 years in professional practice</li>\n</ul>\n<p class="mb-4">Your mentor will guide you through the practical experience requirements needed for advancement from Graduate to Technologist status. You are expected to:</p>\n<ol class="list-decimal pl-5 mb-4 space-y-2">\n  <li>Maintain a <strong>structured logbook</strong> of professional activities</li>\n  <li>Meet with your mentor at least <strong>once per month</strong></li>\n  <li>Complete a minimum of <strong>2 CPD activities</strong> per year</li>\n  <li>Submit quarterly <strong>progress reports</strong> through the Members Portal</li>\n</ol>\n<p class="mb-4">Your mentor has been notified and will reach out to schedule your first session. If you have any questions, please contact the RIQS Mentorship Coordinator.</p>\n<p class="mb-4">Best wishes,<br/><strong>RIQS Mentorship Committee</strong><br/>Rwanda Institute of Quantity Surveyors</p>`,
    },
    {
      id: "correction",
      name: "Application Correction Required",
      category: "Applications",
      subject: "RIQS Application — Corrections Required",
      description: "Sent when an application needs amendments or additional documents.",
      body: `<p class="mb-4">Dear <strong>{{name}}</strong>,</p>\n<p class="mb-4">Thank you for submitting your membership application to the Rwanda Institute of Quantity Surveyors. After careful review, our Assessment Committee has identified items that require your attention before we can proceed with the approval process.</p>\n<p class="mb-4"><strong>Required Corrections:</strong></p>\n<ul class="list-disc pl-5 mb-4 space-y-2">\n  <li>The uploaded <strong>degree certificate</strong> appears to be incomplete — please provide the full notarized copy including all pages</li>\n  <li>Your <strong>academic transcripts</strong> must clearly show the subjects studied and grades obtained</li>\n  <li>The <strong>passport photograph</strong> does not meet the required specifications (white background, formal attire)</li>\n</ul>\n<p class="mb-4">Please log in to the <strong>RIQS Members Portal</strong>, navigate to your application, and re-upload the corrected documents within <strong>14 business days</strong>. Failure to provide corrections within this period may result in automatic rejection of the application.</p>\n<p class="mb-4">If you believe these requirements have been met or need clarification, please reply to this email with supporting details.</p>\n<p class="mb-4">Regards,<br/><strong>RIQS Applications Review Board</strong><br/>Rwanda Institute of Quantity Surveyors</p>`,
    },
    {
      id: "suspension",
      name: "Membership Suspension Notice",
      category: "Compliance",
      subject: "RIQS Membership Suspension — Immediate Action Required",
      description: "Formal suspension notice for non-compliance or overdue payments.",
      body: `<p class="mb-4">Dear <strong>{{name}}</strong>,</p>\n<p class="mb-4">We regret to inform you that your RIQS membership has been <strong>temporarily suspended</strong> effective immediately due to the following reason(s):</p>\n<ul class="list-disc pl-5 mb-4 space-y-2">\n  <li>Outstanding annual subscription payment exceeding <strong>90 days</strong> past the renewal deadline</li>\n  <li>Non-completion of the mandatory minimum <strong>CPD requirements</strong> for the current licensing year</li>\n</ul>\n<p class="mb-4"><strong>Impact of Suspension:</strong></p>\n<ul class="list-disc pl-5 mb-4 space-y-2">\n  <li>Your <strong>Annual Practicing License</strong> is no longer valid for professional engagements</li>\n  <li>Your profile has been <strong>removed from the public members directory</strong></li>\n  <li>You are <strong>ineligible to participate</strong> in RIQS events, tenders, or mentorship activities</li>\n</ul>\n<p class="mb-4">To reinstate your membership, please settle all outstanding obligations and contact the RIQS Secretariat at <strong>info@riqs.rw</strong> within <strong>30 days</strong>. After this period, a formal reinstatement application and additional fees may be required.</p>\n<p class="mb-4">Sincerely,<br/><strong>RIQS Compliance Office</strong><br/>Rwanda Institute of Quantity Surveyors</p>`,
    },
    {
      id: "agm",
      name: "AGM Invitation",
      category: "Events",
      subject: "Invitation to the RIQS Annual General Meeting 2026",
      description: "Annual General Meeting notice with agenda and logistics.",
      body: `<p class="mb-4">Dear <strong>{{name}}</strong>,</p>\n<p class="mb-4">You are cordially invited to attend the <strong>RIQS Annual General Meeting (AGM) 2026</strong>.</p>\n<p class="mb-4"><strong>Meeting Details:</strong></p>\n<ul class="list-disc pl-5 mb-4 space-y-2">\n  <li><strong>Date:</strong> Friday, 28th November 2026</li>\n  <li><strong>Time:</strong> 02:00 PM — 05:00 PM (CAT)</li>\n  <li><strong>Venue:</strong> Radisson Blu Hotel &amp; Convention Centre, Kigali</li>\n  <li><strong>Dress Code:</strong> Business formal</li>\n</ul>\n<p class="mb-4"><strong>Agenda:</strong></p>\n<ol class="list-decimal pl-5 mb-4 space-y-2">\n  <li>Opening remarks by the RIQS Chairman</li>\n  <li>Review and adoption of the 2025 AGM minutes</li>\n  <li>Presentation of the <strong>Annual Financial Report</strong></li>\n  <li>Report on membership growth, CPD statistics, and mentorship outcomes</li>\n  <li>Election of new <strong>Council Members</strong> for the 2027–2029 term</li>\n  <li>Discussion on the proposed <strong>QS Professional Standards Bill</strong></li>\n  <li>Any Other Business (AOB)</li>\n</ol>\n<p class="mb-4">Your attendance and participation are highly valued. Please RSVP by <strong>20th November 2026</strong> via the Members Portal or by replying to this email.</p>\n<p class="mb-4">With kind regards,<br/><strong>RIQS Secretariat</strong><br/>Rwanda Institute of Quantity Surveyors</p>`,
    },
    {
      id: "promotion",
      name: "Category Promotion",
      category: "Membership",
      subject: "Congratulations — RIQS Membership Category Advancement",
      description: "Congratulatory notice when a member is promoted to a higher category.",
      body: `<p class="mb-4">Dear <strong>{{name}}</strong>,</p>\n<p class="mb-4">We are thrilled to inform you that following a thorough review of your professional portfolio, practical experience records, and CPD achievements, the RIQS Assessment Committee has approved your <strong>category advancement</strong>.</p>\n<p class="mb-4"><strong>Promotion Details:</strong></p>\n<ul class="list-disc pl-5 mb-4 space-y-2">\n  <li><strong>Previous Category:</strong> Graduate Member (GRIQS)</li>\n  <li><strong>New Category:</strong> Technologist Member (TRIQS)</li>\n  <li><strong>Effective Date:</strong> 1st January 2027</li>\n</ul>\n<p class="mb-4">This promotion recognizes your dedication to professional development and your significant contributions to the Quantity Surveying profession. As a Technologist Member, you now have access to:</p>\n<ul class="list-disc pl-5 mb-4 space-y-2">\n  <li>Enhanced <strong>practicing rights</strong> for independent project engagement</li>\n  <li>Eligibility to <strong>mentor Graduate members</strong></li>\n  <li>Priority registration for <strong>advanced CPD workshops</strong></li>\n  <li>Voting rights at the <strong>Annual General Meeting</strong></li>\n</ul>\n<p class="mb-4">Your updated certificate and practicing license will be available for download in the Members Portal within 5 business days.</p>\n<p class="mb-4">Congratulations once again!</p>\n<p class="mb-4">Warm regards,<br/><strong>RIQS Council</strong><br/>Rwanda Institute of Quantity Surveyors</p>`,
    }
  ],
};

const KEY = "riqs.config";
const Ctx = createContext<{ config: AppConfig; setConfig: (c: AppConfig) => void } | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<AppConfig>(DEFAULTS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Migration: force-overwrite emailTemplates to ensure the 8 descriptive ones are loaded
        if (!parsed.emailTemplatesVersion || parsed.emailTemplatesVersion < 2) {
          parsed.emailTemplates = DEFAULTS.emailTemplates;
          parsed.emailTemplatesVersion = 2;
          localStorage.setItem(KEY, JSON.stringify(parsed));
        }
        setConfigState({ ...DEFAULTS, ...parsed });
      }
    } catch {}
  }, []);
  const setConfig = (c: AppConfig) => {
    // Preserve the version flag when saving
    const toSave = { ...c, emailTemplatesVersion: 2 };
    setConfigState(c);
    localStorage.setItem(KEY, JSON.stringify(toSave));
  };
  return <Ctx.Provider value={{ config, setConfig }}>{children}</Ctx.Provider>;
}

export function useConfig() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useConfig outside provider");
  return v;
}
