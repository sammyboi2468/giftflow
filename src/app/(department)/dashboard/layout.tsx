import Navbar from "@/components/navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top Navigation Bar */}
      <Navbar />

      <div className="flex flex-1">
        {/* Left Vertical Sidebar
            When you add it, hide it on small screens and show it from lg up:
            <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">...</aside>
            and give mobile users a menu button in the Navbar that opens it as a drawer. */}

        {/* Dynamic Page Workspace.
            min-w-0 lets wide children (tables, code) scroll inside their own
            container instead of stretching the whole page sideways. */}
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}