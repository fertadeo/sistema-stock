import '../styles/globals.css';
import React, { useState, useCallback, useEffect } from "react";
import { Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, useDisclosure, Pagination, Button, User, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from "@heroui/react";
import ModalToTable from "@/components/modalToTable";
import NuevoClienteModal from "@/components/nuevoClienteModal";
import ModalConfirmation from "@/components/modalConfirmation";
import { EyeIcon } from "@/components/utils/eyeIcon";
import { EditIcon } from "@/components/utils/editIcon";
import { DeleteIcon } from "@/components/utils/deleteIcon";
import EditarComponent from "@/components/editarComponent"
import Alert from "@/components/shared/alert";
import zonas from "@/components/soderia-data/zonas.json";
import repartidoresData from "@/components/soderia-data/repartidores.json";
import diasRepartoData from "@/components/soderia-data/diareparto.json";

type EnvasePrestado = {
  producto_id: number;
  cantidad: number;
  nombre_producto: string;
  producto_nombre?: string;
};

type User = {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  zona: string;
  dni: string;
  repartidor: string;
  dia_reparto: string;
  envases_prestados: EnvasePrestado[];
};

interface Props {
  initialUsers: User[];
}


const ClientesTable: React.FC<Props> = ({ initialUsers }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isNuevoClienteModalOpen, setIsNuevoClienteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editarModal, setEditarModal] = useState(false);
  const itemsPerPage = 10;
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"error" | "success">("success");
  
  // Nuevos estados para los filtros
  const [filtroDiaReparto, setFiltroDiaReparto] = useState("");
  const [filtroRepartidor, setFiltroRepartidor] = useState("");
  const [filtroZona, setFiltroZona] = useState("");

  const columns = [
    { uid: "name", name: "Nombre" },
    { uid: "telefono", name: "Teléfono" },
    { uid: "direccion", name: "Dirección" },
    { uid: "zona", name: "Zona" },
    { uid: "repartidor", name: "Repartidor" },
    { uid: "diaReparto", name: "Día de Reparto" },
    { uid: "envasesPrestados", name: "Envases prestados" },
    { uid: "actions", name: "Acciones" }
  ];

  const handleEditarModal = (user: User) => {
    setEditarModal(true);
    setSelectedUser(user);
    // console.log('User seleccionado', user)
  };

  const handleSave = async () => {
    await fetchClientes();
  };

  const handleCloseEditarModal = () => {
    setEditarModal(false)
  }


  const handleOpenModal = (user: User) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleNuevoClienteModalOpen = () => {
    console.log("Abriendo modal de nuevo cliente");
    setIsNuevoClienteModalOpen(true);
  };

  const handleNuevoClienteModalClose = () => {
    console.log("Cerrando modal de nuevo cliente");
    setIsNuevoClienteModalOpen(false);
  };

  const handleOpenDeleteModal = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Eliminamos el cliente y todos sus datos asociados
      const deleteClienteResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!deleteClienteResponse.ok) {
        const errorData = await deleteClienteResponse.json();
        throw new Error(errorData.message || 'Error al eliminar el cliente');
      }

      // Actualizamos la lista de clientes localmente
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userToDelete.id));
      handleCloseDeleteModal();
      
      // Mostramos mensaje de éxito
      setAlertMessage("Cliente eliminado exitosamente");
      setAlertType("success");
      setAlertVisible(true);
    } catch (error) {
      console.error('Error al eliminar el cliente:', error);
      setAlertMessage(error instanceof Error ? error.message : "Error al eliminar el cliente");
      setAlertType("error");
      setAlertVisible(true);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`);
      if (!response.ok) {
        throw new Error("Error al obtener los clientes");
      }

      const data = await response.json();
      // console.log('Datos recibidos:', data);
      // Verificar la estructura de los envases prestados
      if (data && data.length > 0) {
        // console.log('Estructura de envases prestados del primer cliente:', data[0].envases_prestados);
      }
      setUsers(data);
    } catch (error) {
      console.error("Error al obtener los clientes:", error);
      setAlertMessage("Error al cargar los clientes");
      setAlertType("error");
      setAlertVisible(true);
    }
  };

  // Efecto para cargar clientes inicialmente
  useEffect(() => {
    fetchClientes();
  }, []);

  // Efecto para actualizar los datos cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchClientes();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, []);

  // Efecto para actualizar cuando cambia el modal de nuevo cliente
  useEffect(() => {
    if (!isNuevoClienteModalOpen) {
      fetchClientes();
    }
  }, [isNuevoClienteModalOpen]);

  // Efecto para actualizar cuando cambia el modal de edición
  useEffect(() => {
    if (!editarModal) {
      fetchClientes();
    }
  }, [editarModal]);

  const renderCell = useCallback((user: User, columnKey: React.Key) => {


    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-start w-full">
            <User
              avatarProps={{ radius: "lg" }}
              description={user.email}
              name={user.nombre}
              className="text-left"
              classNames={{
                name: "text-left",
                description: "text-left"
              }}
              onClick={() => handleOpenModal(user)}
            >
              <div className="text-left">
                {user.email}
                <br />
                {user.dni ? user.dni : "DNI no disponible"}
              </div>
            </User>
          </div>
        );
      case "telefono":
        return (
          <div className="flex flex-col">
            <p className="text-sm capitalize text-bold">{user.telefono}</p>
          </div>
        );
      case "direccion":
        return (
          <div className="flex flex-col">
            <p className="text-sm capitalize text-bold">{user.direccion}</p>
          </div>
        );
      case "zona":
        return (
          <div className="flex flex-col">
            <p className="text-sm capitalize text-bold">
              {user.zona !== null && user.zona !== undefined 
                ? zonas[parseInt(user.zona.toString())]?.nombre || `Zona ${user.zona}` 
                : "Sin zona"}
            </p>
          </div>
        );
      case "repartidor":
        return (
          <div className="flex flex-col">
            <p className="text-sm capitalize text-bold">{user.repartidor || "No asignado"}</p>
          </div>
        );
      case "diaReparto":
        return (
          <div className="flex flex-col">
            <p className="text-sm capitalize text-bold">{user.dia_reparto || "No asignado"}</p>
          </div>
        );
      case "envasesPrestados":
        return (
          <div className="flex flex-col">
            {user.envases_prestados && user.envases_prestados.length > 0 ? (
              user.envases_prestados.map((envase, index) => {
                // Verificar la estructura del envase
                const cantidad = envase.cantidad || 0;
                const nombreProducto = envase.nombre_producto || envase.producto_nombre || 'Producto desconocido';
                
                return (
                  <p key={index} className="text-sm text-bold">
                    {cantidad} x {nombreProducto}
                  </p>
                );
              })
            ) : (
              <p className="text-sm text-bold">Sin envases prestados</p>
            )}
          </div>
        );
      case "actions":
        return (
          <div className="flex relative gap-2">
            <Tooltip content="Copiar DNI/CUIL">
              <span
                role="button"
                tabIndex={0}
                className="text-lg cursor-pointer text-default-400 active:opacity-50"
                onClick={() => {
                  if (user.dni) {
                    navigator.clipboard.writeText(user.dni);
                    setAlertMessage("DNI copiado: " + user.dni);
                    setAlertType("success");
                    setAlertVisible(true);
                  } else {
                    setAlertMessage("No hay DNI disponible para copiar.");
                    setAlertType("error");
                    setAlertVisible(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (user.dni) {
                      navigator.clipboard.writeText(user.dni);
                      setAlertMessage("DNI copiado: " + user.dni);
                      setAlertType("success");
                      setAlertVisible(true);
                    } else {
                      setAlertMessage("No hay DNI disponible para copiar.");
                      setAlertType("error");
                      setAlertVisible(true);
                    }
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                </svg>
              </span>
            </Tooltip>
            <Tooltip content="Ver">
              <span
                
                role="button"
                tabIndex={0}
                className="text-lg cursor-pointer text-default-400 active:opacity-50"
                onClick={() => handleOpenModal(user)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleOpenModal(user);
                  }
                }}
              >
                <EyeIcon />
              </span>
            </Tooltip>
            <Tooltip content="Editar">
              <span
                role="button"
                tabIndex={0}
                className="text-lg cursor-pointer text-default-400 active:opacity-50"
                onClick={() => handleEditarModal(user)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleEditarModal(user);
                  }
                }}
              >
                <EditIcon className="" />
              </span>
            </Tooltip>
            <Tooltip color="danger" content="Eliminar">
              <span
                role="button"
                tabIndex={0}
                className="text-lg cursor-pointer text-danger active:opacity-50"
                onClick={() => handleOpenDeleteModal(user)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleOpenDeleteModal(user);
                  }
                }}
              >
                <DeleteIcon className="" />
              </span>
            </Tooltip>
          </div>
        );
      default:
        const value = user[columnKey as keyof User];
        return typeof value === 'object' ? null : <span>{value}</span>;
    }
  }, []);

  const filteredColumns = columns;

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    
    // Filtro de búsqueda general
    const cumpleBusquedaGeneral = (
      (user.nombre?.toLowerCase() || '').includes(searchLower) ||
      (user.telefono?.toLowerCase() || '').includes(searchLower) ||
      (user.email?.toLowerCase() || '').includes(searchLower) ||
      (user.dni?.toLowerCase() || '').includes(searchLower) ||
      (user.zona !== null && user.zona !== undefined ? user.zona.toString().includes(searchLower) : false) ||
      (user.direccion?.toLowerCase() || '').includes(searchLower) ||
      (user.repartidor?.toLowerCase() || '').includes(searchLower) ||
      (user.dia_reparto?.toLowerCase() || '').includes(searchLower)
    );
    
    // Filtros adicionales
    const cumpleFiltroDiaReparto = !filtroDiaReparto || user.dia_reparto === filtroDiaReparto;
    const cumpleFiltroRepartidor = !filtroRepartidor || user.repartidor === filtroRepartidor;
    const cumpleFiltroZona = !filtroZona || user.zona?.toString() === filtroZona;
    
    return cumpleBusquedaGeneral && cumpleFiltroDiaReparto && cumpleFiltroRepartidor && cumpleFiltroZona;
  });

  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentItems = filteredUsers.slice(startIdx, endIdx);

  useEffect(() => {
    if (alertVisible) {
      const timer = setTimeout(() => {
        setAlertVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [alertVisible]);

  return (
    <div className="flex flex-col w-full h-full">
      {alertVisible && (
        <div className="absolute right-4 md:right-8 bottom-4 md:bottom-8 z-50">
          <Alert
            type={alertType}
            message={alertMessage}
            onClose={() => setAlertVisible(false)}
          />
        </div>
      )}
      
      <div className="flex flex-col gap-4 p-4 md:p-6 h-auto bg-white rounded-lg">
        {/* Header con búsqueda y botón */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="w-full md:w-2/3">
            <Input
              isClearable
              placeholder="Buscar por nombre, teléfono, email, DNI, zona o dirección..."
              startContent={
                <svg
                  className="w-4 h-4 md:w-5 md:h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              }
              onChange={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
              className="w-full"
              size="sm"
            />
          </div>
          <Button 
            color="primary" 
            variant="shadow" 
            onPress={handleNuevoClienteModalOpen}
            className="w-full md:w-auto"
            size="sm"
          >
            <span className="hidden sm:inline">Agregar Nuevo +</span>
            <span className="sm:hidden">+ Nuevo</span>
          </Button>
        </div>
        
        {/* Filtros - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="w-full">
            <label htmlFor="filtroDiaReparto" className="block mb-1 text-sm font-bold text-gray-700">
              Día de Reparto
            </label>
            <div className="relative">
              <select
                id="filtroDiaReparto"
                className="p-2 pr-10 pl-3 w-full text-sm bg-white rounded-md border border-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filtroDiaReparto}
                onChange={(e) => setFiltroDiaReparto(e.target.value)}
              >
                <option value="">Todos los días</option>
                {diasRepartoData.diasReparto.map((dia) => (
                  <option key={dia} value={dia}>
                    {dia}
                  </option>
                ))}
              </select>
              <div className="flex absolute inset-y-0 right-0 items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="w-full">
            <label htmlFor="filtroRepartidor" className="block mb-1 text-sm font-bold text-gray-700">
              Repartidor
            </label>
            <div className="relative">
              <select
                id="filtroRepartidor"
                className="p-2 pr-10 pl-3 w-full text-sm bg-white rounded-md border border-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filtroRepartidor}
                onChange={(e) => setFiltroRepartidor(e.target.value)}
              >
                <option value="">Todos los repartidores</option>
                {repartidoresData.repartidores.map((repartidor) => (
                  <option key={repartidor} value={repartidor}>
                    {repartidor}
                  </option>
                ))}
              </select>
              <div className="flex absolute inset-y-0 right-0 items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="w-full">
            <label htmlFor="filtroZona" className="block mb-1 text-sm font-bold text-gray-700">
              Zona
            </label>
            <div className="relative">
              <select
                id="filtroZona"
                className="p-2 pr-10 pl-3 w-full text-sm bg-white rounded-md border border-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filtroZona}
                onChange={(e) => setFiltroZona(e.target.value)}
              >
                <option value="">Todas las zonas</option>
                {zonas.map((zona, index) => (
                  <option key={index} value={index.toString()}>
                    {zona.nombre}
                  </option>
                ))}
              </select>
              <div className="flex absolute inset-y-0 right-0 items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Botón para limpiar filtros */}
        <div className="flex justify-end">
          <Button 
            color="success" 
            variant="flat" 
            size="sm"
            onClick={() => {
              setFiltroDiaReparto("");
              setFiltroRepartidor("");
              setFiltroZona("");
              setSearchTerm("");
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      {/* Mensaje de no resultados */}
      {filteredUsers.length === 0 && (searchTerm || filtroDiaReparto || filtroRepartidor || filtroZona) && (
        <div className="px-4 py-3 mt-4 text-blue-700 bg-blue-100 rounded border-l-4 border-blue-500">
          <div className="flex">
            <div className="py-1">
              <svg className="mr-2 md:mr-4 w-5 h-5 md:w-6 md:h-6 text-blue-500 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm md:text-base">No se encontraron resultados</p>
              <p className="text-xs md:text-sm">No hay clientes que coincidan con los filtros aplicados.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla responsive */}
      <div className="overflow-x-auto flex-1 mt-4">
        <div className="min-w-full">
          <Table aria-label="Tabla de Clientes" className="w-full">
            <TableHeader columns={filteredColumns}>
              {(column) => (
                <TableColumn 
                  key={column.uid} 
                  align={column.uid === "name" ? "start" : column.uid === "actions" ? "start" : "center"}
                  className="text-xs md:text-sm"
                >
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={currentItems}>
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey) => (
                    <TableCell className="text-xs md:text-sm">
                      {renderCell(item, columnKey)}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Paginación responsive */}
      <div className="flex justify-center mt-4 px-4">
        <Pagination
          total={Math.ceil(filteredUsers.length / itemsPerPage)}
          initialPage={1}
          page={currentPage}
          onChange={(page) => setCurrentPage(page)}
          size="sm"
          showControls
          className="flex-wrap"
        />
      </div>

      {/* Modales */}
      {editarModal && <EditarComponent cliente={selectedUser} isOpen={true} onClose={handleCloseEditarModal} onSave={handleSave} />}
      {selectedUser && <ModalToTable isOpen={isOpen} onClose={onClose} cliente={selectedUser} />}
      <NuevoClienteModal
        isOpen={isNuevoClienteModalOpen}
        onClose={handleNuevoClienteModalClose}
        onClienteAgregado={fetchClientes}
      />
      <ModalConfirmation
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteUser}
        cliente={{
          nombre: userToDelete?.nombre || '',
          mensaje: "¿Está seguro que desea borrar este cliente? Todos los datos asociados a él como información de ventas y envases también se perderán"
        }}
      />
    </div>
  );
};

export default ClientesTable; 