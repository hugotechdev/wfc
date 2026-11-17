import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Usajili wa Mwanachama</h1>
        <p className="text-gray-600 mb-6">
          Sehemu hii itajengwa katika Awamu inayofuata.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#ff6b00] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#e55a00]"
        >
          Rudi kwenye Kuingia
        </Link>
      </div>
    </div>
  );
}
