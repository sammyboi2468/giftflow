import Navbar from "@/components/navbar";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar />

      <div className="flex flex-1">
        {/* Left Vertical Sidebar */}
        

        {/* Dynamic Page Workspace */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}