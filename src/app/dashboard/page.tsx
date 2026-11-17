import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Karibu kwenye WFC Portal</h1>
        <p className="text-gray-600">Umoja wa Wachagga, Nguvu ya Familia · Stand up, It's not over</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Wanachama</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">469</p>
          <p className="text-xs text-green-600 mt-1">+12 mwezi huu</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Michango (Mwezi)</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">TSh 4.2M</p>
          <p className="text-xs text-green-600 mt-1">Imelipwa 78%</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Matukio Hai</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">7</p>
          <p className="text-xs text-orange-600 mt-1">3 yanahitaji hatua</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Deni Jumla</p>
          <p className="text-3xl font-bold text-red-600 mt-1">TSh 1.8M</p>
          <p className="text-xs text-gray-500 mt-1">Wanachama 86</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/dashboard/members" className="bg-orange-50 border border-orange-100 rounded-2xl p-5 hover:bg-orange-100 transition">
          <p className="font-semibold text-orange-700">Orodha ya Wanachama</p>
          <p className="text-sm text-orange-600 mt-1">Tazama, tafuta na simamia wanachama</p>
        </Link>
        <Link href="/dashboard/contributions" className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-orange-200 transition">
          <p className="font-semibold">Michango na Fedha</p>
          <p className="text-sm text-gray-600 mt-1">Ada, dharura, risiti na ripoti</p>
        </Link>
        <Link href="/dashboard/events" className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-orange-200 transition">
          <p className="font-semibold">Matukio (Misiba & Harusi)</p>
          <p className="text-sm text-gray-600 mt-1">Ripoti na fuatilia michango ya matukio</p>
        </Link>
      </div>

      {/* Recent Announcements */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold mb-4">Matangazo ya Hivi Karibuni</h2>
        <div className="space-y-4">
          <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
            <span className="text-2xl">📢</span>
            <div>
              <p className="font-medium">Mkutano Mkuu wa Mwaka</p>
              <p className="text-sm text-gray-600">Tarehe 15 Desemba 2026 · Ukumbi wa WFC, Dar es Salaam</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
            <span className="text-2xl">💰</span>
            <div>
              <p className="font-medium">Ada ya Mwezi wa Novemba</p>
              <p className="text-sm text-gray-600">Mwisho wa malipo ni tarehe 30 Novemba 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
