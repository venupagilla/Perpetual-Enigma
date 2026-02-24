import Navbar from "@/components/Navbar"
import DashboardBackground from "@/components/DashboardBackground"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen bg-black text-white relative">
            <DashboardBackground />
            <Navbar />
            <main className="flex-1 flex flex-col pt-24 px-6 md:px-12 pb-12 overflow-y-auto relative z-10">
                <div className="max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
