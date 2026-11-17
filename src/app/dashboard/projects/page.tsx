export default function ProjectsPage() {
  const projects = [
    { name: "WCSC", status: "Inaendelea", progress: 65 },
    { name: "Community Tours", status: "Imepangwa", progress: 20 },
    { name: "SACCOS / UTT AMIS", status: "Inaendelea", progress: 40 },
    { name: "WFC Festival", status: "Maandalizi", progress: 30 },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Miradi</h1>
      <div className="grid gap-4">
        {projects.map((p, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">{p.name}</h3>
              <span className="text-xs text-orange-600">{p.status}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${p.progress}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{p.progress}% imekamilika</p>
          </div>
        ))}
      </div>
    </div>
  );
}
