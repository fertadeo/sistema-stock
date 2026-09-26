# Documentación de Endpoints para Editar y Borrar Registros Manuales

Este documento describe los endpoints que el frontend necesita para las funcionalidades de editar y borrar registros manuales (gastos, ventas locales, pagos de repartidor).

## 🔴 Endpoints Críticos (Implementación Requerida)

### 1. Gastos

#### PUT /gastos/:id
Editar un gasto existente (tabla movimientos, tipo GASTO).

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

**Nota:** Todos los campos son opcionales. Solo se actualizan los campos enviados.

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

#### DELETE /gastos/:id
Borrar un gasto (soft delete). Esta acción debe reflejarse en los movimientos y totales.

**Response:**
```json
{
  "success": true,
  "message": "Gasto borrado exitosamente"
}
```

---

### 2. Ventas Locales

⚠️ **No implementado:** El backend no incluye endpoints de edición o borrado de ventas locales. La funcionalidad fue removida del frontend.

---

### 3. Cobros de Clientes

⚠️ **No implementado en frontend:** Estos endpoints existen en el backend pero aún no están implementados en la UI del frontend.

#### PUT /clientes/cobros/:cobroId
Editar un cobro registrado de un cliente.

**Request Body:**
```json
{
  "monto": 50000,
  "medio_pago": "efectivo",
  "observaciones": "Cobro parcial corregido"
}
```

**Nota:** Todos los campos son opcionales. Solo se actualizan los campos enviados.

#### DELETE /clientes/cobros/:cobroId
Borrar un cobro registrado (soft delete).

**Response:**
```json
{
  "success": true,
  "message": "Cobro borrado exitosamente"
}
```

---

### 4. Cuenta Corriente de Repartidores

#### GET /api/repartidores/:repartidorId/cuenta-corriente
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

#### POST /api/repartidores/:repartidorId/cuenta-corriente/pagos
Registrar un nuevo pago del repartidor a la empresa.

**Request Body:**
```json
{
  "repartidor_id": 5,
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

#### PUT /repartidores/cuenta-corriente/pagos/:pagoId
Editar un pago existente del repartidor.

**Request Body:**
```json
{
  "monto": 30000,
  "medio_pago": "transferencia",
  "observaciones": "Pago parcial corregido"
}
```

**Nota:** Todos los campos son opcionales. Solo se actualizan los campos enviados.

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

#### DELETE /repartidores/cuenta-corriente/pagos/:pagoId
Borrar un pago registrado (soft delete). Debe recalcular los saldos acumulados de todos los movimientos posteriores.

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
- Soft delete implementado en el backend

### Ventas Locales
- **No hay endpoints de editar/borrar implementados**
- La funcionalidad fue removida del frontend
- Si en el futuro se implementa, debe revertirse el stock de los productos al borrar

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
- **MovimientosFeed**: Feed en tiempo real con botones de editar y borrar (solo para GASTOS)

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

**✅ Endpoints implementados y mergeados** (PR fertadeo/sistema-stock-back#2):

- ✅ `PUT /gastos/:id` - Editar gasto
- ✅ `DELETE /gastos/:id` - Borrar gasto (soft delete)
- ✅ `PUT /clientes/cobros/:cobroId` - Editar cobro
- ✅ `DELETE /clientes/cobros/:cobroId` - Borrar cobro (soft delete)
- ✅ `PUT /repartidores/cuenta-corriente/pagos/:pagoId` - Editar pago
- ✅ `DELETE /repartidores/cuenta-corriente/pagos/:pagoId` - Borrar pago (soft delete)

**✅ Endpoints de creación existentes:**
- `POST /api/gastos` - Crear gasto
- `POST /api/ventas/local` - Crear venta local
- `POST /api/repartidores/:repartidorId/cuenta-corriente/pagos` - Crear pago
- `GET /api/movimientos` - Obtener movimientos
- `GET /api/repartidores/:repartidorId/cuenta-corriente` - Obtener cuenta corriente

**❌ No implementados:**
- Editar/borrar ventas locales (no requerido por ahora)
- Cobros de clientes en frontend (endpoints existen pero UI pendiente)

---

Generado por el agente de Cloud Agent - Frontend Sistema Stock Sodería Don Javier
Fecha: 2026-09-26
