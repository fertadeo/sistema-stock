'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

type RepartidorUiContextValue = {
  enOperacion: boolean;
  modalOperacionAbierto: boolean;
  navInferiorVisible: boolean;
  iniciarOperacion: () => void;
  finalizarOperacion: () => void;
  setModalOperacionAbierto: (abierto: boolean) => void;
  registrarScrollOperacion: (scrollTop: number) => void;
};

const RepartidorUiContext = createContext<RepartidorUiContextValue | null>(null);

export function RepartidorUiProvider({ children }: { children: React.ReactNode }) {
  const [enOperacion, setEnOperacion] = useState(false);
  const [modalOperacionAbierto, setModalOperacionAbierto] = useState(false);
  const [navInferiorVisible, setNavInferiorVisible] = useState(true);
  const ultimoScrollRef = useRef(0);

  const iniciarOperacion = useCallback(() => {
    setEnOperacion(true);
    setNavInferiorVisible(false);
    ultimoScrollRef.current = 0;
  }, []);

  const finalizarOperacion = useCallback(() => {
    setEnOperacion(false);
    setModalOperacionAbierto(false);
    setNavInferiorVisible(true);
    ultimoScrollRef.current = 0;
  }, []);

  const registrarScrollOperacion = useCallback((scrollTop: number) => {
    if (modalOperacionAbierto) return;

    const anterior = ultimoScrollRef.current;
    const delta = scrollTop - anterior;

    if (scrollTop <= 12) {
      setNavInferiorVisible(false);
    } else if (delta < -10) {
      setNavInferiorVisible(true);
    } else if (delta > 16 && scrollTop > 48) {
      setNavInferiorVisible(false);
    }

    ultimoScrollRef.current = scrollTop;
  }, [modalOperacionAbierto]);

  const value = useMemo(
    () => ({
      enOperacion,
      modalOperacionAbierto,
      navInferiorVisible,
      iniciarOperacion,
      finalizarOperacion,
      setModalOperacionAbierto,
      registrarScrollOperacion,
    }),
    [
      enOperacion,
      modalOperacionAbierto,
      navInferiorVisible,
      iniciarOperacion,
      finalizarOperacion,
      registrarScrollOperacion,
    ]
  );

  return (
    <RepartidorUiContext.Provider value={value}>{children}</RepartidorUiContext.Provider>
  );
}

export function useRepartidorUi() {
  const ctx = useContext(RepartidorUiContext);
  if (!ctx) {
    throw new Error('useRepartidorUi debe usarse dentro de RepartidorUiProvider');
  }
  return ctx;
}

/** Hook seguro cuando el componente puede renderizarse fuera del módulo repartidor. */
export function useRepartidorUiOpcional() {
  return useContext(RepartidorUiContext);
}
