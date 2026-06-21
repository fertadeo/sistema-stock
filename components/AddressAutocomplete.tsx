'use client';

import React, { useRef, useEffect } from 'react';
import { useGoogleMapsLoader, RIO_CUARTO_BOUNDS } from './GoogleMapsProvider';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, lat: string, lon: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Ingrese la dirección',
  label = 'Dirección',
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded, loadError } = useGoogleMapsLoader();

  useEffect(() => {
    autocompleteRef.current = null;
  }, [value]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    const bounds = new google.maps.LatLngBounds(
      { lat: RIO_CUARTO_BOUNDS.south, lng: RIO_CUARTO_BOUNDS.west },
      { lat: RIO_CUARTO_BOUNDS.north, lng: RIO_CUARTO_BOUNDS.east }
    );

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'ar' },
      bounds,
      fields: ['formatted_address', 'geometry', 'name'],
      types: ['address'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place?.geometry?.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address || place.name || '';

      onChange(address, String(lat), String(lng));
    });
  }, [isLoaded, onChange, value]);

  if (loadError) {
    return (
      <div className={className}>
        <label className="block mb-1 text-sm text-gray-600">{label}</label>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value, '', '')}
          className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <p className="mt-1 text-xs text-gray-500">Google Maps no disponible. Ingrese la dirección manualmente.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={className}>
        <label className="block mb-1 text-sm text-gray-600">{label}</label>
        <input
          type="text"
          value={value}
          placeholder="Cargando autocomplete..."
          disabled
          className="px-3 py-2 w-full rounded-lg border border-gray-300 bg-gray-100"
        />
      </div>
    );
  }

  return (
    <div className={className} key={value || 'new-address'}>
      <label className="block mb-1 text-sm text-gray-600">{label}</label>
      <input
        ref={inputRef}
        key={value || 'new'}
        type="text"
        defaultValue={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value, '', '')}
        className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
        autoComplete="off"
      />
    </div>
  );
};

export default AddressAutocomplete;
