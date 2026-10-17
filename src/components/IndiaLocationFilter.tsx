import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { INDIAN_STATES, DistrictLocation } from '../data/indianLocations';
import { CityLocation } from '../types';

interface IndiaLocationFilterProps {
  selectedState?: string;
  selectedDistrict?: string;
  onSelectLocation: (city: CityLocation) => void;
  variant?: 'header' | 'section';
}

export const IndiaLocationFilter: React.FC<IndiaLocationFilterProps> = ({
  selectedState = 'Tamil Nadu',
  selectedDistrict = 'Chennai',
  onSelectLocation,
  variant = 'header',
}) => {
  // Find current state object
  const currentStateObj = useMemo(() => {
    return (
      INDIAN_STATES.find(
        (s) => s.name.toLowerCase() === selectedState.toLowerCase()
      ) || INDIAN_STATES[0]
    );
  }, [selectedState]);

  // Available districts for the current state
  const availableDistricts = currentStateObj.districts;

  const handleStateChange = (stateName: string) => {
    const newState = INDIAN_STATES.find((s) => s.name === stateName);
    if (!newState) return;
    const defaultDistrict = newState.districts[0];
    onSelectLocation({
      name: defaultDistrict.name,
      admin1: newState.name,
      country: 'India',
      latitude: defaultDistrict.latitude,
      longitude: defaultDistrict.longitude,
    });
  };

  const handleDistrictChange = (districtName: string) => {
    const targetDistrict = availableDistricts.find((d) => d.name === districtName);
    if (!targetDistrict) return;
    onSelectLocation({
      name: targetDistrict.name,
      admin1: currentStateObj.name,
      country: 'India',
      latitude: targetDistrict.latitude,
      longitude: targetDistrict.longitude,
    });
  };

  if (variant === 'section') {
    return (
      <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 border border-sky-200/80 rounded-xl p-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-900">
                  India State & District Filter
                </span>
                <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-sky-200/70 text-sky-800 rounded">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Evaluating telemetry for{' '}
                <span className="font-bold text-slate-900">
                  {selectedDistrict}, {currentStateObj.name}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <label htmlFor="sec-state" className="text-[11px] font-semibold text-slate-500">
                State:
              </label>
              <select
                id="sec-state"
                value={currentStateObj.name}
                onChange={(e) => handleStateChange(e.target.value)}
                className="bg-transparent text-slate-800 font-bold text-xs focus:outline-none cursor-pointer"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st.code} value={st.name}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <label htmlFor="sec-district" className="text-[11px] font-semibold text-slate-500">
                District:
              </label>
              <select
                id="sec-district"
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="bg-transparent text-slate-800 font-bold text-xs focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                {availableDistricts.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Header compact variant replacing the "Rules" button
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg shadow-2xs transition-colors"
      title="Filter air telemetry by Indian State & District"
    >
      <div className="flex items-center gap-1 text-slate-500 font-semibold text-[11px]">
        <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
        <span className="hidden xl:inline text-slate-600">India:</span>
      </div>

      {/* State Dropdown */}
      <select
        value={currentStateObj.name}
        onChange={(e) => handleStateChange(e.target.value)}
        title="Filter by Indian State"
        aria-label="Select Indian State"
        className="bg-white text-slate-800 font-semibold py-0.5 px-2 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs max-w-[110px] sm:max-w-[125px] truncate"
      >
        {INDIAN_STATES.map((st) => (
          <option key={st.code} value={st.name}>
            {st.name}
          </option>
        ))}
      </select>

      {/* District Dropdown */}
      <select
        value={selectedDistrict}
        onChange={(e) => handleDistrictChange(e.target.value)}
        title="Filter by District"
        aria-label="Select District"
        className="bg-white text-slate-800 font-semibold py-0.5 px-2 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs max-w-[110px] sm:max-w-[130px] truncate"
      >
        {availableDistricts.map((d) => (
          <option key={d.name} value={d.name}>
            {d.name}
          </option>
        ))}
      </select>
    </div>
  );
};
