import { AppShell } from "@/components/AppShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link 
        rel="stylesheet" 
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap" 
      />
      <AppShell kind="admin">{children}</AppShell>
    </>
  );
}

