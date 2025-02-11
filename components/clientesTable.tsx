import '../styles/globals.css';
import React, { useState, useCallback, useEffect } from "react";
import { Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, useDisclosure, Pagination, Button, User } from "@heroui/react";
import ModalToTable from "@/components/modalToTable";
import NuevoClienteModal from "@/components/nuevoClienteModal";
import ModalConfirmation from "@/components/modalConfirmation";
import { EyeIcon } from "@/components/utils/eyeIcon";
import { EditIcon } from "@/components/utils/editIcon";
import { DeleteIcon } from "@/components/utils/deleteIcon";
import EditarComponent from "@/components/editarComponent"
import Alert from "@/components/shared/alert";

type User = {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  zona: string;
  dni: string;
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

  const columns = [
    { uid: "name", name: "Nombre" },
    { uid: "telefono", name: "Teléfono" },
    { uid: "direccion", name: "Dirección" },
    { uid: "zona", name: "Zona" },
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
    setIsNuevoClienteModalOpen(true);
  };

  const handleNuevoClienteModalClose = () => {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes/${userToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {


        throw new Error('Error al eliminar el cliente');
      }
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userToDelete.id));
      handleCloseDeleteModal(); // Cierra el modal después de eliminar
    } catch (error) {
      // console.error('Error al eliminar el cliente:', error);
    }
  };

  const fetchClientes = async () => {
    try {

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`);
      if (!response.ok) {
        throw new Error("Error al obtener los clientes");
      }

      const data = await response.json();
      console.log('Datos recibidos:', data);
      setUsers(data);
    } catch (error) {
      // console.error("Error al obtener los clientes:", error);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const renderCell = useCallback((user: User, columnKey: React.Key) => {


    switch (columnKey) {
      case "name":
        return (
          <span
          role="button"
          tabIndex={0}
          className="cursor-pointer"
          onClick={() => handleOpenModal(user)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleOpenModal(user);
            }
          }}
        >
          <User
            avatarProps={{ radius: "lg" }}
            description={user.email}
            name={user.nombre}
          >
            {user.email}
            <br />
            {user.dni ? user.dni : "DNI no disponible"}
          </User>
        </span>
        
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
            <p className="text-sm capitalize text-bold">{user.zona}</p>
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
                <EditIcon className="hidden" />
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
                <DeleteIcon className="hidden" />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return user[columnKey as keyof User];
    }
  }, []);

  const filteredColumns = columns;

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.nombre?.toLowerCase() || '').includes(searchLower) ||
      (user.telefono?.toLowerCase() || '').includes(searchLower) ||
      (user.email?.toLowerCase() || '').includes(searchLower) ||
      (user.dni?.toLowerCase() || '').includes(searchLower) ||
      (user.zona?.toLowerCase() || '').includes(searchLower) ||
      (user.direccion?.toLowerCase() || '').includes(searchLower)
    );
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
        <div className="absolute right-8 bottom-8 z-50">
          <Alert
            type={alertType}
            message={alertMessage}
            onClose={() => setAlertVisible(false)}
          />
        </div>
      )}
      <div className="flex justify-between items-center p-4 h-20 bg-white rounded-lg shadow-medium">
        <Input
          isClearable
          placeholder="Buscar por nombre, teléfono, email, DNI, zona o dirección..."
          startContent={
            <svg
              className="w-5 h-5 text-gray-500"
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
          className="pr-4"
        />
        <Button color="primary" variant="shadow" className="pr-4" onClick={handleNuevoClienteModalOpen}>
          Agregar Nuevo +
        </Button>
      </div>

      {filteredUsers.length === 0 && searchTerm && (
        <div className="px-4 py-3 mt-4 text-blue-700 bg-blue-100 rounded border-l-4 border-blue-500">
          <div className="flex">
            <div className="py-1">
              <svg className="mr-4 w-6 h-6 text-blue-500 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold">No se encontraron resultados</p>
              <p className="text-sm">No hay clientes que coincidan con tu búsqueda.</p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-auto flex-1 mt-4">
        <Table aria-label="Tabla de Clientes" className="w-full">
          <TableHeader columns={filteredColumns}>
            {(column) => (
              <TableColumn key={column.uid} align={column.uid === "actions" ? "start" : "center"}>
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={currentItems}>
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center mt-4">
        <Pagination
          total={Math.ceil(filteredUsers.length / itemsPerPage)}
          initialPage={1}
          page={currentPage}
          onChange={(page) => setCurrentPage(page)}
        />
      </div>

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
      />
    </div>
  );
};

export default ClientesTable; 