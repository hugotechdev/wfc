// Mock data for Railway deploy (no local DB needed)
const members = [
  { wfcId: "WFC-0001", firstName: "John", lastName: "Mwakipesile", region: "Dar es Salaam", status: "ACTIVE" },
  { wfcId: "WFC-0002", firstName: "Anna", lastName: "Shao", region: "Arusha", status: "ACTIVE" },
  { wfcId: "WFC-0003", firstName: "Peter", lastName: "Mmari", region: "Moshi", status: "ACTIVE" },
  { wfcId: "WFC-0004", firstName: "Grace", lastName: "Urio", region: "Dar es Salaam", status: "SUSPENDED" },
  { wfcId: "WFC-0005", firstName: "Mariam", lastName: "Lyimo", region: "Tanga", status: "ACTIVE" },
  { wfcId: "WFC-0006", firstName: "David", lastName: "Ngowi", region: "Dodoma", status: "ACTIVE" },
];

export default function MembersPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Wanachama</h1>
          <p className="text-gray-600 text-sm">Jumla: {members.length} wanachama</p>
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
                <th className="text-left px-5 py-3 font-medium">Hatua</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.wfcId} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-orange-600">{m.wfcId}</td>
                  <td className="px-5 py-3">{m.firstName} {m.lastName}</td>
                  <td className="px-5 py-3">{m.region}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      m.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {m.status === "ACTIVE" ? "Hai" : "Amesimamishwa"}
                    </span>
                  </td>
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
