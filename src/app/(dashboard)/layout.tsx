import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEMO_USER_ID } from "@/lib/utils";

async function getPropertyCount() {
  try {
    return await prisma.property.count({ where: { userId: DEMO_USER_ID } });
  } catch {
    return 0;
  }
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "◉" },
  { href: "/properties", label: "Properties", icon: "🏠" },
  { href: "/finances", label: "Finances", icon: "💷" },
  { href: "/finances/mtd", label: "MTD (Tax)", icon: "📤" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const count = await getPropertyCount();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-700">LetLaw</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
              ENG
            </span>
          </Link>
          <p className="text-xs text-gray-500 mt-1">Landlord Compliance</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.href === "/properties" && count > 0 && (
                <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-medium text-amber-800">
              ⚠️ RRA in effect 1 May 2026
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Not legal advice. England only.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
