"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Joyride, STATUS, type EventData, type Step } from "react-joyride";
import { applicantServices, type ApplicantProfileResponse } from "@/services/applicant.services";
import { queryKeys } from "@/services/queryKeys";
import { navTourId } from "@/lib/utils";
import type { Role } from "@/lib/auth";

interface NavLink {
  href: string;
  label: string;
  disabled?: boolean;
  exact?: boolean;
}

type ShellKind = "member" | "admin" | "teacher";

const OVERVIEW_PATH: Record<ShellKind, string> = {
  member: "/dashboard",
  admin: "/admin",
  teacher: "/teacher",
};

// One-line description per sidebar destination, reused across every role that can see it —
// an Admin and an Admin_Assistant both land on the same "/admin/members" description, for
// instance. Anything not listed here (a link this map hasn't caught up with yet) falls back
// to a generic "This is where you can manage {label}." built from the link itself, so a new
// nav item never breaks the tour, it just gets a plainer description until someone writes
// one.
const NAV_DESCRIPTIONS: Record<string, string> = {
  "/dashboard/profile": "Keep your personal, contact, and address details up to date here.",
  "/dashboard/application": "Review your submitted application and its details anytime.",
  "/dashboard/certificate": "Download your membership certificate or practicing license from here.",
  "/dashboard/payments": "Pay your processing fee and annual membership dues from here.",
  "/dashboard/mentorship":
    "This is where you'll track your mentorship and upload the reports and logbooks required for your membership upgrade.",
  "/dashboard/mentees": "Review logbooks and supervise the Graduate members assigned to you as their mentor.",
  "/dashboard/documents": "Track the documents attached to your application here.",
  "/dashboard/support": "Need help? Reach the Secretariat directly from here.",
  "/teacher": "Register students and manage the applications you submit on their behalf.",

  "/admin/applications": "Review and process new membership applications submitted by prospective members.",
  "/admin/mentorship": "Oversee Graduate members' mentorship progress and review period recommendations.",
  "/admin/apc": "Schedule and manage Assessment of Professional Competency (APC) boards.",
  "/admin/profile-requests": "Approve or reject member-submitted profile update requests.",
  "/admin/mentor-applications": "Review requests from members applying to become mentors.",
  "/admin/payments": "Track and verify member payments, invoices, and financial transactions.",
  "/admin/members": "Search, manage, and take action on the full members register.",
  "/admin/email": "Send announcements or targeted emails to members.",
  "/admin/staff": "Manage internal staff accounts and their roles.",
  "/admin/settings": "Configure system-wide settings for the platform.",
  "/admin/templates": "Edit the email templates sent automatically by the system.",
  "/admin/reports": "View analytics and generate reports on membership activity.",
  "/admin/export": "Export membership data for external use.",
  "/admin/audit": "Review a full log of administrative actions taken across the system.",
  "/admin/support": "Respond to member support tickets and inquiries.",
};

const ROLE_LABELS: Record<string, string> = {
  Admin: "System Administrator",
  Admin_Assistant: "Admin Assistant",
  Reviewer: "Reviewer",
  Head_Reviewer: "Head Reviewer",
  Approver: "Approver",
  Teacher: "Teacher",
};

function getAudienceLabel(kind: ShellKind, role: Role): string {
  if (kind === "teacher") return "Teacher";
  if (kind === "admin") return (role && ROLE_LABELS[role]) || "Staff";
  return "Member";
}

function buildSteps(kind: ShellKind, role: Role, links: NavLink[]): Step[] {
  const overviewPath = OVERVIEW_PATH[kind];
  const audience = getAudienceLabel(kind, role);
  const article = /^[AEIOU]/.test(audience) ? "an" : "a";

  const steps: Step[] = [
    {
      target: "body",
      placement: "center",
      title: "Welcome to your RIQS Dashboard",
      content: `Since this is your first time here, here's a quick look at what matters most right now as ${article} ${audience}. You can skip this anytime.`,
    },
    {
      target: '[data-tour-id="tour-status-card"]',
      title: "Your Overview",
      content: "This banner shows your current status and the headline numbers for what needs your attention.",
    },
    {
      target: '[data-tour-id="tour-stats-grid"]',
      title: "Your Progress at a Glance",
      content:
        kind === "teacher"
          ? "Your registered students show up here, along with their application status."
          : "These tiles summarize the key numbers for your account at a glance.",
    },
  ];

  const supportLink = links.find((l) => l.href.endsWith("/support"));

  for (const link of links) {
    if (link.href === overviewPath) continue; // already covered by the two steps above
    const id = navTourId(link.href, link.disabled);
    if (!id) continue;
    steps.push({
      target: `[data-tour-id="${id}"]`,
      placement: "right",
      title: link.label,
      content: NAV_DESCRIPTIONS[link.href] || `This is where you can manage ${link.label.toLowerCase()}.`,
    });
  }

  steps.push({
    target: "body",
    placement: "center",
    title: "You're all set!",
    content: supportLink
      ? `That's the full tour — you're ready to go. If you ever need help, ${supportLink.label} in the sidebar is the fastest way to reach us.`
      : "That's the full tour — you're ready to go.",
  });

  return steps;
}

