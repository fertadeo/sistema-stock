// src/components/EditableField.tsx
"use client";

import React, { useState } from "react";
import { Input } from "@heroui/react";
import { formatMonto, precioInputValue } from "@/lib/formatMonto";

type EditableFieldProps = {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  isEditable?: boolean;
  type?: string;
};

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onChange,
  isEditable = true,
  type = "text",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const isPrice = type === "number";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPrice) {
      const raw = e.target.value.replace(/[^\d]/g, "");
      onChange(raw === "" ? 0 : Number(raw));
      return;
    }
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isPrice) return;
    // Evita que ↑/↓ cambien el valor; Enter confirma la edición
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
    }
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      setIsEditing(false);
    }
  };

  const displayValue = isPrice && !isEditing
    ? formatMonto(Number(value) || 0)
    : isPrice
      ? precioInputValue(value)
      : String(value);

  return (
    <div style={{ position: "relative", marginBottom: "15px" }}>
      <Input
        label={label}
        value={displayValue}
        readOnly={!isEditing}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          if (isEditing && isPrice) e.target.select();
        }}
        onWheel={(e) => {
          if (isPrice) (e.target as HTMLInputElement).blur();
        }}
        type={isPrice ? "text" : type}
        inputMode={isPrice ? "numeric" : undefined}
        startContent={
          isPrice && isEditing ? (
            <span className="text-default-400 text-small">$</span>
          ) : undefined
        }
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
