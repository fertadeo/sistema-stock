'use client'
import React, { useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Tooltip, Button, Tabs, Tab, Popover, PopoverTrigger, PopoverContent } from "@heroui/react"; // Ajusta el import según la versión de HeroUI/NextUI
import { FaDollarSign, FaMoneyBillWave, FaCheckCircle, FaUserPlus, FaInfoCircle } from 'react-icons/fa';
import '../../styles/globals.css'

const metricas = [
  {
    title: 'Monto $',
    icon: <FaDollarSign size={28} className="text-white" />,
    value: '$12.520,300',
    change: '+1.2%',
    changeType: 'up',
    subtext: '+$111,500 respecto al mes anterior',
    bgColor: 'bg-green-500',
  },
  {
    title: 'Gastos',
    icon: <FaMoneyBillWave size={28} className="text-white" />,
    value: '$32,800',
    change: '-3.1%',
    changeType: 'down',
    subtext: '-$1,050 respecto al mes anterior',
    bgColor: 'bg-red-400',
  },
  {
    title: 'Ventas concretadas',
    icon: <FaCheckCircle size={28} className="text-white" />,
    value: '47',
    change: '+5.4%',
    changeType: 'up',
    subtext: '+3 respecto al mes anterior',
    bgColor: 'bg-blue-500',
  },
  {
    title: 'Nuevos clientes',
    icon: <FaUserPlus size={28} className="text-white" />,
    value: '12',
    change: '+9.2%',
    changeType: 'up',
    subtext: '+1 respecto al mes anterior',
    bgColor: 'bg-purple-500',
  },
];

const leyendaObjetivo = [
  { color: 'bg-[#e6f7f4]', label: 'Monto bajo' },
  { color: 'bg-[#9ee6d9]', label: 'Monto medio' },
  { color: 'bg-[#18bca4]', label: 'Monto alto' },
  { color: 'bg-[#0d6b5c]', label: 'Monto máximo' },
];

const leyendaGastos = [
  { color: 'bg-red-50', label: 'Gasto bajo' },
  { color: 'bg-red-200', label: 'Gasto medio' },
  { color: 'bg-red-400', label: 'Gasto alto' },
  { color: 'bg-red-600', label: 'Gasto máximo' },
];

const horas = ['12-16h', '8-12h', '4-8h', '0-4h'];
const dias = Array.from({ length: 31 }, (_, i) => i + 1);

// Función para saber si un día es domingo o sábado (algunos sábados)
const isWeekend = (day: number) => {
  // Suponiendo que el mes empieza en lunes (ajusta si tu mes empieza en otro día)
  // 0: lunes, 5: sábado, 6: domingo
  const weekDay = (day + 0) % 7; // 0 = lunes, 6 = domingo
  // Excluye domingos y algunos sábados (por ejemplo, el 2do y 4to sábado del mes)
  const isSaturday = weekDay === 5;
  const isSunday = weekDay === 6;
  const isSomeSaturdays = isSaturday && ([2, 4].includes(Math.ceil(day / 7)));
  return isSunday || isSomeSaturdays;
};

// Generar datos para "Objetivo" (cashflow actual)
const dataObjetivo = horas.map((_, rowIdx) =>
  dias.map((day) => {
    if (isWeekend(day)) return null;
    // Simula un flujo variado, pero menos gasto al inicio
    if (day <= 5) return Math.floor(Math.random() * 2); // 0-1
    if (day <= 20) return Math.floor(Math.random() * 3); // 0-2
    return Math.floor(Math.random() * 2); // 0-1
  })
);

// Generar datos para "Gastos" (más gasto al inicio de mes)
const dataGastos = horas.map((_, rowIdx) =>
  dias.map((day) => {
    if (isWeekend(day)) return null;
    // Más gasto al inicio, menos al final
    if (day <= 5) return 2 + Math.floor(Math.random() * 2); // 2-3
    if (day <= 10) return 1 + Math.floor(Math.random() * 2); // 1-2
    if (day <= 20) return Math.floor(Math.random() * 2); // 0-1
    return Math.random() > 0.7 ? 1 : 0; // mayoría 0, algunos 1
  })
);

// Función para obtener un monto aleatorio según el nivel
const getMontoPorNivel = (nivel: number | null) => {
  if (nivel === null) return 0;
  if (nivel === 0) return Math.floor(Math.random() * (15999 - 1000 + 1)) + 1000;
  if (nivel === 1) return Math.floor(Math.random() * (49000 - 16000 + 1)) + 16000;
  if (nivel === 2) return Math.floor(Math.random() * (99000 - 49001 + 1)) + 49001;
  if (nivel === 3) return Math.floor(Math.random() * (200000 - 99001 + 1)) + 99001;
  return 0;
};