// Shows a first-run guided tour to any signed-in dashboard user — a member, an admin/staff
// account, or a teacher — the first time they land on their own overview page: a walk
// through their status banner, key numbers, and every item in their sidebar (tailored to
// their actual role, since the sidebar itself already is). Marks itself done on the backend
// (Member.hasSeenOnboarding, shared by every account type) so it never runs again.
export default function DashboardOnboardingTour({
  kind,
  pathname,
  links,
  role,
  profileData,
  onActiveChange,
}: {
  kind: ShellKind;
  pathname: string;
  links: NavLink[];
  role: Role;
  profileData?: ApplicantProfileResponse;
  /** Called with true while the tour is running, false once it ends — lets the caller force
   *  the mobile sidebar drawer open so the nav-item steps have something to point at on
   *  small screens, where the sidebar is otherwise a closed off-canvas drawer. */
  onActiveChange?: (active: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [run, setRun] = useState(false);

  const isOverviewPage = pathname === OVERVIEW_PATH[kind];
  const hasSeenOnboarding = !!(profileData?.profile as any)?.hasSeenOnboarding;
  const steps = useMemo(() => buildSteps(kind, role, links), [kind, role, links]);

  useEffect(() => {
    if (!profileData || !isOverviewPage || hasSeenOnboarding) return;
    // Give the page a beat to render its data-tour-id targets before Joyride measures them.
    const timer = setTimeout(() => {
      onActiveChange?.(true);
      setRun(true);
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData, isOverviewPage, hasSeenOnboarding]);

  // `<body>` has its own (normally unused) vertical scroll capability, separate from
  // `<main>`'s internal scroll — the page's actual scrollable region. Joyride's overlay and
  // tooltip are portaled onto `<body>`, outside `<main>`, so a wheel scroll landing on the
  // dimmed overlay nudges `<body>` instead of `<main>`. Since the highlighted target lives
  // inside `<main>` and doesn't move, that desyncs the spotlight/tooltip from it and exposes
  // a second, effectively-phantom scrollbar. Locking `<body>` scroll for the tour's duration
  // removes both: there's nothing left for a stray wheel event over the overlay to scroll.
  useEffect(() => {
    if (!run) return;
    const main = document.querySelector("main");
    const restores: Array<() => void> = [];

    const lock = (el: HTMLElement) => {
      const previous = el.style.overflow;
      el.style.overflow = "hidden";
      restores.push(() => {
        el.style.overflow = previous;
      });
    };

    lock(document.body);
    // `<main>` is the page's real scrollable region — Joyride only auto-scrolls it between
    // steps, it doesn't stop the user from freely wheel-scrolling it in between, which can
    // carry a target back out of view (e.g. behind the sticky header) with nothing to correct
    // it. Locking it for the tour's duration forces navigation through Next/Back, which is
    // exactly when Joyride does reposition things; programmatic scrolling (what Joyride uses)
    // still works on an overflow:hidden container even though wheel/scrollbar input doesn't.
    if (main) lock(main);

    return () => restores.forEach((restore) => restore());
  }, [run]);

  const finish = () => {
    setRun(false);
    onActiveChange?.(false);
    applicantServices.completeOnboarding().catch(() => {});
    queryClient.setQueryData(queryKeys.applicant.profile(), (old: any) =>
      old ? { ...old, profile: { ...old.profile, hasSeenOnboarding: true } } : old
    );
  };

  const handleEvent = (data: EventData) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      finish();
    }
  };

  if (!isOverviewPage || hasSeenOnboarding) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      locale={{ back: "Back", next: "Next", last: "Got It", skip: "Skip" }}
      options={{
        primaryColor: "#0b3363",
        textColor: "#374151",
        arrowColor: "#ffffff",
        backgroundColor: "#ffffff",
        zIndex: 10000,
        showProgress: true,
        buttons: ["back", "skip", "primary"],
        width: 320,
        spotlightRadius: 8,
        // The sidebar nav links stretch edge-to-edge, so the default padding (10px on
        // every side) made the highlighted box look like it was filling the whole sidebar.
        // A small vertical pad plus a negative horizontal pad insets the spotlight from the
        // link's own left/right edges instead, so it reads as a comfortably-sized card with
        // real margin around it rather than a full-bleed rectangle.
        spotlightPadding: { top: 4, bottom: 4, left: -8, right: -8 },
        // The sidebar's sticky header covers the top ~80px of the scroll area — without
        // extra clearance here, Joyride scrolls a target just far enough that its top edge
        // ends up hidden behind that header instead of fully in view.
        scrollOffset: 110,
      }}
      styles={{
        tooltip: { padding: 16 },
        tooltipContainer: { textAlign: "left" },
        tooltipTitle: { fontSize: 15, fontWeight: 700, marginBottom: 6, color: "#0b3363" },
        tooltipContent: { fontSize: 13, lineHeight: 1.5, padding: "4px 0 0" },
        tooltipFooter: { marginTop: 14 },
        buttonPrimary: { backgroundColor: "#0b3363", borderRadius: 6, fontWeight: 600, fontSize: 13, padding: "7px 14px" },
        buttonBack: { color: "#0b3363", fontSize: 13, fontWeight: 600, marginRight: 8 },
        buttonSkip: { color: "#9ca3af", fontSize: 13 },
      }}
    />
  );
}
