import { createProperty } from "@/lib/actions";

export default function NewPropertyPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Property</h1>
        <p className="text-gray-500 text-sm mt-1">
          Enter the property details to begin tracking compliance.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <form action={createProperty} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              name="addressLine1"
              required
              placeholder="e.g. 42 Victoria Road"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 2
            </label>
            <input
              name="addressLine2"
              placeholder="Flat number, building name (optional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                name="city"
                required
                placeholder="e.g. Manchester"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postcode <span className="text-red-500">*</span>
              </label>
              <input
                name="postcode"
                required
                placeholder="e.g. M1 1AA"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <select
                name="propertyType"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="house">House</option>
                <option value="flat">Flat / Apartment</option>
                <option value="hmo">HMO</option>
                <option value="bungalow">Bungalow</option>
                <option value="maisonette">Maisonette</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <select
                name="bedrooms"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} bedroom{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-700 text-white py-2.5 rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              Add Property
            </button>
            <a
              href="/properties"
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors text-center"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
