# Documentación de Endpoints para Editar y Borrar Registros Manuales

Este documento describe los endpoints que el frontend necesita para las funcionalidades de editar y borrar registros manuales (gastos, ventas locales, pagos de repartidor).

## 🔴 Endpoints Críticos (Implementación Requerida)

### 1. Gastos

#### PUT /api/gastos/:id
Editar un gasto existente.

**Request Body:**
```json
{
  "monto": 15000,
  "concepto": "Pago de servicios",
  "detalles": {
    "proveedor": "Proveedor ABC",
    "factura": "FAC-001",
    "categoria": "Servicios"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Gasto editado exitosamente",
  "gasto": {
    "id": 123,
    "monto": 15000,
    "concepto": "Pago de servicios",
    "detalles": { /* ... */ },
    "fecha": "2026-09-26T14:30:00Z"
  }
}
```

#### DELETE /api/gastos/:id
Borrar un gasto. Esta acción debe reflejarse en los movimientos y totales.

**Response:**
```json
{
  "success": true,
  "message": "Gasto borrado exitosamente"
}
```

---

### 2. Ventas Locales

#### DELETE /api/ventas/local/:id
Borrar una venta local. Debe revertir el stock de los productos vendidos.

**Response:**
```json
{
  "success": true,
  "message": "Venta local borrada exitosamente",
  "productos_revertidos": [
    {
      "producto_id": "P001",
      "cantidad_revertida": 5,
      "stock_actual": 150
    }
  ]
}
```

**Nota:** Por ahora no se implementa edición de ventas locales, solo borrado.

---

### 3. Cuenta Corriente de Repartidores

#### GET /api/repartidores/:id/cuenta-corriente
Obtener el resumen y los movimientos de cuenta corriente de un repartidor.

**Response:**
```json
{
  "success": true,
  "data": {
    "resumen": {
      "repartidor_id": 5,
      "repartidor_nombre": "Juan Pérez",
      "saldo_actual": 45000,
      "total_debitos": 150000,
      "total_creditos": 105000,
      "cantidad_movimientos": 24,
      "ultimo_movimiento_at": "2026-09-15T10:30:00Z"
    },
    "movimientos": [
      {
        "id": "uuid-1",
        "fecha": "2026-09-15T10:30:00Z",
        "tipo": "CREDITO",
        "descripcion": "Pago parcial - Semana 1",
        "monto": 25000,
        "saldo_acumulado": 45000,
        "medio_pago": "efectivo",
        "observaciones": "Pago semanal"
      },
      {
        "id": "uuid-2",
        "fecha": "2026-09-14T15:20:00Z",
        "tipo": "DEBITO",
        "descripcion": "Fiado cliente María García",
        "monto": 12000,
        "saldo_acumulado": 70000,
        "observaciones": null
      }
    ]
  }
}
```

#### POST /api/repartidores/:id/cuenta-corriente/pagos
Registrar un nuevo pago del repartidor a la empresa.

**Request Body:**
```json
{
  "monto": 25000,
  "medio_pago": "efectivo",
  "observaciones": "Pago parcial semana 1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pago registrado exitosamente",
  "data": {
    "pago": {
      "id": "uuid-new",
      "repartidor_id": 5,
      "monto": 25000,
      "medio_pago": "efectivo",
      "fecha": "2026-09-16T22:30:00Z",
      "observaciones": "Pago parcial semana 1"
    },
    "saldo_actual": 20000
  }
}
```

#### PUT /api/repartidores/:id/cuenta-corriente/pagos/:pagoId
Editar un pago existente del repartidor.

**Request Body:**
```json
{
  "monto": 30000,
  "medio_pago": "transferencia",
  "observaciones": "Pago parcial corregido"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pago editado exitosamente",
  "data": {
    "pago": {
      "id": "uuid-123",
      "repartidor_id": 5,
      "monto": 30000,
      "medio_pago": "transferencia",
      "fecha": "2026-09-16T22:30:00Z",
      "observaciones": "Pago parcial corregido"
    },
    "saldo_actual": 15000
  }
}
```

