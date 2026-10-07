import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from './ui/Field';
import {
  fetchPlacePredictions,
  geocodePlaceId,
  placesConfigured,
  type GeocodedPlace,
  type PlacePrediction,
} from '../lib/places';

type AddressAutocompleteProps = {
  id?: string;
  value: string;
  onChange: (address: string) => void;
  /** A suggestion was picked and geocoded (address + coordinates). */
  onResolved: (place: GeocodedPlace) => void;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
};

/**
 * Address input with Google Places suggestions (when VITE_GOOGLE_MAPS_API_KEY
 * is set). Picking a suggestion fills the coordinates through onResolved.
 */
export function AddressAutocomplete({
  id,
  value,
  onChange,
  onResolved,
  invalid,
  required,
  disabled,
}: AddressAutocompleteProps) {
  const { t } = useTranslation();
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [resolved, setResolved] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (debounce.current) clearTimeout(debounce.current);
    },
    [],
  );

  const onInput = (text: string) => {
    onChange(text);
    setResolved(false);
    if (!placesConfigured) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setPredictions(await fetchPlacePredictions(text));
    }, 350);
  };

  const pick = async (p: PlacePrediction) => {
    setPredictions([]);
    onChange(p.description);
    const place = await geocodePlaceId(p.placeId);
    if (!place) return;
    onResolved(place);
    setResolved(true);
  };

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        invalid={invalid}
        required={required}
        disabled={disabled}
        autoComplete="off"
        onChange={(e) => onInput(e.target.value)}
        onBlur={() => setTimeout(() => setPredictions([]), 150)}
      />
      {predictions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {predictions.map((p) => (
            <li key={p.placeId}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void pick(p)}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                {p.description}
              </button>
            </li>
          ))}
        </ul>
      )}
      {resolved && <p className="mt-1 text-xs text-green-600">{t('CreateSpot.coordsFromAddress')}</p>}
    </div>
  );
}
