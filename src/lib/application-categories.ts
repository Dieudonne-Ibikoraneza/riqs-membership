export type GraduateApplicationRoute = {
  code: string;
  title: string;
  requirement: string;
  description: string;
  upgrade: string;
};

export const graduateApplicationRoutes: Record<string, GraduateApplicationRoute> = {
  GrQST: {
    code: "GrQST",
    title: "Graduate QS Technologist",
    requirement: "A Diploma in Quantity Surveying or a recognised equivalent.",
    description: "For graduates entering the quantity surveying technologist route.",
    upgrade: "After the required mentorship and practical experience, you may upgrade to Associate QS Technologist and later pursue full Technologist membership through the applicable assessment route.",
  },
  GrQS: {
    code: "GrQS",
    title: "Graduate QS",
    requirement: "A Bachelor's degree in Quantity Surveying or a recognised equivalent.",
    description: "For graduates entering the professional quantity surveying route.",
    upgrade: "After the required mentorship and practical experience, you may upgrade to Associate QS and later pursue Professional QS membership through the applicable assessment route.",
  },
};

export function isGraduateApplicationCategory(category: any): boolean {
  return ["GrQST", "GrQS"].includes(category?.category_code || category?.categoryCode);
}

/**
 * Which mentorship-side page a member belongs on, derived from their membership /
 * application category rather than only their (possibly not-yet-activated) class.
 *  - "mentee": Graduate / Associate — sees the Mentorship & Progression page.
 *  - "mentor": Technologist / Professional — sees the My Mentees page.
 * Returns null for categories with no mentorship track (Student, Visiting, Firm, etc.).
 */
export function getMembershipTrack(opts: {
  categoryCode?: string | null;
  categoryName?: string | null;
}): "mentee" | "mentor" | null {
  const code = (opts.categoryCode || "").trim();
  const name = (opts.categoryName || "").toLowerCase();

  const MENTEE_CODES = ["GrQS", "GrQST", "AsQS", "AsQST"];
  const MENTOR_CODES = ["TcQS", "PrQS", "F-TcQS", "F-PrQS"];

  if (MENTEE_CODES.includes(code)) return "mentee";
  if (MENTOR_CODES.includes(code)) return "mentor";

  // Fallback on the human name. Check graduate/associate first: "Graduate Quantity
  // Surveying Technologist" contains "technologist" but is still a mentee track.
  if (/graduate|associate/.test(name)) return "mentee";
  if (/technologist|professional/.test(name)) return "mentor";
  return null;
}

export function getGraduateApplicationRoute(category: any): GraduateApplicationRoute | undefined {
  const code = category?.category_code || category?.categoryCode;
  return graduateApplicationRoutes[code];
}