#### DELETE /api/repartidores/:id/cuenta-corriente/pagos/:pagoId
Borrar un pago registrado. Debe recalcular los saldos acumulados de todos los movimientos posteriores.

**Response:**
```json
{
  "success": true,
  "message": "Pago borrado exitosamente",
  "data": {
    "saldo_actual": 45000
  }
}
```

---

## 📝 Notas de Implementación

### Gastos
- Los débitos automáticos (cierre de ventas) NO deben ser editables ni borrables desde esta UI
- Solo los registros de tipo GASTO creados manualmente pueden editarse/borrarse

### Ventas Locales
- Al borrar una venta local, debe revertirse el stock de los productos
- Por ahora no se implementa edición, solo borrado

### Cuenta Corriente Repartidores
- Los débitos se generan automáticamente cuando el repartidor fía a clientes (NO editables/borrables desde esta UI)
- Los créditos (pagos) son registros manuales que SÍ pueden editarse/borrarse
- Al editar o borrar un pago, deben recalcularse los saldos acumulados de todos los movimientos posteriores
- El saldo es: `total_debitos - total_creditos`
- Saldo positivo = repartidor debe a la empresa
- Los medios de pago son: `efectivo`, `transferencia`, `debito`, `credito`

---

## 🔄 Refresh de Datos

Después de cada operación de editar o borrar, el frontend refrescará:
1. La lista de movimientos
2. Los totales y saldos calculados
3. Los gráficos (si aplica)

## 🎯 Pantallas Afectadas

### 1. Dashboard Home (`app/home/page.tsx`)
- **GastosIngresosDashboard**: Lista de últimos gastos con botones de editar/borrar
- **MovimientosFeed**: Feed en tiempo real con botones de editar (solo gastos) y borrar (gastos y ventas locales)

### 2. Cuenta Corriente Repartidores (`app/ventas/repartidores-donjavier/cuenta-corriente/page.tsx`)
- Lista de movimientos de cuenta corriente con botones de editar/borrar (solo para pagos/créditos)

## ✅ Validaciones

### En el Frontend:
- Validación de campos obligatorios antes de enviar
- Confirmación antes de borrar (modal de confirmación)
- Mensajes de error claros al usuario

### En el Backend (Recomendado):
- Validar que el registro existe antes de editar/borrar
- Validar permisos del usuario
- Validar que el monto sea positivo
- En el caso de borrar ventas locales, validar que haya suficiente stock para revertir
- En el caso de cuenta corriente, recalcular saldos correctamente

---

## 🚀 Contrato REST Estándar del Proyecto

El proyecto sigue el siguiente contrato REST:

- **POST** `/api/<recurso>` - Crear nuevo registro
- **GET** `/api/<recurso>` - Obtener lista de registros
- **GET** `/api/<recurso>/:id` - Obtener un registro específico
- **PUT** `/api/<recurso>/:id` - Editar un registro existente
- **DELETE** `/api/<recurso>/:id` - Borrar un registro

---

## 📦 Estado Actual del Backend

Según el código y comentarios encontrados, los siguientes endpoints están **pendientes de implementación**:

- ❌ `PUT /api/gastos/:id`
- ❌ `DELETE /api/gastos/:id`
- ❌ `DELETE /api/ventas/local/:id`
- ❌ `GET /api/repartidores/:id/cuenta-corriente`
- ❌ `POST /api/repartidores/:id/cuenta-corriente/pagos`
- ❌ `PUT /api/repartidores/:id/cuenta-corriente/pagos/:pagoId`
- ❌ `DELETE /api/repartidores/:id/cuenta-corriente/pagos/:pagoId`

✅ Los endpoints de creación ya existen:
- `POST /api/gastos`
- `POST /api/ventas/local`
- `GET /api/movimientos`

---

Generado por el agente de Cloud Agent - Frontend Sistema Stock Sodería Don Javier
Fecha: 2026-09-26
