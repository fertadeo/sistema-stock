# Implementación Técnica: "Estoy acá" - Clientes Cercanos GPS

## Arquitectura

### Diagrama de Flujo

```
Usuario hace clic "Estoy acá"
         ↓
    [manejarEstoyAca()]
         ↓
    useEstoyAca.buscarClientesCercanos()
         ↓
    obtenerUbicacionActual() ← Geolocation API
         ↓
    ¿Permisos OK?
    ├─ NO → Mostrar error + instrucciones
    └─ SÍ → Obtiene { lat, lng }
         ↓
    filtrarClientesCercanos(todosClientes, ubicacion, radio)
         ↓
    Para cada cliente:
      ├─ ¿Tiene coordenadas válidas? (lat ≠ null, lng ≠ null, ≠ 0,0)
      ├─ calcularDistanciaMetros(ubicacion, cliente)
      └─ ¿Distancia <= radio? → Agregar a resultado
         ↓
    Ordenar por distancia ASC
         ↓
    Mostrar en UI con distancia formateada
```

## Estructura de Archivos

```
lib/
├── geolocation/
│   └── distancia.ts           # Cálculo de distancias (Haversine)
├── hooks/
│   ├── useEstoyAca.ts         # Hook principal (geolocalización + filtrado)
│   └── useRepartidorGeolocation.ts  # Tracking continuo de ubicación
components/
└── RepartidorRapido.tsx       # UI integrada
```

## Componentes Clave

### 1. `lib/geolocation/distancia.ts`

**Responsabilidad:** Cálculos geométricos y constantes.

```typescript
// Fórmula de Haversine - distancia entre dos puntos en esfera
calcularDistanciaMetros(lat1, lon1, lat2, lon2): number

// Constantes configurables
RADIO_BUSQUEDA_CERCANOS_METROS = 200  // Default: ~2 cuadras
RADIO_MAXIMO_METROS = 500

// Helper de formato
formatearDistancia(metros): string  // "150m" o "1.2km"
```

**Fórmula de Haversine:**
```
a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
c = 2 ⋅ atan2( √a, √(1−a) )
d = R ⋅ c

Donde:
  φ = latitud (rad)
  λ = longitud (rad)
  R = radio de la Tierra (6371 km = 6371000 m)
  Δφ = diferencia de latitudes
  Δλ = diferencia de longitudes
```

**Precisión:** ±0.5% (suficiente para distancias urbanas <10km)

---

### 2. `lib/hooks/useEstoyAca.ts`

**Responsabilidad:** Lógica de geolocalización y filtrado.

#### Estado
```typescript
interface EstadoEstoyAca {
  buscando: boolean;          // Loading state
  errorPermiso: boolean;      // True si el usuario denegó permisos
  errorMensaje: string | null;
  ubicacionActual: { latitud, longitud } | null;
}
```

#### API Pública
```typescript
const {
  estado,
  buscarClientesCercanos,      // Main function
  filtrarClientesCercanos,      // Helper (puede usarse independiente)
  limpiarError,
} = useEstoyAca<Cliente>();
```

#### Opciones de Geolocalización
```typescript
navigator.geolocation.getCurrentPosition(
  successCallback,
  errorCallback,
  {
    enableHighAccuracy: true,  // Usar GPS (no Wi-Fi)
    timeout: 10000,            // 10s max
    maximumAge: 30000,         // Cache válido por 30s
  }
);
```

**Trade-offs:**
- `enableHighAccuracy: true` → Más preciso (~10-50m) pero más batería y más lento (1-5s)
- `enableHighAccuracy: false` → Menos preciso (~100-500m) pero más rápido (<1s) y menos batería

**Manejo de Errores:**
```typescript
switch (error.code) {
  case PERMISSION_DENIED:    // Usuario denegó
  case POSITION_UNAVAILABLE: // GPS no disponible
  case TIMEOUT:              // Tardó mucho
}
```

---

### 3. `components/RepartidorRapido.tsx`

**Estado Local Agregado:**
```typescript
const [clientesCercanos, setClientesCercanos] = useState<ClienteConDistancia<Cliente>[]>([]);
const [viendoCercanos, setViendoCercanos] = useState(false);
```

