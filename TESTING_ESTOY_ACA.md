# Guía de Pruebas: Funcionalidad "Estoy acá"

## Requisitos Previos

### Contexto Seguro (Mandatory)
La API de Geolocalización del navegador **requiere un contexto seguro**:
- ✅ **HTTPS** (producción)
- ✅ **localhost** (desarrollo local)
- ❌ **HTTP** sobre red local (ej: http://192.168.x.x) → **NO funcionará**

### Dispositivos Soportados
- 📱 Android (Chrome, Firefox, Edge)
- 📱 iOS (Safari, Chrome)
- 💻 Desktop con GPS o Wi-Fi location (Chrome, Firefox, Safari, Edge)

## Escenarios de Prueba

### Escenario 1: Desarrollo Local (Desktop)
**Setup:**
```bash
npm run dev
# El servidor corre en http://localhost:3000
```

**Pruebas:**
1. Abrir http://localhost:3000/repartidor/rapido
2. Hacer clic en "Estoy acá"
3. El navegador pedirá permisos → Permitir
4. Verificar que aparezcan clientes cercanos (si hay clientes con coordenadas en tu DB)

**Limitaciones:**
- La precisión en desktop con Wi-Fi puede ser baja (~100-500m)
- Si usas VPN, la ubicación puede ser incorrecta

---

### Escenario 2: Mobile sobre Localhost (Mismo WiFi)

**Setup:**
```bash
# En tu PC/servidor
npm run dev
# Next.js mostrará algo como:
# ▲ Next.js 14.x.x
# - Local:        http://localhost:3000
# - On Your Network:  http://192.168.1.100:3000
```

⚠️ **PROBLEMA**: `http://192.168.x.x` NO es contexto seguro → geolocalización bloqueada

**Solución A: Tunnel con HTTPS (Recomendado)**
```bash
# Opción 1: ngrok (gratuito)
npx ngrok http 3000
# Copiá la URL HTTPS que te da (ej: https://abc123.ngrok.io)
# Abrí esa URL en tu móvil

# Opción 2: Vercel Dev (si usás Vercel)
vercel dev
# Te da una URL HTTPS automática
```

**Solución B: Certificado SSL Local**
```bash
# Instalar mkcert
mkcert -install
mkcert localhost 192.168.1.100

# Configurar Next.js para usar HTTPS
# (requiere config adicional en next.config.js o usar proxy nginx)
```

---

### Escenario 3: Producción (Deploy en Vercel/Netlify/etc)

**Setup:**
```bash
# Deploy a producción
git push origin main
# O
vercel deploy --prod
```

**Pruebas en móvil:**
1. Abrir la URL de producción (ej: https://sistema-stock.vercel.app)
2. Navegar a `/repartidor/rapido`
3. Hacer clic en "Estoy acá"
4. Otorgar permisos de ubicación
5. Verificar clientes cercanos

**Ventajas:**
- ✅ HTTPS nativo
- ✅ Precisión real del GPS del móvil
- ✅ Experiencia final del usuario

---

## Casos de Prueba Específicos

### ✅ CP-001: Usuario otorga permisos
1. Hacer clic en "Estoy acá"
2. Navegador pide permisos → **Permitir**
3. **Esperado**: Spinner/loading → Lista de clientes ordenados por distancia

### ❌ CP-002: Usuario deniega permisos
1. Hacer clic en "Estoy acá"
2. Navegador pide permisos → **Bloquear/Denegar**
3. **Esperado**: Mensaje de error con instrucciones:
   - "Permiso de ubicación denegado"
   - "Activá la ubicación en tu dispositivo..."
   - Botón "Cerrar" para ocultar el error

### 🔄 CP-003: Reintentar tras denegar
1. Denegar permisos (CP-002)
2. Cerrar el error
3. **Activar ubicación en el navegador** (Chrome → Configuración del sitio)
4. Hacer clic en "Estoy acá" de nuevo
5. **Esperado**: Funciona correctamente

### 📍 CP-004: Clientes cercanos encontrados
1. Tener al menos 3 clientes con coordenadas en la DB
2. Hacer clic en "Estoy acá" desde una ubicación cercana
3. **Esperado**:
   - Header: "X clientes cerca (radio 200m)"
   - Lista ordenada por distancia (más cercano arriba)
   - Cada cliente muestra: Nombre, distancia (ej: "150m"), teléfono, dirección
   - Botón "Volver a búsqueda"

### 🚫 CP-005: Sin clientes cercanos
1. Hacer clic en "Estoy acá" desde una ubicación alejada (sin clientes en 200m)
2. **Esperado**:
   - Estado vacío con icono de pin
   - "No hay clientes cerca"
   - "No se encontraron clientes en un radio de 200m..."
   - Botón "Volver a búsqueda"

### 🔄 CP-006: Actualizar ubicación
1. Buscar clientes cercanos (CP-004)
2. Moverse a otra ubicación (ej: caminar 300m)
3. Hacer clic en "Estoy acá" de nuevo (el botón cambia a "Actualizar ubicación")
4. **Esperado**: Lista actualizada con clientes de la nueva ubicación

### 📱 CP-007: Seleccionar cliente cercano
1. Tener clientes cercanos visibles
2. Hacer clic en un cliente de la lista
3. **Esperado**:
   - Se abre la ficha del cliente
   - Se oculta la lista de cercanos
   - Todas las operaciones (venta, cobro, fiado) funcionan normal

### 🔍 CP-008: Búsqueda manual mientras viendo cercanos
1. Tener clientes cercanos visibles
2. Escribir algo en el campo de búsqueda
3. **Esperado**: Se sale automáticamente del modo "cercanos" y vuelve a búsqueda normal

### 🔖 CP-009: Fijar cliente cercano
1. Tener clientes cercanos visibles
2. Hacer clic en el ícono de pin de un cliente
3. **Esperado**: Cliente agregado a "Clientes a visitar" (sección arriba)
4. El cliente sigue visible en cercanos con el pin marcado

---

## Troubleshooting

### "La geolocalización no funciona en mi móvil"
1. Verificar que estás usando **HTTPS** (no HTTP)
2. Verificar que el **GPS esté activado** en el dispositivo
3. Verificar **permisos del navegador** (Configuración → Aplicaciones → Chrome → Permisos → Ubicación)
4. Probar en **modo incógnito** (a veces los permisos se quedan cacheados)

### "Dice que hay clientes cerca pero no aparecen"
1. Verificar que los clientes tengan `latitud` y `longitud` en la base de datos
2. Verificar que las coordenadas no sean `0, 0` (error común)
3. Verificar que las coordenadas sean de Río Cuarto, Argentina (aprox -33.1, -64.3)

### "La distancia mostrada es incorrecta"
1. En desktop con Wi-Fi, la precisión puede ser baja (±500m)
2. En móvil con GPS, la precisión debería ser ±10-50m
3. Verificar que las coordenadas de los clientes sean correctas (pueden haberse geocodificado mal)

### "El navegador no pide permisos"
1. Puede que ya los hayas denegado antes → Ir a Configuración del sitio → Ubicación → Permitir
2. Puede que estés en HTTP (no HTTPS) → El navegador bloquea silenciosamente
3. Probar abrir DevTools → Console → Debería haber un warning si está bloqueado

---

## Configuración Avanzada

### Ajustar el radio de búsqueda
Editar `lib/geolocation/distancia.ts`:
```typescript
// De 200m a 300m:
export const RADIO_BUSQUEDA_CERCANOS_METROS = 300;
```

### Cambiar la precisión del GPS
Editar `lib/hooks/useEstoyAca.ts`:
```typescript
// Línea ~56
navigator.geolocation.getCurrentPosition(
  (position) => { /* ... */ },
  (error) => { /* ... */ },
  {
    enableHighAccuracy: true,  // ← true = GPS, false = Wi-Fi/cell tower (más rápido, menos preciso)
    timeout: 10000,             // ← Tiempo máximo de espera (ms)
    maximumAge: 30000,          // ← Edad máxima de caché (ms)
  }
);
```

---

## Métricas de Éxito

- ✅ Un repartidor puede encontrar clientes sin escribir
- ✅ Funciona en móvil con GPS en producción (HTTPS)
- ✅ Manejo claro de errores de permisos
- ✅ No rompe flujos existentes (búsqueda manual sigue funcionando)
- ✅ Radio de 200m cubre ~2 cuadras en Río Cuarto

---

## Notas para Desarrollo Futuro

### Si el filtrado client-side no escala
Actualmente se cargan **todos los clientes** y se filtran en el frontend. Si hay >5000 clientes, considerar:

**Backend Endpoint:**
```bash
GET /api/clientes/cercanos?lat=-33.1234&lng=-64.5678&radio=200
```

Implementaría:
1. Query con distancia calculada en la DB (PostgreSQL/MySQL tienen funciones de geo)
2. Retornar solo los clientes en el radio
3. Paginar si hay muchos

**Ejemplo SQL (PostgreSQL):**
```sql
SELECT *,
  (6371000 * acos(
    cos(radians(:lat)) * cos(radians(latitud)) *
    cos(radians(longitud) - radians(:lng)) +
    sin(radians(:lat)) * sin(radians(latitud))
  )) AS distancia
FROM clientes
WHERE estado = true
HAVING distancia <= :radio
ORDER BY distancia ASC
LIMIT 50;
```

Pero **por ahora no es necesario** - el filtrado client-side es suficiente.
