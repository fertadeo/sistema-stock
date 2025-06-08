import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@heroui/react";

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, lat: string, lon: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

// Función para simplificar el display_name
function simplificarDireccion(display_name: string) {
  // Ejemplo: "2934, Luis Reinaudi, San Eduardo, Río Cuarto, Municipio de Río Cuarto, Pedanía Río Cuarto, Departamento Río Cuarto, Córdoba, X5800, Argentina"
  // Queremos: "Luis Reinaudi 2934, Río Cuarto"
  const partes = display_name.split(",");
  if (partes.length < 4) return display_name;
  // Normalmente: [numeración, calle, barrio, ciudad, ...]
  const numeracion = partes[0].trim();
  const calle = partes[1].trim();
  const ciudad = partes[3].trim();
  return `${calle} ${numeracion}, ${ciudad}`;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Ingrese la dirección",
  label = "Dirección",
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const searchAddress = async (query: string) => {
    try {
      console.log('Buscando dirección:', query);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/geocode/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Accept-Language': 'es'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }
      
      const data = await response.json();
      console.log('Resultados de búsqueda:', data);
      return data;
    } catch (error) {
      console.error('Error al buscar dirección:', error);
      return [];
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onChange(value, '', ''); // Actualizar el valor del input

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      const results = await searchAddress(value);
      setSuggestions(results);
      setShowSuggestions(true);
      setIsLoading(false);
    }, 500);
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    onChange(simplificarDireccion(suggestion.display_name), suggestion.lat, suggestion.lon);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Input
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        endContent={isLoading ? (
          <div className="w-4 h-4 rounded-full border-b-2 border-gray-900 animate-spin" />
        ) : null}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="overflow-auto absolute z-50 mt-1 w-full max-h-60 bg-white rounded-md border border-gray-200 shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              role="option"
              aria-selected={false}
              className="px-4 py-2 w-full text-sm text-left cursor-pointer hover:bg-gray-100"
              onClick={() => handleSuggestionClick(suggestion)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSuggestionClick(suggestion);
                }
              }}
            >
              {simplificarDireccion(suggestion.display_name)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