const Cashflow = () => {
  const [tab, setTab] = useState('objetivo');
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);

  const leyenda = tab === 'objetivo' ? leyendaObjetivo : leyendaGastos;
  const data = tab === 'objetivo' ? dataObjetivo : dataGastos;

  return (
    <Card className=" mr-2 ml-0 w-[100%]">
      <CardHeader className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <span className="text-lg font-semibold">Resumen de flujo diario</span>
          <Tooltip content="Resumen de ingresos y egresos diarios">
            <span>
              <FaInfoCircle className="text-gray-400" />
            </span>
          </Tooltip>
        </div>
        <Tabs
          selectedKey={tab}
          onSelectionChange={(key) => setTab(String(key))}
          variant="solid"
          aria-label="Cashflow Tabs"
          classNames={{
            tabList: "bg-gray-100",
            tab: "data-[selected=true]:!bg-[#18bca4] data-[selected=true]:!text-white !rounded-lg",
          }}
        >
          <Tab key="objetivo" title="Ingreso" />
          <Tab key="gastos" title="Gastos" />
        </Tabs>
      </CardHeader>
      <CardBody>
        {/* Leyenda */}
        <div className="flex gap-4 mb-4">
          {leyenda.map((l, i) => (
            <div key={i} className="flex gap-1 items-center">
              <div className={`w-4 h-4 rounded ${l.color}`} />
              <span className="text-xs text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
        {/* Grid */}
        <div className="overflow-x-auto">
          <div className="flex">
            {/* Eje Y */}
            <div className="flex flex-col justify-between mr-2">
              {horas.map((h, i) => (
                <div key={i} className="flex items-center h-6 text-xs text-gray-500" style={{ height: 32 }}>{h}</div>
              ))}
            </div>
            {/* Grid de días */}
            <div>
              <div className="flex gap-1 mb-1">
                {dias.map((d) => (
                  <div key={d} className="w-6 text-xs text-center text-gray-400">{d}</div>
                ))}
              </div>
              <div>
                {data.map((row, i) => (
                  <div key={i} className="flex gap-1 mb-1">
                    {row.map((cell, j) => {
                      if (cell === null) {
                        return (
                          <div
                            key={j}
                            className="w-6 h-6 bg-gray-200 rounded border border-gray-100 opacity-50"
                          />
                        );
                      }
                      const isSelected = selected && selected.row === i && selected.col === j;
                      const isDimmed = selected && !isSelected;
                      // Generar monto aleatorio para mostrar en el popover
                      const monto = getMontoPorNivel(cell);
                      return (
                        <Popover
                          key={j}
                          placement="top"
                          isOpen={!!isSelected}
                          onOpenChange={(open) => {
                            if (!open) setSelected(null);
                          }}
                        >
                          <PopoverTrigger>
                            <div
                              role="button"
                              tabIndex={0}
                              className={`w-6 h-6 rounded cursor-pointer border border-gray-100 ${leyenda[cell].color} transition-opacity duration-200 ${isSelected ? "opacity-100 ring-2 ring-[#14b8a6]" : isDimmed ? "opacity-40" : "opacity-100"}`}
                              onClick={() => setSelected(isSelected ? null : { row: i, col: j })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  setSelected(isSelected ? null : { row: i, col: j });
                                }
                              }}
                            />
                          </PopoverTrigger>
                          <PopoverContent>
                            <div className="p-2 text-center">
                              <div className="font-semibold">Día {dias[j]}</div>
                              <div>Hora: {horas[i]}</div>
                              <div>
                                Monto: <span className="font-bold">${monto.toLocaleString()}</span>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const Page = () => {
  const [tab, setTab] = useState("kpis");

  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-semibold">Métricas generales</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metricas.map((m, idx) => (
          <Card key={idx} className="shadow-md">
            <CardHeader className="flex gap-3 items-center">
              <div className={`w-11 h-11 flex items-center justify-center rounded-lg ${m.bgColor}`}>
                {m.icon}
              </div>
              <span className="text-lg font-medium">{m.title}</span>
            </CardHeader>
            <CardBody>
              <div className="text-2xl font-bold">{m.value}</div>
              <div className="flex gap-2 items-center mt-2">
                <span className={`text-sm font-semibold ${m.changeType === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                  {m.change}
                </span>
                <span className="text-xs text-gray-500">{m.subtext}</span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="flex w-full min-h-[500px]">
        <div className="mt-8 mr-2 ml-0 w-[62%] h-full min-h-[500px]">
          <Cashflow />
        </div>
        <Card className="mt-8 ml-2 w-[36%] relative h-full min-h-[250px]">
          {/* Botón en la esquina superior derecha */}
          <button
            className="absolute top-4 right-4 p-2 rounded-full transition hover:bg-[#14b8a6] group"
            aria-label="Ver gráficos"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-teal-600 transition group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
              />
            </svg>
          </button>
          <CardHeader>
            <span className="text-lg font-semibold">Resumen de ventas</span>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="flex gap-2 items-center">
                    <span className="text-xl">💧</span>
                    <span className="font-medium">Agua sin gas:</span>
                  </span>
                  <div className="flex gap-2 items-center">
                    <span className="font-bold">1200 L</span>
                    <div className="flex gap-1 items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="text-green-600 size-5">
                        <path fillRule="evenodd" d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-600">+12%</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex gap-2 items-center">
                    <span className="text-xl">💨</span>
                    <span className="font-medium">Soda:</span>
                  </span>
                  <div className="flex gap-2 items-center">
                    <span className="font-bold">900 L</span>
                    <div className="flex gap-1 items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="text-red-600 size-5">
                        <path fillRule="evenodd" d="M10.53 13.53a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 1 1 1.06-1.06L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-600">-4%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Repartidor con mayor crecimiento los últimos 30 días:</span>
                    <div className="flex gap-2 items-center">
                      <span className="text-base font-bold text-teal-800">Axel Torres</span>
                      <div className="flex gap-1 items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="text-green-600 size-5">
                          <path fillRule="evenodd" d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-600">+15%</span>
                      </div>
                      <div className="mt-1 text-gray-600 text-m">
                      Nuevos clientes: <span className="font-semibold text-teal-600">+4</span>
                    </div>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Revendedor con mayor monto los ultimos 30 dias:</span>
                    <div className="flex gap-2 items-center">
                      <span className="text-base font-bold text-teal-800">Carlos Mendoza</span>
                      <span className="text-base font-bold text-teal-600">$450,800</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Page;