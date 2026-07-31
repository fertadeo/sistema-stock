'use client';

import React, { useRef, useEffect, useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useGoogleMapsLoader, RIO_CUARTO_BOUNDS, isInRioCuartoBounds } from './GoogleMapsProvider';
import {
  obtenerMiUbicacion,
  MiUbicacionError,
} from '@/lib/geocode/obtenerMiUbicacion';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, lat: string, lon: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  /** Muestra el botón para tomar coordenadas del GPS. Por defecto true. */
  showMiUbicacion?: boolean;
}

function obtenerDetallesLugar(
  place: google.maps.places.PlaceResult
): Promise<{ address: string; lat: number; lng: number } | null> {
  if (place.geometry?.location) {
    return Promise.resolve({
      address: place.formatted_address || place.name || '',
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    });
  }

  const placeId = place.place_id;
  if (!placeId) return Promise.resolve(null);

  return new Promise((resolve) => {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    service.getDetails(
      {
        placeId,
        fields: ['formatted_address', 'geometry', 'name'],
      },
      (result, status) => {
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !result?.geometry?.location
        ) {
          resolve(null);
          return;
        }
        resolve({
          address: result.formatted_address || result.name || '',
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
        });
      }
    );
  });
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Ingrese la dirección',
  label = 'Dirección',
  className = '',
  showMiUbicacion = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const selectingPlaceRef = useRef(false);
  const [errorFueraDeCiudad, setErrorFueraDeCiudad] = useState(false);
  const [errorMiUbicacion, setErrorMiUbicacion] = useState<string | null>(null);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const { isLoaded, loadError } = useGoogleMapsLoader();

  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-address-autocomplete', 'true');
    style.textContent = `
      .pac-container {
        z-index: 99999 !important;
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.value = value;
    }
  }, [value]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    const bounds = new google.maps.LatLngBounds(
      { lat: RIO_CUARTO_BOUNDS.south, lng: RIO_CUARTO_BOUNDS.west },
      { lat: RIO_CUARTO_BOUNDS.north, lng: RIO_CUARTO_BOUNDS.east }
    );

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'ar' },
      bounds,
      strictBounds: true,
      fields: ['formatted_address', 'geometry', 'name', 'place_id'],
      types: ['address'],
    });

    autocompleteRef.current = autocomplete;

    const listener = autocomplete.addListener('place_changed', () => {
      void (async () => {
        const place = autocomplete.getPlace();
        const detalles = await obtenerDetallesLugar(place);
        if (!detalles) return;

        if (!isInRioCuartoBounds(detalles.lat, detalles.lng)) {
          setErrorFueraDeCiudad(true);
          if (inputRef.current) {
            inputRef.current.value = '';
          }
          onChangeRef.current('', '', '');
          return;
        }

        setErrorFueraDeCiudad(false);
        setErrorMiUbicacion(null);
        selectingPlaceRef.current = true;

        if (inputRef.current) {
          inputRef.current.value = detalles.address;
        }

        onChangeRef.current(
          detalles.address,
          String(detalles.lat),
          String(detalles.lng)
        );

        window.setTimeout(() => {
          selectingPlaceRef.current = false;
        }, 200);
      })();
    });

    return () => {
      google.maps.event.removeListener(listener);
      autocompleteRef.current = null;
    };
  }, [isLoaded]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (selectingPlaceRef.current) return;
    if (errorFueraDeCiudad) {
      setErrorFueraDeCiudad(false);
    }
    if (errorMiUbicacion) {
      setErrorMiUbicacion(null);
    }
    onChangeRef.current(event.target.value, '', '');
  };

  const handleMiUbicacion = async () => {
    setErrorMiUbicacion(null);
    setErrorFueraDeCiudad(false);
    setObteniendoUbicacion(true);

    try {
      const resultado = await obtenerMiUbicacion(valueRef.current);
      selectingPlaceRef.current = true;

      if (inputRef.current) {
        inputRef.current.value = resultado.direccion;
      }

      onChangeRef.current(
        resultado.direccion,
        resultado.latitud,
        resultado.longitud
      );

      window.setTimeout(() => {
        selectingPlaceRef.current = false;
      }, 200);
    } catch (error) {
      const mensaje =
        error instanceof MiUbicacionError
          ? error.message
          : 'No se pudo obtener tu ubicación.';
      setErrorMiUbicacion(mensaje);
    } finally {
      setObteniendoUbicacion(false);
    }
  };

  const botonMiUbicacion = showMiUbicacion ? (
    <button
      type="button"
      onClick={() => void handleMiUbicacion()}
      disabled={obteniendoUbicacion}
      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <MapPinIcon className="w-4 h-4 shrink-0" />
      {obteniendoUbicacion ? 'Obteniendo ubicación...' : 'Mi ubicación'}
    </button>
  ) : null;

  const mensajesError = (
    <>
      {errorFueraDeCiudad && (
        <p className="mt-1 text-xs text-red-600">
          La dirección debe estar dentro de Río Cuarto.
        </p>
      )}
      {errorMiUbicacion && (
        <p className="mt-1 text-xs text-red-600">{errorMiUbicacion}</p>
      )}
    </>
  );

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
        <p className="mt-1 text-xs text-gray-500">
          Google Maps no disponible. Ingrese la dirección manualmente.
        </p>
        {botonMiUbicacion}
        {mensajesError}
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
        {botonMiUbicacion}
        {mensajesError}
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block mb-1 text-sm text-gray-600">{label}</label>
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        placeholder={placeholder}
        onChange={handleInputChange}
        className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
        autoComplete="off"
      />
      {botonMiUbicacion}
      {mensajesError}
    </div>
  );
};

export default AddressAutocomplete;
