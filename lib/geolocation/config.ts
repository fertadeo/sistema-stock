/**
 * Configuración de la funcionalidad "Estoy acá" - Clientes Cercanos
 * 
 * Este archivo centraliza las constantes configurables para facilitar ajustes
 * según las necesidades operativas de Don Javier.
 */

// ============================================
// RADIO DE BÚSQUEDA
// ============================================

/**
 * Radio de búsqueda por defecto en metros.
 * 
 * Sugerencias según contexto urbano:
 * - 100m: 1 cuadra (muy restrictivo, solo vecinos inmediatos)
 * - 200m: 2 cuadras (recomendado para Río Cuarto - balance ideal)
 * - 300m: 3 cuadras (más permisivo, útil si hay pocos clientes)
 * - 500m: 5 cuadras (muy amplio, puede incluir muchos clientes)
 * 
 * NOTA: Considerar la precisión del GPS (±20-50m en móvil). Un radio muy pequeño
 * puede excluir clientes que realmente están cerca por error de GPS.
 */
export const RADIO_BUSQUEDA_CERCANOS_METROS = 200;

/**
 * Radio máximo permitido (límite técnico).
 * No recomendado superar 500m para mantener buena UX.
 */
export const RADIO_MAXIMO_METROS = 500;

// ============================================
// PRECISIÓN GPS
// ============================================

/**
 * Opciones de geolocalización para getCurrentPosition().
 * 
 * enableHighAccuracy:
 * - true: Usa GPS (más preciso ~10-50m, tarda 1-5s, consume más batería)
 * - false: Usa Wi-Fi/red celular (±100-500m, <1s, ahorra batería)
 * 
 * timeout: Tiempo máximo de espera en milisegundos
 * - 10000ms (10s) es razonable para GPS
 * - Reducir a 5000ms (5s) si se prioriza velocidad sobre precisión
 * 
 * maximumAge: Edad máxima del caché de ubicación en milisegundos
 * - 30000ms (30s) permite reusar ubicación reciente
 * - 0 fuerza obtener ubicación fresca siempre
 */
export const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000,
};

// ============================================
// FORMATO Y VISUALIZACIÓN
// ============================================

/**
 * Umbral para mostrar distancia en kilómetros vs metros.
 * Por debajo de este valor: "150m"
 * Por encima de este valor: "1.2km"
 */
export const UMBRAL_KILOMETROS = 1000;

/**
 * Emoji para indicar ubicación en la UI.
 * Cambiar si se prefiere otro indicador visual.
 */
export const EMOJI_UBICACION = '📍';

/**
 * Color del botón "Estoy acá" (Tailwind classes).
 * Personalizar según branding.
 */
export const ESTILO_BOTON_ESTOY_ACA = {
  normal: 'text-teal-600 bg-teal-50 border-teal-200 hover:bg-teal-100',
  activo: 'text-teal-700 bg-teal-50 border-teal-300 hover:bg-teal-100',
  loading: 'opacity-50 cursor-not-allowed',
};

// ============================================
// LÍMITES DE RENDIMIENTO
// ============================================

/**
 * Número máximo de clientes a mostrar en la lista de cercanos.
 * Limita la cantidad aún si hay más dentro del radio.
 * 
 * - 20: Suficiente para la mayoría de casos urbanos
 * - 50: Para zonas muy densas
 * - null: Sin límite (puede afectar performance en móviles antiguos)
 */
export const MAX_CLIENTES_CERCANOS_MOSTRAR = 50;

/**
 * Umbral para considerar cambiar a filtrado backend.
 * Si la base de datos supera este número de clientes totales,
 * considerar implementar /api/clientes/cercanos endpoint.
 */
export const UMBRAL_FILTRADO_BACKEND = 5000;

// ============================================
// NOTAS DE CONFIGURACIÓN
// ============================================

/*
 * CAMBIOS QUE REQUIEREN REBUILD:
 * - Todas las constantes exportadas requieren rebuild de Next.js
 * - Ejecutar: npm run build
 * 
 * TESTING TRAS CAMBIOS:
 * 1. Cambiar la constante deseada
 * 2. Rebuild: npm run build
 * 3. Probar en móvil con HTTPS
 * 4. Verificar que los clientes aparezcan correctamente
 * 
 * TROUBLESHOOTING:
 * - Si no aparecen clientes: aumentar RADIO_BUSQUEDA_CERCANOS_METROS
 * - Si aparecen demasiados: reducir radio o agregar MAX_CLIENTES_CERCANOS_MOSTRAR
 * - Si tarda mucho: reducir GEOLOCATION_OPTIONS.timeout o enableHighAccuracy=false
 * - Si es impreciso: enableHighAccuracy=true y aumentar timeout
 */
