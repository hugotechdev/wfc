export default function AnnouncementsPage() {
  const announcements = [
    { title: "Mkutano Mkuu wa Mwaka 2026", date: "15 Desemba 2026", body: "Wanachama wote wanahitajika kuhudhuria mkutano mkuu utakaofanyika Ukumbi wa WFC, Dar es Salaam." },
    { title: "Ada ya Mwezi wa Novemba", date: "30 Novemba 2026", body: "Mwisho wa kulipa ada ya mwezi ni tarehe 30 Novemba. Lipa mapema kuepuka deni." },
    { title: "WFC Festival 2026", date: "Agosti 2026", body: "Maandalizi ya Festival yanaendelea. Taarifa zaidi zitakuja hivi karibuni." },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Matangazo</h1>
        <button className="bg-[#ff6b00] text-white px-5 py-2.5 rounded-xl text-sm font-medium">+ Tangazo Jipya</button>
      </div>
      <div className="space-y-4">
        {announcements.map((a, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">{a.title}</h3>
              <span className="text-xs text-gray-500">{a.date}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
