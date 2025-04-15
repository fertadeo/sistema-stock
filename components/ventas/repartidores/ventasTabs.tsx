import React, { useState } from 'react';
import { Tabs, Tab } from "@heroui/react";
import TableProcesos from './tableprocesos';
import TableVentasCerradas from './tableVentasCerradas';
import { Proceso } from '@/types/ventas';

interface VentasTabsProps {
  procesosPendientes: Proceso[];
  loading: boolean;
  onSelectProceso: (proceso: Proceso | null) => void;
  setModalAbierto: (isOpen: boolean) => void;
  repartidorId: string;
}

const VentasTabs: React.FC<VentasTabsProps> = ({
  procesosPendientes,
  loading,
  onSelectProceso,
  setModalAbierto,
  repartidorId
}) => {
  const [selectedTab, setSelectedTab] = useState("pendientes");

  return (
    <div className="w-full">
      <Tabs 
        selectedKey={selectedTab} 
        onSelectionChange={(key) => setSelectedTab(key.toString())}
        className="mb-4"
      >
        <Tab key="pendientes" title="Descargas por Revisar">
          <TableProcesos
            procesosFiltrados={procesosPendientes}
            loading={loading}
            onSelectProceso={onSelectProceso}
            setModalAbierto={setModalAbierto}
          />
        </Tab>
        <Tab key="cerradas" title="Ventas por cobrar">
          <TableVentasCerradas repartidorId={repartidorId} ventasCerradas={[]} loading={false} />
        </Tab>
      </Tabs>
    </div>
  );
};

export default VentasTabs;
