export default function ReportsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ripoti</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold">Ripoti ya Michango ya Mwezi</h3>
          <p className="text-sm text-gray-600 mt-1">Novemba 2026</p>
          <button className="mt-4 text-orange-600 text-sm font-medium">Pakua PDF</button>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold">Ripoti ya Wanachama</h3>
          <p className="text-sm text-gray-600 mt-1">Hali ya uanachama na deni</p>
          <button className="mt-4 text-orange-600 text-sm font-medium">Pakua PDF</button>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold">Ripoti ya Matukio</h3>
          <p className="text-sm text-gray-600 mt-1">Misiba na harusi</p>
          <button className="mt-4 text-orange-600 text-sm font-medium">Pakua PDF</button>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold">Audit Trail</h3>
          <p className="text-sm text-gray-600 mt-1">Kumbukumbu za mabadiliko</p>
          <button className="mt-4 text-orange-600 text-sm font-medium">Tazama</button>
        </div>
      </div>
    </div>
  );
}
