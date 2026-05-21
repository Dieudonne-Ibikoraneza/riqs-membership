export type MemberCategory = string;

export type ApplicationStatus =
  | "Draft"
  | "Pending"
  | "Under Review"
  | "Correction Required"
  | "Approved"
  | "Rejected";

export interface Member {
  id: string;
  membershipId: string;
  fullName: string;
  category: MemberCategory;
  practiceLocation: string;
  entityType: string;
  phone: string;
  email: string;
  status: "Active" | "In Mentorship" | "Suspended" | "Expired";
  photo?: string;
  joinedAt: string;
  expiresAt: string;
  nationalId?: string;
  address?: string;
  country?: string;
}

export interface Application {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  category: MemberCategory;
  entityType: string;
  practiceLocation: string;
  submittedAt: string;
  status: ApplicationStatus;
  reviewer?: string;
  lastAction: string;
  documents: { name: string; type: string; url: string }[];
  education: { degree: string; institution: string; year: number }[];
  employment: { company: string; role: string; from: string; to?: string }[];
  mentorship?: { mentor: string; startedAt: string; progress: number };
  notes?: string;
}

const first = ["Jean", "Aline", "Eric", "Patrick", "Diane", "Claude", "Yves", "Sandrine", "Olivier", "Grace", "Innocent", "Chantal", "Emmanuel", "Sarah", "David", "Linda", "Kevin", "Anita", "Bosco", "Tracy"];
const last = ["Mugisha", "Uwase", "Habimana", "Iradukunda", "Nshuti", "Mukamana", "Bizimana", "Kayitesi", "Niyonsenga", "Ishimwe", "Rugamba", "Kagame", "Mutoni", "Hakizimana", "Umutoni", "Ndayisaba", "Kalisa", "Ntwari", "Gatete", "Mahoro"];
const cats: MemberCategory[] = ["Graduate", "Technologist", "Professional", "Fellow", "Firm"];

function pad(n: number, w: number) { return n.toString().padStart(w, "0"); }

export const MEMBERS: Member[] = Array.from({ length: 47 }).map((_, i) => {
  const name = `${first[i % first.length]} ${last[(i * 3) % last.length]}`;
  const cat = cats[i % cats.length];
  return {
    id: `m-${i + 1}`,
    membershipId: `RIQS-${2020 + (i % 5)}-${pad(i + 1, 3)}`,
    fullName: cat === "Firm" ? `${last[i % last.length]} Consultants Ltd` : name,
    category: cat,
    practiceLocation: i % 6 === 0 ? "Foreign" : "Local",
    entityType: cat === "Firm" ? "Firm" : "Individual",
    phone: `+250 78${pad(1000000 + i * 13, 7)}`.slice(0, 16),
    email: `${name.toLowerCase().replace(/\s/g, ".")}@example.rw`,
    status: i % 9 === 0 ? "In Mentorship" : i % 17 === 0 ? "Expired" : "Active",
    joinedAt: `202${i % 5}-0${(i % 9) + 1}-15`,
    expiresAt: `202${5 + (i % 2)}-12-31`,
    country: i % 6 === 0 ? "Kenya" : "Rwanda",
    address: "KG 11 Ave, Kigali",
  };
});

const statuses: ApplicationStatus[] = ["Pending", "Under Review", "Correction Required", "Approved", "Rejected"];

export const APPLICATIONS: Application[] = Array.from({ length: 24 }).map((_, i) => {
  const name = `${first[(i + 4) % first.length]} ${last[(i + 7) % last.length]}`;
  const cat = cats[i % cats.length];
  return {
    id: `APP-${pad(1001 + i, 4)}`,
    applicantName: cat === "Firm" ? `${last[i % last.length]} QS Group` : name,
    email: `${name.toLowerCase().replace(/\s/g, ".")}@mail.rw`,
    phone: `+250 788${pad(100000 + i * 7, 6)}`,
    category: cat,
    entityType: cat === "Firm" ? "Firm" : "Individual",
    practiceLocation: i % 5 === 0 ? "Foreign" : "Local",
    submittedAt: `2025-${pad((i % 12) + 1, 2)}-${pad((i % 27) + 1, 2)}`,
    status: statuses[i % statuses.length],
    reviewer: i % 3 === 0 ? "Eng. P. Nshuti" : "Eng. C. Mukamana",
    lastAction: i % 2 === 0 ? "Assigned to reviewer" : "Awaiting documents",
    documents: [
      { name: "National ID.pdf", type: "pdf", url: "#" },
      { name: "Degree Certificate.pdf", type: "pdf", url: "#" },
      { name: "Passport Photo.jpg", type: "image", url: "#" },
      { name: "CV.pdf", type: "pdf", url: "#" },
    ],
    education: [
      { degree: "BSc Quantity Surveying", institution: "University of Rwanda", year: 2019 + (i % 5) },
      ...(i % 3 === 0 ? [{ degree: "MSc Construction Mgmt", institution: "Strathmore Univ.", year: 2023 }] : []),
    ],
    employment: [
      { company: "Kigali Build Ltd", role: "Junior QS", from: "2020-06" },
    ],
    mentorship: cat === "Graduate" ? { mentor: "Eng. P. Nshuti", startedAt: "2024-02-01", progress: 60 } : undefined,
  };
});

export const ME_APPLICATION: Application = {
  ...APPLICATIONS[0],
  applicantName: "Demo Member",
  email: "demo@riqs.rw",
  status: "Approved",
};
