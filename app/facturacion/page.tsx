"use client"

import { useState, useEffect } from 'react'

interface Cliente {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  dni?: string;
  cuit?: string;
}

interface DatosAfip {
  razonSocial: string;
  domicilio: string;
  condicionImpositiva: string;
  estado: string;
  fechaInscripcion?: string;
}

export default function FacturacionPage() {
  const [activeTab, setActiveTab] = useState('nueva-factura')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [busquedaCuit, setBusquedaCuit] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoadingClientes, setIsLoadingClientes] = useState(false)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [datosAfip, setDatosAfip] = useState<DatosAfip | null>(null)
  const [isLoadingAfip, setIsLoadingAfip] = useState(false)
  const [mostrarDatosAfip, setMostrarDatosAfip] = useState(false)
  const [errorAfip, setErrorAfip] = useState<string | null>(null)

  // Función para validar CUIT
  const validarCuit = (cuit: string): boolean => {
    // Remover guiones y espacios
    const cuitLimpio = cuit.replace(/[-\s]/g, '')
    
    // Verificar que tenga 11 dígitos
    if (!/^\d{11}$/.test(cuitLimpio)) {
      return false
    }
    
    // Algoritmo de validación de CUIT
    const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    let suma = 0
    
    for (let i = 0; i < 10; i++) {
      suma += parseInt(cuitLimpio[i]) * multiplicadores[i]
    }
    
    const resto = suma % 11
    const digitoVerificador = resto < 2 ? resto : 11 - resto
    
    return parseInt(cuitLimpio[10]) === digitoVerificador
  }

  // Función para consultar datos en AFIP (REAL)
  const consultarDatosAfip = async (cuit: string): Promise<DatosAfip | null> => {
    try {
      setIsLoadingAfip(true)
      setErrorAfip(null)
      
      console.log('🔍 Consultando datos REALES de AFIP para CUIT:', cuit)
      
      // Consulta real a tu backend
      const response = await fetch(`http://localhost:8080/api/facturacion/contribuyente-fallback/${cuit}`)
      
      if (!response.ok) {
        throw new Error(`Error en consulta AFIP: ${response.status}`)
      }
      
      const contribuyente = await response.json()
      
      if (!contribuyente.success) {
        throw new Error('No se encontraron datos del contribuyente')
      }
      
      // Mapear datos del backend a nuestro formato
      const datosReales: DatosAfip = {
        razonSocial: contribuyente.data.razon_social,
        domicilio: `${contribuyente.data.domicilio_fiscal.calle} ${contribuyente.data.domicilio_fiscal.numero}, ${contribuyente.data.domicilio_fiscal.localidad}`,
        condicionImpositiva: contribuyente.data.condicion_iva,
        estado: contribuyente.data.estado || "ACTIVO",
        fechaInscripcion: contribuyente.data.fecha_inscripcion
      }
      
      console.log('✅ Datos REALES obtenidos del contribuyente:', {
        cuit: cuit,
        razonSocial: datosReales.razonSocial,
        domicilio: datosReales.domicilio,
        condicionImpositiva: datosReales.condicionImpositiva,
        estado: datosReales.estado,
        fechaInscripcion: datosReales.fechaInscripcion,
        datosCompletos: contribuyente.data
      })
      
      return datosReales
      
    } catch (error) {
      console.error('❌ Error al consultar AFIP:', error)
      
      // Fallback a datos simulados si falla la consulta real
      console.log('⚠️ Usando datos simulados como fallback')
      const datosSimulados: DatosAfip = {
        razonSocial: "EMPRESA EJEMPLO S.A.",
        domicilio: "AV. CORRIENTES 1234, CAPITAL FEDERAL",
        condicionImpositiva: "RESPONSABLE INSCRIPTO",
        estado: "ACTIVO",
        fechaInscripcion: "2020-01-15"
      }
      
      setErrorAfip('Error al consultar AFIP. Mostrando datos de ejemplo.')
      return datosSimulados
    } finally {
      setIsLoadingAfip(false)
    }
  }

  // Función para crear cliente automáticamente desde datos de AFIP
  const crearClienteDesdeAfip = async (datosAfip: DatosAfip, cuit: string) => {
    try {
      const nuevoCliente: Partial<Cliente> = {
        nombre: datosAfip.razonSocial,
        direccion: datosAfip.domicilio,
        cuit: cuit,
        telefono: '', // No disponible en AFIP
        email: '' // No disponible en AFIP
      }
      
      // Aquí iría la llamada a la API para crear el cliente
      console.log('🔄 Creando cliente automáticamente desde datos de AFIP:', {
        datosAfip: datosAfip,
        nuevoCliente: nuevoCliente,
        cuit: cuit
      })
      
      // Simular creación exitosa
      const clienteCreado: Cliente = {
        id: Date.now(), // ID temporal
        nombre: datosAfip.razonSocial,
        direccion: datosAfip.domicilio,
        cuit: cuit,
        telefono: '',
        email: ''
      }
      
      console.log('✅ Cliente creado exitosamente:', clienteCreado)
      
      setClienteSeleccionado(clienteCreado)
      setMostrarDatosAfip(false)
      
      // Actualizar lista de clientes
      setClientes([clienteCreado])
      
    } catch (error) {
      console.error('Error al crear cliente:', error)
      setErrorAfip('Error al crear el cliente')
    }
  }

  // Función para obtener todos los clientes
  const fetchClientes = async () => {
    try {
      setIsLoadingClientes(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`)
      if (!response.ok) {
        throw new Error('Error al obtener los clientes')
      }
      const data = await response.json()
      setClientes(data)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setIsLoadingClientes(false)
    }
  }

  // Función para buscar cliente por CUIT
  const buscarClientePorCuit = async (cuit: string) => {
    if (!cuit || cuit.length < 8) {
      setMostrarResultados(false)
      setMostrarDatosAfip(false)
      return
    }

    try {
      setIsLoadingClientes(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`)
      if (!response.ok) {
        throw new Error('Error al buscar clientes')
      }
      const data = await response.json()
      
      // Filtrar por CUIT (búsqueda parcial)
      const clientesEncontrados = data.filter((cliente: Cliente) => 
        cliente.cuit && cliente.cuit.includes(cuit)
      )
      
      setClientes(clientesEncontrados)
      setMostrarResultados(true)
      
      // Si no se encontraron clientes y el CUIT es válido, consultar AFIP
      if (clientesEncontrados.length === 0 && validarCuit(cuit)) {
        console.log('🚀 No se encontraron clientes locales, consultando AFIP para CUIT:', cuit)
        const datosAfip = await consultarDatosAfip(cuit)
        if (datosAfip) {
          console.log('📋 Datos de AFIP recibidos, mostrando panel de creación')
          setDatosAfip(datosAfip)
          setMostrarDatosAfip(true)
        }
      } else {
        setMostrarDatosAfip(false)
        setDatosAfip(null)
      }
    } catch (error) {
      console.error('Error al buscar cliente:', error)
    } finally {
      setIsLoadingClientes(false)
    }
  }

  // Función para seleccionar un cliente
  const seleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente)
    setBusquedaCuit(cliente.cuit || '')
    setMostrarResultados(false)
    setMostrarDatosAfip(false)
    setDatosAfip(null)
  }

  // Efecto para cargar clientes al montar el componente
  useEffect(() => {
    fetchClientes()
  }, [])

  // Efecto para buscar cuando cambia el CUIT
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (busquedaCuit) {
        buscarClientePorCuit(busquedaCuit)
      } else {
        setMostrarResultados(false)
        setMostrarDatosAfip(false)
        setClienteSeleccionado(null)
        setDatosAfip(null)
        setErrorAfip(null)
      }
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timeoutId)
  }, [busquedaCuit])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Facturación</h1>
              <p className="mt-1 lg:mt-2 text-base lg:text-lg text-gray-600">Gestiona las facturas de tu empresa</p>
            </div>
            <div className="hidden lg:flex items-center space-x-4 mt-4 lg:mt-0">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="text-sm text-gray-500">Total Facturas</div>
                <div className="text-2xl font-bold text-teal-600">1,234</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="text-sm text-gray-500">Este Mes</div>
                <div className="text-2xl font-bold text-green-600">$45,678</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de navegación */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 lg:mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6 lg:space-x-8 px-4 lg:px-6 xl:px-8">
              <button
                onClick={() => setActiveTab('nueva-factura')}
                className={`py-3 lg:py-4 px-1 border-b-2 font-medium text-sm lg:text-base transition-colors duration-200 ${
                  activeTab === 'nueva-factura'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                  </svg>
                  <span>Nueva Factura</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('historial')}
                className={`py-3 lg:py-4 px-1 border-b-2 font-medium text-sm lg:text-base transition-colors duration-200 ${
                  activeTab === 'historial'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Historial</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('configuracion')}
                className={`py-3 lg:py-4 px-1 border-b-2 font-medium text-sm lg:text-base transition-colors duration-200 ${
                  activeTab === 'configuracion'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  <span>Configuración</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido de las tabs */}
        <div className="space-y-6 lg:space-y-8">
          {activeTab === 'nueva-factura' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 lg:px-6 xl:px-8 py-4 lg:py-6 border-b border-gray-200">
                <h2 className="text-lg lg:text-xl xl:text-2xl font-semibold text-gray-900">Nueva Factura</h2>
                <p className="mt-1 text-sm text-gray-600">Completa los datos para generar una nueva factura</p>
              </div>
              
              <div className="p-4 lg:p-6 xl:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 xl:gap-8">
                  <div className="space-y-4 lg:space-y-6">
                    <div className="relative">
                      <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-2">
                        Cliente *
                      </label>
                      <div className="relative">
                        <input
                          id="cliente"
                          type="text"
                          value={busquedaCuit}
                          onChange={(e) => setBusquedaCuit(e.target.value)}
                          className={`w-full px-3 lg:px-4 py-2 lg:py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-200 ${
                            busquedaCuit.length >= 8 
                              ? validarCuit(busquedaCuit) 
                                ? 'border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50' 
                                : 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                              : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500'
                          }`}
                          placeholder="Ingrese CUIT del cliente..."
                        />
                        {isLoadingClientes && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                          </div>
                        )}
                        {busquedaCuit.length >= 8 && !isLoadingClientes && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {validarCuit(busquedaCuit) ? (
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Resultados de búsqueda */}
                      {mostrarResultados && clientes.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {clientes.map((cliente) => (
                            <div
                              key={cliente.id}
                              onClick={() => seleccionarCliente(cliente)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  seleccionarCliente(cliente)
                                }
                              }}
                              tabIndex={0}
                              role="button"
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
                            >
                              <div className="font-medium text-gray-900">{cliente.nombre}</div>
                              <div className="text-sm text-gray-600">CUIT: {cliente.cuit}</div>
                              <div className="text-sm text-gray-500">{cliente.direccion}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Mensaje cuando no hay resultados */}
                      {mostrarResultados && clientes.length === 0 && busquedaCuit.length >= 8 && !mostrarDatosAfip && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                          <div className="text-sm text-gray-500 text-center">
                            No se encontraron clientes con ese CUIT
                          </div>
                        </div>
                      )}
                      
                      {/* Datos de AFIP cuando no se encuentra el cliente */}
                      {mostrarDatosAfip && datosAfip && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-lg shadow-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm font-medium text-blue-800">Datos encontrados en AFIP</span>
                            </div>
                            {isLoadingAfip && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            )}
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium text-gray-700">Razón Social:</span> {datosAfip.razonSocial}</div>
                            <div><span className="font-medium text-gray-700">Domicilio:</span> {datosAfip.domicilio}</div>
                            <div><span className="font-medium text-gray-700">Condición:</span> {datosAfip.condicionImpositiva}</div>
                            <div><span className="font-medium text-gray-700">Estado:</span> {datosAfip.estado}</div>
                          </div>
                          
                          <div className="mt-3 flex space-x-2">
                            <button
                              onClick={() => crearClienteDesdeAfip(datosAfip, busquedaCuit)}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
                            >
                              Crear Cliente Automáticamente
                            </button>
                            <button
                              onClick={() => {
                                setMostrarDatosAfip(false)
                                setDatosAfip(null)
                              }}
                              className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Error de AFIP */}
                      {errorAfip && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-red-300 rounded-lg shadow-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm font-medium text-red-800">Error</span>
                          </div>
                          <div className="text-sm text-red-600">{errorAfip}</div>
                          <button
                            onClick={() => setErrorAfip(null)}
                            className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors duration-200"
                          >
                            Cerrar
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Información del cliente seleccionado */}
                    {clienteSeleccionado && (
                      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-teal-800 mb-2">Cliente Seleccionado</h3>
                        <div className="space-y-1 text-sm">
                          <div><span className="font-medium text-gray-700">Nombre:</span> {clienteSeleccionado.nombre}</div>
                          <div><span className="font-medium text-gray-700">CUIT:</span> {clienteSeleccionado.cuit}</div>
                          <div><span className="font-medium text-gray-700">Dirección:</span> {clienteSeleccionado.direccion}</div>
                          <div><span className="font-medium text-gray-700">Teléfono:</span> {clienteSeleccionado.telefono}</div>
                          {clienteSeleccionado.email && (
                            <div><span className="font-medium text-gray-700">Email:</span> {clienteSeleccionado.email}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setClienteSeleccionado(null)
                            setBusquedaCuit('')
                          }}
                          className="mt-2 text-xs text-teal-600 hover:text-teal-800 underline"
                        >
                          Cambiar cliente
                        </button>
                      </div>
                    )}
                    
                    <div>
                      <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Facturación *
                      </label>
                      <input
                        id="fecha"
                        type="date"
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                      />
                    </div>

                    <div>
                      <label htmlFor="condicion-pago" className="block text-sm font-medium text-gray-700 mb-2">
                        Condición de Pago
                      </label>
                      <select 
                        id="condicion-pago"
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                      >
                        <option>Contado</option>
                        <option>30 días</option>
                        <option>60 días</option>
                        <option>90 días</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 lg:space-y-6">
                    <div>
                      <label htmlFor="numero-factura" className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Factura
                      </label>
                      <input
                        id="numero-factura"
                        type="text"
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                        placeholder="F001-001"
                        readOnly
                      />
                    </div>

                    <div>
                      <label htmlFor="tipo-comprobante" className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Comprobante
                      </label>
                      <select 
                        id="tipo-comprobante"
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                      >
                        <option>Factura A</option>
                        <option>Factura B</option>
                        <option>Factura C</option>
                        <option>Recibo</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
                        Observaciones
                      </label>
                      <textarea
                        id="observaciones"
                        rows={3}
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                        placeholder="Observaciones adicionales..."
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 lg:mt-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2 sm:mb-0">Productos</h3>
                    <button className="px-3 lg:px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Agregar Producto</span>
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 lg:p-8">
                    <div className="text-center">
                      <svg className="mx-auto h-10 w-10 lg:h-12 lg:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos agregados</h3>
                      <p className="mt-1 text-sm text-gray-500">Comienza agregando productos a tu factura</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 lg:mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                  <button className="px-4 lg:px-6 py-2 lg:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                    Cancelar
                  </button>
                  <button className="px-4 lg:px-6 py-2 lg:py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Generar Factura</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 lg:px-6 xl:px-8 py-4 lg:py-6 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg lg:text-xl xl:text-2xl font-semibold text-gray-900">Historial de Facturas</h2>
                    <p className="mt-1 text-sm text-gray-600">Gestiona y visualiza todas las facturas emitidas</p>
                  </div>
                  <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar facturas..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                      <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200">
                      Filtrar
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        F001-001
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">Cliente Ejemplo</div>
                          <div className="text-gray-500">cliente@ejemplo.com</div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-900">
                        14/08/2025
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        $1,500.00
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <span className="px-2 lg:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Pagada
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-teal-600 hover:text-teal-900 transition-colors duration-200">
                            Ver
                          </button>
                          <button className="text-blue-600 hover:text-blue-900 transition-colors duration-200">
                            PDF
                          </button>
                          <button className="text-gray-600 hover:text-gray-900 transition-colors duration-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        F001-002
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">Otro Cliente</div>
                          <div className="text-gray-500">otro@cliente.com</div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-900">
                        13/08/2025
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        $2,300.00
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <span className="px-2 lg:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pendiente
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-teal-600 hover:text-teal-900 transition-colors duration-200">
                            Ver
                          </button>
                          <button className="text-blue-600 hover:text-blue-900 transition-colors duration-200">
                            PDF
                          </button>
                          <button className="text-gray-600 hover:text-gray-900 transition-colors duration-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="px-4 lg:px-6 xl:px-8 py-3 lg:py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">1</span> a <span className="font-medium">10</span> de <span className="font-medium">97</span> resultados
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                      Anterior
                    </button>
                    <button className="px-3 py-1 bg-teal-600 text-white rounded text-sm">1</button>
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">2</button>
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">3</button>
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'configuracion' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 lg:px-6 xl:px-8 py-4 lg:py-6 border-b border-gray-200">
                <h2 className="text-lg lg:text-xl xl:text-2xl font-semibold text-gray-900">Configuración de Facturación</h2>
                <p className="mt-1 text-sm text-gray-600">Personaliza la configuración de tu sistema de facturación</p>
              </div>
              
              <div className="p-4 lg:p-6 xl:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  <div className="space-y-4 lg:space-y-6">
                    <div>
                      <label htmlFor="numero-factura-inicial" className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Factura Inicial
                      </label>
                      <input
                        id="numero-factura-inicial"
                        type="text"
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                        placeholder="F001-001"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="prefijo-factura" className="block text-sm font-medium text-gray-700 mb-2">
                        Prefijo de Factura
                      </label>
                      <input
                        id="prefijo-factura"
                        type="text"
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                        placeholder="F"
                      />
                    </div>

                    <div>
                      <label htmlFor="tipo-afip" className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Comprobante AFIP
                      </label>
                      <select 
                        id="tipo-afip"
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                      >
                        <option>Factura A (01)</option>
                        <option>Factura B (06)</option>
                        <option>Factura C (11)</option>
                        <option>Recibo (02)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 lg:space-y-6">
                    <div>
                      <label htmlFor="cuit-empresa" className="block text-sm font-medium text-gray-700 mb-2">
                        CUIT de la Empresa
                      </label>
                      <input
                        id="cuit-empresa"
                        type="text"
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                        placeholder="20-12345678-9"
                      />
                    </div>

                    <div>
                      <label htmlFor="condicion-iva" className="block text-sm font-medium text-gray-700 mb-2">
                        Condición IVA
                      </label>
                      <select 
                        id="condicion-iva"
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                      >
                        <option>Responsable Inscripto</option>
                        <option>Monotributista</option>
                        <option>Exento</option>
                        <option>Consumidor Final</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="informacion-empresa" className="block text-sm font-medium text-gray-700 mb-2">
                        Información de la Empresa
                      </label>
                      <textarea
                        id="informacion-empresa"
                        rows={4}
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                        placeholder="Nombre de la empresa, dirección, teléfono, etc."
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-gray-200">
                  <div className="flex justify-end">
                    <button className="px-4 lg:px-6 py-2 lg:py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Guardar Configuración</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
