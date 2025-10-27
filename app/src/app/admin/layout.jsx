import Sidebar from "@/components/Sidebar";
import "@/lib/charts"; 
import LowStockWatcher from "@/components/LowStockWatcher";

export default function AdminLayout({ children }) {
  return (
    <>
      <Sidebar />
      <LowStockWatcher n={3} everyMs={180000} />
      {/* content wrapper: left padding = sidebar width */}
      <div className="lg:pl-54">
        <main className="px-4 md:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </>
  );
}

