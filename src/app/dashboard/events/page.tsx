export default function EventsPage() {
  const events = [
    { type: "Msiba", title: "Msiba wa Familia ya Mwakipesile", location: "Dar es Salaam", status: "Inaendelea", target: 500000, raised: 320000 },
    { type: "Harusi", title: "Harusi ya Anna Shao", location: "Arusha", status: "Imepangwa", target: 300000, raised: 150000 },
    { type: "Ugonjwa", title: "Msaada wa Matibabu - Peter Mmari", location: "Moshi", status: "Imemalizika", target: 200000, raised: 200000 },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Matukio</h1>
          <p className="text-gray-600 text-sm">Misiba, Ugonjwa na Harusi</p>
        </div>
        <button className="bg-[#ff6b00] text-white px-5 py-2.5 rounded-xl text-sm font-medium">+ Ripoti Tukio</button>
      </div>

      <div className="grid gap-4">
        {events.map((e, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-700 rounded-full">{e.type}</span>
                <h3 className="font-semibold mt-2">{e.title}</h3>
                <p className="text-sm text-gray-500">{e.location}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Imekusanywa</p>
                <p className="font-bold text-lg">TSh {e.raised.toLocaleString()} / {e.target.toLocaleString()}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  e.status === "Imemalizika" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>{e.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
