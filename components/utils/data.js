
export const users = [
  {
    id: 1,
    name: 'John Doe',
    status: 'Active',
    email: 'john.doe@example.com',
    team: 'Engineering',
  },
  {
    id: 2,
    name: 'Jane Smith',
    status: 'Inactive',
    email: 'jane.smith@example.com',
    team: 'Marketing',
  },
  {
    id: 3,
    name: 'Michael Johnson',
    status: 'Active',
    email: 'michael.johnson@example.com',
    team: 'Sales',
  },
  {
    id: 4,
    name: 'Emily Davis',
    status: 'Pending',
    email: 'emily.davis@example.com',
    team: 'Product',
  },
  {
    id: 5,
    name: 'Robert Brown',
    status: 'Active',
    email: 'robert.brown@example.com',
    team: 'Support',
  },
];


const columns = [
  { name: "ID/SKU", uid: "id", sortable: true },
  { name: "Producto", uid: "producto", sortable: true },
  { name: "Disponible", uid: "disponible", sortable: true },
  { name: "Descripción", uid: "descripcion", sortable: true },
  { name: "Precio", uid: "precio" },
  { name: "Divisa", uid: "divisa", sortable: true },
  { name: "Descuento", uid: "descuento" },
  { name: "Precio Costo", uid: "precioCosto" },
  { name: "Cant. Stock", uid: "cantStock" },
];

const statusOptions = [
  { name: "En Stock", uid: "En Stock" },
  { name: "Stock Bajo", uid: "Stock Bajo" },
  { name: "Sin Stock", uid: "Sin Stock" },
];

const products = [
  {
    id: 1,
    producto: "Cortina Roller Blackout 180x200",
    disponible: "En Stock",
    descripcion: "Cortina roller con tela blackout, color blanco, tamaño 180x200 cm.",
    precio: 15000,
    divisa: "ARS",
    descuento: "10%",
    precioCosto: 12000,
    cantStock: 50,
  },
  {
    id: 2,
    producto: "Cortina Traslúcida 150x180",
    disponible: "Sin Stock",
    descripcion: "Cortina roller traslúcida, color gris, tamaño 150x180 cm.",
    precio: 12000,
    divisa: "ARS",
    descuento: "5%",
    precioCosto: 10000,
    cantStock: 30,
  },
  {
    id: 3,
    producto: "Soporte para Cortina Roller",
    disponible: "En Stock",
    descripcion: "Soporte de metal para instalación de cortinas roller.",
    precio: 800,
    divisa: "ARS",
    descuento: "15%",
    precioCosto: 600,
    cantStock: 100,
  },
  {
    id: 4,
    producto: "Motor para Cortina Automática",
    disponible: "Stock Bajo",
    descripcion: "Motor eléctrico compatible con cortinas roller automáticas.",
    precio: 25000,
    divisa: "ARS",
    descuento: "20%",
    precioCosto: 20000,
    cantStock: 5,
  },
  {
    id: 5,
    producto: "Cortina Screen 200x250",
    disponible: "En Stock",
    descripcion: "Cortina roller screen, color beige, tamaño 200x250 cm.",
    precio: 18000,
    divisa: "ARS",
    descuento: "0%",
    precioCosto: 15000,
    cantStock: 20,
  },
  {
    id: 6,
    producto: "Accesorios de Instalación",
    disponible: "Stock Bajo",
    descripcion: "Kit completo de accesorios para instalación de cortinas.",
    precio: 500,
    divisa: "ARS",
    descuento: "5%",
    precioCosto: 400,
    cantStock: 200,
  },
  {
    id: 7,
    producto: "Cortina Roller Blackout 220x250",
    disponible: "Stock Bajo",
    descripcion: "Cortina roller con tela blackout, color negro, tamaño 220x250 cm.",
    precio: 20000,
    divisa: "ARS",
    descuento: "10%",
    precioCosto: 17000,
    cantStock: 15,
  },
  {
    id: 8,
    producto: "Cortina Blackout Automática 180x200",
    disponible: "Sin Stock",
    descripcion: "Cortina roller automática con tela blackout, tamaño 180x200 cm.",
    precio: 35000,
    divisa: "ARS",
    descuento: "15%",
    precioCosto: 30000,
    cantStock: 3,
  },
  {
    id: 9,
    producto: "Tela Blackout 180x200",
    disponible: "Stock Bajo",
    descripcion: "Tela blackout para cortinas, color blanco, tamaño 180x200 cm.",
    precio: 10000,
    divisa: "ARS",
    descuento: "5%",
    precioCosto: 8000,
    cantStock: 60,
  },
  {
    id: 10,
    producto: "Tela Screen 200x250",
    disponible: "Sin Stock",
    descripcion: "Tela screen para cortinas, color beige, tamaño 200x250 cm.",
    precio: 13000,
    divisa: "ARS",
    descuento: "10%",
    precioCosto: 11000,
    cantStock: 25,
  },
];

export { columns, products, statusOptions, users };