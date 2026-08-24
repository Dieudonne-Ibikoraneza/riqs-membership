export type GraduateApplicationRoute = {
  code: string;
  title: string;
  requirement: string;
  description: string;
  upgrade: string;
};

export const graduateApplicationRoutes: Record<string, GraduateApplicationRoute> = {
  GradQST: {
    code: "GradQST",
    title: "Graduate QS Technologist",
    requirement: "A Diploma in Quantity Surveying or a recognised equivalent.",
    description: "For graduates entering the quantity surveying technologist route.",
    upgrade: "After the required mentorship and practical experience, you may upgrade to Associate QS Technologist and later pursue full Technologist membership through the applicable assessment route.",
  },
  GradQS: {
    code: "GradQS",
    title: "Graduate QS",
    requirement: "A Bachelor's degree in Quantity Surveying or a recognised equivalent.",
    description: "For graduates entering the professional quantity surveying route.",
    upgrade: "After the required mentorship and practical experience, you may upgrade to Associate QS and later pursue Professional QS membership through the applicable assessment route.",
  },
};

export function isGraduateApplicationCategory(category: any): boolean {
  return ["GradQST", "GradQS", "GrQST", "GrQS"].includes(category?.category_code || category?.categoryCode);
}

export function getGraduateApplicationRoute(category: any): GraduateApplicationRoute | undefined {
  const code = category?.category_code || category?.categoryCode;
  return graduateApplicationRoutes[code] || graduateApplicationRoutes[code === "GrQST" ? "GradQST" : code === "GrQS" ? "GradQS" : code];
}