**Handlers:**
```typescript
// 1. Buscar cercanos
const manejarEstoyAca = async () => {
  limpiarErrorEstoyAca();
  setViendoCercanos(true);
  const todosClientes = await repartidorRapidoService.obtenerTodosClientes();
  const cercanos = await buscarClientesCercanos(todosClientes, RADIO);
  setClientesCercanos(cercanos);
};

// 2. Volver a búsqueda normal
const salirDeViendoCercanos = () => {
  setViendoCercanos(false);
  setClientesCercanos([]);
  limpiarErrorEstoyAca();
};

// 3. Al seleccionar cliente
const seleccionarCliente = async (cliente: Cliente) => {
  await cargarFichaCliente(cliente.id, cliente);
  salirDeViendoCercanos(); // ← Nuevo
};
```

**UI Condicional:**
```typescript
// Ocultar búsqueda normal cuando viendoCercanos = true
{!viendoCercanos && clientesEncontrados.length > 0 && (
  <ListaClientesEncontrados />
)}

// Mostrar clientes cercanos
{viendoCercanos && (
  <ListaClientesCercanos ordenadosPorDistancia />
)}
```

---

## Consideraciones de Performance

### Carga de Clientes
**Actual:** Se cargan todos los clientes en memoria.
```typescript
const todosClientes = await repartidorRapidoService.obtenerTodosClientes();
// ↑ Un solo fetch, se cachea en el componente
```

**Complejidad:** O(n) donde n = número de clientes
- Si n = 100 → ~1ms de filtrado
- Si n = 1000 → ~10ms de filtrado
- Si n = 10000 → ~100ms de filtrado (¡todavía aceptable!)

**Umbral de escalabilidad:** ~5000 clientes. Si se supera, considerar:
1. **Backend filtering** (endpoint `/api/clientes/cercanos?lat=X&lng=Y&radio=Z`)
2. **Spatial indexing** en DB (PostGIS, MySQL SPATIAL)
3. **Lazy loading** (cargar primero los del repartidor actual)

### Cálculo de Distancias
**Actual:** Fórmula de Haversine (trigonométricas pesadas)
```typescript
// Por cada cliente:
Math.sin(), Math.cos(), Math.atan2(), Math.sqrt()
```

**Alternativa más rápida (si necesario):**
```typescript
// Aproximación "flat earth" (válida para <10km):
dx = (lng2 - lng1) * cos(lat_promedio)
dy = (lat2 - lat1)
distancia = sqrt(dx² + dy²) * R

// ~3x más rápido, error <1% para distancias urbanas
```

---

## Precisión Geográfica

### Geolocation API - Accuracy Esperado

| Método | Precisión | Tiempo | Batería | Contexto |
|--------|-----------|--------|---------|----------|
| GPS | ±10-50m | 1-5s | Alta | Exterior, cielo despejado |
| Wi-Fi | ±50-200m | <1s | Baja | Zona urbana con APs conocidos |
| Cell Tower | ±500-3000m | <1s | Baja | Zona rural |

**En Río Cuarto:**
- Zona urbana densa → GPS + Wi-Fi → ±20-50m (excelente)
- Zona periférica → GPS solo → ±50-100m (bueno)
- Interior de edificios → Wi-Fi → ±100-300m (aceptable)

### Radio de Búsqueda vs Precisión GPS

```
Radio configurado: 200m
Precisión GPS: ±50m

Escenario:
  Cliente real está a 150m → GPS dice 180m → ✅ Aparece (dentro del radio)
  Cliente real está a 220m → GPS dice 190m → ✅ Aparece (falso positivo OK)
  Cliente real está a 250m → GPS dice 300m → ❌ No aparece (OK, muy lejos)

Conclusión: Radio de 200m con precisión ±50m es robusto.
```

---

## Seguridad y Privacidad

### Geolocation API - Restricciones del Navegador

1. **Contexto seguro requerido:**
   - ✅ HTTPS
   - ✅ localhost / 127.0.0.1
   - ❌ HTTP sobre red local (192.168.x.x, 10.x.x.x)

