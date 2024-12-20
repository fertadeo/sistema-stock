import React from 'react';

interface AlertProps {
  type?: 'error' | 'warning' | 'success' | 'primary';
  title?: string;
  message: string;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ 
  type = 'primary', 
  title, 
  message, 
  onClose 
}) => {
  const styles = {
    error: 'text-red-700 bg-red-200 border-red-500',
    warning: 'text-yellow-700 bg-yellow-200 border-yellow-500',
    success: 'text-green-700 bg-green-200 border-green-500',
    primary: 'text-teal-700 bg-teal-200 border-teal-500'
  };

  return (
    <div
      className={`relative px-4 py-3 bg-opacity-30 rounded border border-opacity-30 ${styles[type]}`}
      role="alert"
    >
      {title && <strong className="font-bold">{title}<br /></strong>}
      <span className="block sm:inline">{message}</span>
      {onClose && (
        <span className="absolute top-0 right-0 bottom-0 px-4 py-3">
          <svg
            className={`w-6 h-6 fill-current ${
              type === 'error' ? 'text-red-500' :
              type === 'warning' ? 'text-yellow-500' :
              type === 'success' ? 'text-green-500' :
              'text-teal-500'
            }`}
            role="button"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            onClick={onClose}
          >
            <title>Close</title>
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
          </svg>
        </span>
      )}
    </div>
  );
};

export default Alert;