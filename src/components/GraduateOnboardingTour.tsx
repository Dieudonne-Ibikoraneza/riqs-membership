"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Joyride, STATUS, type EventData, type Step } from "react-joyride";
import { applicantServices, type ApplicantProfileResponse } from "@/services/applicant.services";
import { queryKeys } from "@/services/queryKeys";

const steps: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Welcome to your RIQS Dashboard",
    content:
      "Since this is your first time here, here's a quick look at what matters most right now as a Graduate member. You can skip this anytime.",
  },
  {
    target: '[data-tour-id="tour-status-card"]',
    title: "Your Application & Status",
    content:
      "This shows your current application status and, once assigned, your official membership ID and renewal date.",
  },
  {
    target: '[data-tour-id="tour-stats-grid"]',
    title: "Your Progress at a Glance",
    content:
      "These tiles summarize your membership category, application status, logbook progress, and how many documents you have on file.",
  },
  {
    target: '[data-tour-id="tour-nav-profile"]',
    placement: "right",
    title: "My Profile",
    content: "Keep your personal, contact, and address details up to date here.",
  },
  {
    target: '[data-tour-id="tour-nav-application"]',
    placement: "right",
    title: "Application",
    content: "Review your submitted application and its details anytime.",
  },
  {
    target: '[data-tour-id="tour-nav-certificate"]',
    placement: "right",
    title: "Certificate",
    content: "Download your official membership certificate from here.",
  },
  {
    target: '[data-tour-id="tour-nav-payments"]',
    placement: "right",
    title: "Payments",
    content: "Pay your processing fee and annual membership dues from here.",
  },
  {
    target: '[data-tour-id="tour-nav-mentorship"]',
    placement: "right",
    title: "Mentorship",
    content:
      "This is where you'll track your mentorship and upload the reports and logbooks required for your membership upgrade.",
  },
  {
    target: '[data-tour-id="tour-nav-documents"]',
    placement: "right",
    title: "Documents",
    content: "Track the documents attached to your application here.",
  },
  {
    target: '[data-tour-id="tour-nav-support"]',
    placement: "right",
    title: "Support & Inquiries",
    content: "Stuck on something? Reach the Secretariat directly from here.",
  },
  {
    target: "body",
    placement: "center",
    title: "You're all set!",
    content: "That's the full tour — you're ready to go. Good luck with your mentorship!",
  },
];

// Shows a first-run guided tour to a Graduate member (or an applicant on the Graduate
// track awaiting approval) the first time they land on the dashboard: the application
// status, quick stats, then a walk through every item in the sidebar. Marks itself done on
// the backend (Member.hasSeenOnboarding) so it never runs again for this person.
export default function GraduateOnboardingTour({
  profileData,
  onActiveChange,
}: {
  profileData?: ApplicantProfileResponse;
  /** Called with true while the tour is running, false once it ends — lets the caller force
   *  the mobile sidebar drawer open so the nav-item steps have something to point at on
   *  small screens, where the sidebar is otherwise a closed off-canvas drawer. */
  onActiveChange?: (active: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [run, setRun] = useState(false);

  const membershipClass = (profileData?.profile as any)?.membershipClass || "";
  const appliedCategoryName =
    (profileData?.application as any)?.applied_category_name || profileData?.application?.category_name || "";
  const appliedCategoryCode =
    (profileData?.application as any)?.applied_category_code || (profileData?.application as any)?.category_code || "";

  // Covers both an already-approved Graduate member and a fresh applicant who just
  // submitted under the Graduate track and hasn't been approved yet — that's the "just
  // created their own application" case this tour exists for.
  const isGraduateTrack =
    membershipClass === "Graduate" ||
    /graduate/i.test(appliedCategoryName) ||
    ["GrQS", "GrQST"].includes(appliedCategoryCode);

  const hasSeenOnboarding = !!(profileData?.profile as any)?.hasSeenOnboarding;

  useEffect(() => {
    if (!profileData || !isGraduateTrack || hasSeenOnboarding) return;
    // Give the page a beat to render its data-tour-id targets before Joyride measures them.
    const timer = setTimeout(() => {
      onActiveChange?.(true);
      setRun(true);
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData, isGraduateTrack, hasSeenOnboarding]);

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

  if (!isGraduateTrack || hasSeenOnboarding) return null;

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
