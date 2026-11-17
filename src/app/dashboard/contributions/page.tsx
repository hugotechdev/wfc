export default function ContributionsPage() {
  const payments = [
    { date: "20 Nov 2026", member: "John M. Mwakipesile", type: "Ada ya mwezi", amount: 10000, method: "M-Pesa", status: "Imethibitishwa" },
    { date: "19 Nov 2026", member: "Anna E. Shao", type: "Kiingilio", amount: 50000, method: "Tigo Pesa", status: "Imethibitishwa" },
    { date: "18 Nov 2026", member: "Peter S. Mmari", type: "Dharura", amount: 60000, method: "Airtel Money", status: "Imethibitishwa" },
    { date: "15 Nov 2026", member: "Mariam J. Lyimo", type: "Ada ya mwezi", amount: 10000, method: "Benki", status: "Imethibitishwa" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Michango na Fedha</h1>
      <p className="text-gray-600 text-sm mb-6">Ada, Kiingilio, Dharura na Michango mingine</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-orange-500 text-white rounded-2xl p-5">
          <p className="text-sm opacity-90">Kiingilio</p>
          <p className="text-2xl font-bold mt-1">TSh 50,000</p>
        </div>
        <div className="bg-gray-900 text-white rounded-2xl p-5">
          <p className="text-sm opacity-90">Ada ya mwezi</p>
          <p className="text-2xl font-bold mt-1">TSh 10,000</p>
        </div>
        <div className="bg-white border border-orange-200 rounded-2xl p-5">
          <p className="text-sm text-gray-500">Dharura</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">TSh 60,000</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Historia ya Malipo</h2>
          <button className="text-sm text-orange-600 font-medium">Pakua Ripoti</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-5 py-3">Tarehe</th>
                <th className="text-left px-5 py-3">Mwanachama</th>
                <th className="text-left px-5 py-3">Aina</th>
                <th className="text-left px-5 py-3">Kiasi</th>
                <th className="text-left px-5 py-3">Njia</th>
                <th className="text-left px-5 py-3">Hali</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3">{p.date}</td>
                  <td className="px-5 py-3">{p.member}</td>
                  <td className="px-5 py-3">{p.type}</td>
                  <td className="px-5 py-3 font-medium">TSh {p.amount.toLocaleString()}</td>
                  <td className="px-5 py-3">{p.method}</td>
                  <td className="px-5 py-3">
                    <span className="text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs">{p.status}</span>
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
