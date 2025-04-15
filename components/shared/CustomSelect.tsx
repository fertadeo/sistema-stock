import React, { useState, useRef, useEffect } from 'react';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecciona una opción',
  className = '',
  color = 'secondary'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Cerrar el select cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getColorClasses = () => {
    switch (color) {
      case 'primary':
        return 'bg-primary-50 text-primary-600 border-primary-200 hover:bg-primary-100';
      case 'secondary':
        return 'bg-secondary-50 text-secondary-600 border-secondary-200 hover:bg-secondary-100';
      case 'success':
        return 'bg-success-50 text-success-600 border-success-200 hover:bg-success-100';
      case 'warning':
        return 'bg-warning-50 text-warning-600 border-warning-200 hover:bg-warning-100';
      case 'danger':
        return 'bg-danger-50 text-danger-600 border-danger-200 hover:bg-danger-100';
      default:
        return 'bg-default-50 text-default-600 border-default-200 hover:bg-default-100';
    }
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        className={`px-3 py-2 w-full text-left rounded-lg border transition-colors ${getColorClasses()}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption ? selectedOption.label : placeholder}
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${
                value === option.value ? 'bg-gray-100' : ''
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect; 