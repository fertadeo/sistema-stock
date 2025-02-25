// src/components/EditableField.tsx
"use client";

import React, { useState } from "react";
import { Input } from "@heroui/react";

type EditableFieldProps = {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  isEditable?: boolean;
  type?: string; // Para especificar el tipo de input
};

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onChange,
  isEditable = true,
  type = "text", // Por defecto, tipo texto
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === "number" ? Number(e.target.value) : e.target.value;
    onChange(newValue);
  };

  return (
    <div style={{ position: "relative", marginBottom: "15px" }}>
      <Input
        label={label}
        value={String(value)} // Convertimos a string para evitar errores de tipo
        readOnly={!isEditing}
        onChange={handleInputChange}
        type={type} // Tipo de input
      />
      {isEditable && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          style={{
            position: "absolute",
            right: "10px",
            top: "35px",
            cursor: "pointer",
            fill: isEditing ? "green" : "gray",
          }}
          onClick={() => setIsEditing(!isEditing)}
        >
          <path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z" />
        </svg>
      )}
    </div>
  );
};

export default EditableField;
