import Nav from "@/components/Nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="md:flex bg-[var(--bg)] min-h-screen">
      <Nav />
      <main className="flex-1 min-h-screen">
        <div className="max-w-[1400px] mx-auto p-4 md:p-10">{children}</div>
      </main>
    </div>
  );
}
