import { AppShell } from "@/components/AppShell";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <AppShell kind="member">{children}</AppShell>;
}