2. **Permisos por origen:**
   - `https://miapp.com` → Permiso independiente
   - `https://test.miapp.com` → Permiso independiente
   - `http://localhost:3000` → Permiso independiente

3. **User gesture requerido (desktop):**
   - Solo se puede pedir permisos tras un clic/tap del usuario
   - No se puede pedir automáticamente al cargar la página

4. **Privacidad:**
   - La ubicación **NUNCA** sale del dispositivo sin consentimiento
   - El filtrado se hace **client-side** (coordenadas de clientes vienen del server, pero ubicación del user NO se envía)
   - Tracking de ubicación (useRepartidorGeolocation) es **opt-in** separado

### ¿Se envía mi ubicación al backend?

**En esta feature: NO.**
- La ubicación GPS solo se usa para filtrar clientes en el frontend
- `buscarClientesCercanos()` no hace requests HTTP con la ubicación

**En el tracking existente: SÍ.**
- `useRepartidorGeolocation` SÍ envía ubicación a `/api/repartidor-rapido/ubicacion`
- Esto es para que la oficina vea dónde está cada repartidor en tiempo real
- Es un feature separado, no relacionado con "Estoy acá"

---

## Testing

### Unit Tests (futuro)
```typescript
// lib/geolocation/distancia.test.ts
describe('calcularDistanciaMetros', () => {
  it('calcula distancia entre Buenos Aires y Río Cuarto', () => {
    const bsAs = { lat: -34.6037, lng: -58.3816 };
    const rCuarto = { lat: -33.1301, lng: -64.3478 };
    const dist = calcularDistanciaMetros(bsAs.lat, bsAs.lng, rCuarto.lat, rCuarto.lng);
    expect(dist).toBeCloseTo(549000, -3); // ±1km de error OK
  });
  
  it('retorna 0 para el mismo punto', () => {
    expect(calcularDistanciaMetros(-33.1, -64.3, -33.1, -64.3)).toBe(0);
  });
});

// lib/hooks/useEstoyAca.test.ts
describe('useEstoyAca', () => {
  it('filtra clientes dentro del radio', () => {
    const clientes = [
      { id: 1, lat: -33.1301, lng: -64.3478 }, // ~0m
      { id: 2, lat: -33.1320, lng: -64.3480 }, // ~210m
    ];
    const ubicacion = { latitud: -33.1301, longitud: -64.3478 };
    const resultado = filtrarClientesCercanos(clientes, ubicacion, 200);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].cliente.id).toBe(1);
  });
});
```

### E2E Tests (Playwright/Cypress)
```typescript
// e2e/estoy-aca.spec.ts
test('debe buscar clientes cercanos', async ({ page, context }) => {
  // Mock de Geolocation API
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -33.1301, longitude: -64.3478 });
  
  await page.goto('/repartidor/rapido');
  await page.click('button:has-text("Estoy acá")');
  
  await expect(page.locator('text=clientes cerca')).toBeVisible();
  await expect(page.locator('.cliente-cercano').first()).toContainText('m'); // Distancia
});
```

---

## Mejoras Futuras

### Corto plazo
- [ ] Animación de "pulso" en el botón "Estoy acá" mientras carga
- [ ] Vibración del dispositivo al encontrar clientes (Vibration API)
- [ ] Sonido de notificación (Web Audio API)

### Mediano plazo
- [ ] Selector de radio (100m / 200m / 500m) en la UI
- [ ] Ordenar por: distancia / deuda / últimas ventas
- [ ] Filtro de "solo clientes activos" en cercanos
- [ ] Historial de ubicaciones visitadas (localStorage)

### Largo plazo
- [ ] Mapa visual con pins (Google Maps API)
- [ ] Navegación turn-by-turn (Google Directions API)
- [ ] Ruta optimizada para visitar N clientes (Traveling Salesman)
- [ ] Notificación push al acercarte a un cliente con deuda

---

## Referencias

- [MDN: Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Haversine formula](https://en.wikipedia.org/wiki/Haversine_formula)
- [Secure Contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)
- [Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)

---

## Contacto

Si encontrás bugs o tenés sugerencias, abrí un issue en el repo con la etiqueta `feature:estoy-aca`.
