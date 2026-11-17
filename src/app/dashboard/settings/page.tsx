export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mipangilio</h1>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Taarifa za Mfumo</h3>
          <p className="text-sm text-gray-600">WFC Online Management System v1.0</p>
          <p className="text-sm text-gray-600">Nembo: Wachagga Family Community</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Ada za Sasa</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>Kiingilio: TSh 50,000</li>
            <li>Ada ya mwezi: TSh 10,000</li>
            <li>Dharura: TSh 60,000</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Usalama</h3>
          <p className="text-sm text-gray-600">Badilisha nenosiri · Audit logs · Backup</p>
        </div>
      </div>
    </div>
  );
}
