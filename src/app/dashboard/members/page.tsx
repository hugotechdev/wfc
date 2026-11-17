export default function MembersPage() {
  const members = [
    { id: "WFC-0001", name: "John M. Mwakipesile", kanda: "Dar es Salaam", status: "Hai", debt: 0 },
    { id: "WFC-0002", name: "Anna E. Shao", kanda: "Arusha", status: "Hai", debt: 20000 },
    { id: "WFC-0003", name: "Peter S. Mmari", kanda: "Moshi", status: "Hai", debt: 0 },
    { id: "WFC-0004", name: "Grace T. Urio", kanda: "Dar es Salaam", status: "Amesimamishwa", debt: 68000 },
    { id: "WFC-0005", name: "Mariam J. Lyimo", kanda: "Tanga", status: "Hai", debt: 10000 },
    { id: "WFC-0006", name: "David J. Ngowi", kanda: "Dodoma", status: "Hai", debt: 0 },
    { id: "WFC-0007", name: "Neema P. Swai", kanda: "Dar es Salaam", status: "Hai", debt: 5000 },
    { id: "WFC-0008", name: "Fatuma A. Mtui", kanda: "Moshi", status: "Hai", debt: 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Wanachama</h1>
          <p className="text-gray-600 text-sm">Jumla: 469 wanachama</p>
        </div>
        <button className="bg-[#ff6b00] hover:bg-[#e55a00] text-white px-5 py-2.5 rounded-xl text-sm font-medium">
          + Ongeza Mwanachama
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b">
          <input
            placeholder="Tafuta jina, WFC ID au kanda..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3 font-medium">WFC ID</th>
                <th className="text-left px-5 py-3 font-medium">Jina</th>
                <th className="text-left px-5 py-3 font-medium">Kanda</th>
                <th className="text-left px-5 py-3 font-medium">Hali</th>
                <th className="text-left px-5 py-3 font-medium">Deni</th>
                <th className="text-left px-5 py-3 font-medium">Hatua</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-orange-600">{m.id}</td>
                  <td className="px-5 py-3">{m.name}</td>
                  <td className="px-5 py-3">{m.kanda}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      m.status === "Hai" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">{m.debt > 0 ? `TSh ${m.debt.toLocaleString()}` : "—"}</td>
                  <td className="px-5 py-3">
                    <button className="text-orange-600 hover:underline text-xs">Tazama</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
