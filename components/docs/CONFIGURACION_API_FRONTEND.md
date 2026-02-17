# Configuración de la API para el equipo de frontend

Las rutas del backend están definidas bajo el prefijo **`/api`**. Es necesario que la **base URL** incluya `/api`.

## Base URL correcta

- **Correcto:** `https://api.sistema.soderiadonjavier.com/api`
- **Incorrecto:** `https://api.sistema.soderiadonjavier.com`

## Variable de entorno

En producción y entornos que apunten al backend real, configurar:

```env
NEXT_PUBLIC_API_URL=https://api.sistema.soderiadonjavier.com/api
```

Para desarrollo local (si el backend expone las rutas bajo `/api`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Ejemplos de URLs resultantes

Con la base correcta, las llamadas quedan así:

| Acción              | Método | URL completa                                                                 |
|---------------------|--------|-------------------------------------------------------------------------------|
| Cliente por ID      | GET    | `https://api.sistema.soderiadonjavier.com/api/clientes/711`                  |
| Actualizar cliente  | PUT    | `https://api.sistema.soderiadonjavier.com/api/clientes/711`                   |
| Historial movimientos | GET  | `https://api.sistema.soderiadonjavier.com/api/movimientos/cliente/711`       |
| Listar clientes     | GET    | `https://api.sistema.soderiadonjavier.com/api/clientes`                       |
| Repartidor rápido – venta | POST | `https://api.sistema.soderiadonjavier.com/api/repartidor-rapido/venta` |

En código se usa solo la base + path (sin repetir `/api`):

- `GET {baseUrl}/clientes/711`
- `PUT {baseUrl}/clientes/711`
- `GET {baseUrl}/movimientos/cliente/711`

Así las URLs completas son válidas y se evitan 404 por base incorrecta.
