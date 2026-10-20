import type { ChangeEvent } from "react";
import { PERIOD_CODES, type PeriodCode } from "../models/offer.ts";
import { PERIOD_LABELS } from "../utils/labels.ts";

interface PeriodFilterProps {
  value: PeriodCode | "";
  onChange: (value: PeriodCode | "") => void;
}

const PeriodFilter = ({ value, onChange }: PeriodFilterProps) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as PeriodCode | "");
  };

  return (
    <label className="filter-field">
      <span>Période</span>
      <select value={value} onChange={handleChange} aria-label="Filtrer par période">
        <option value="">Toutes les périodes</option>
        {PERIOD_CODES.map((code) => (
          <option key={code} value={code}>
            {PERIOD_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
};

export default PeriodFilter;

