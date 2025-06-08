'use client'
import React, { useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Tooltip, Button, Tabs, Tab, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import '../../styles/globals.css'

const metricas = [
  {
    title: 'Monto $',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="size-6">
        <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" />
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z" clipRule="evenodd" />
      </svg>
    ),
    value: '$12.520,300',
    change: '+1.2%',
    changeType: 'up',
    subtext: '+$111,500 respecto al mes anterior',
    bgColor: 'bg-green-500',
  },
  {
    title: 'Gastos',
    icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="size-6">
      <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
      <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z"
       clipRule="evenodd" />
      <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
    </svg>
    
    ),
    value: '$32,800',
    change: '-3.1%',
    changeType: 'down',
    subtext: '-$1,050 respecto al mes anterior',
    bgColor: 'bg-red-400',
  },
  {
    title: 'Ventas concretadas',
    icon:(<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="size-6">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
       clipRule="evenodd" />
    </svg>
    ),
    value: '47',
    change: '+5.4%',
    changeType: 'up',
    subtext: '+3 respecto al mes anterior',
    bgColor: 'bg-blue-500',
  },
  {
    title: 'Nuevos clientes',
    icon: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="size-6">
      <path d="M5.25 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM2.25 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM18.75 7.5a.75.75 0 0 0-1.5 0v2.25H15a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25H21a.75.75 0 0 0 0-1.5h-2.25V7.5Z" />
    </svg>
    ),
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