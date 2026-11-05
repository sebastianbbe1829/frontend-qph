# Análisis y propuesta de arquitectura

## Alcance actual

El repositorio contiene una aplicación Angular; no contiene código de servidor, migraciones ni esquema de base de datos. Por eso, este documento analiza la arquitectura del frontend y propone responsabilidades para el backend, pero los cambios de servidor y base de datos deben realizarse en el repositorio correspondiente.

La aplicación ya está organizada por funcionalidades y no como un MVC tradicional:

- `features`: pantallas independientes de productos, usuarios y autenticación, cargadas mediante rutas.
- `core`: servicios HTTP, autenticación, guards e interceptor JWT, compartidos por toda la aplicación.
- `shared/models`: contratos TypeScript para productos, usuarios y ventas.
- Componentes standalone: presentan la interfaz y coordinan interacciones; los servicios encapsulan las llamadas HTTP.

La venta y la creación de usuarios ya cuentan con pantalla/flujo y servicios en este frontend. La venta envía productos y cantidades, y usa la respuesta del servidor para actualizar el stock mostrado. El cliente valida la cantidad para mejorar la experiencia, pero no es autoridad para determinar precios, permisos ni disponibilidad final.

## Diseño recomendado para el backend

Para este tamaño de sistema se recomienda un **monolito modular por dominio**, con límites claros entre módulos, antes que microservicios. Mantiene una sola aplicación desplegable y permite separar responsabilidades y probar reglas de negocio sin introducir infraestructura distribuida.

```text
API / Controllers
    -> Application (casos de uso: crear usuario, registrar venta)
        -> Domain (reglas de negocio e invariantes)
            <- Infrastructure (repositorios, ORM y base de datos)
```

Módulos iniciales:

- **Users/Auth**: identidad, roles y autenticación. La creación valida unicidad y almacena únicamente el hash de la contraseña; nunca devuelve credenciales.
- **Products/Inventory**: catálogo y disponibilidad. Las entradas y salidas de stock deben quedar asociadas a operaciones trazables.
- **Sales**: venta y detalle de venta; el precio unitario se toma del producto persistido, no del cliente.

Modelo relacional mínimo recomendado:

- `users`: usuario único, hash de contraseña, rol y estado.
- `products`: nombre, precio y stock disponible.
- `sales`: usuario que registró la operación, fecha y total.
- `sale_items`: venta, producto, cantidad y precio unitario aplicado.

Cada `sale_item` conserva el precio histórico aplicado para que cambiar el precio actual de un producto no altere ventas anteriores. La clave foránea de producto y la política para productos eliminados deben definirse explícitamente (por ejemplo, impedir eliminación si hay historial o desactivar el producto).

### Regla crítica de stock

`POST /api/sales` debe ser un caso de uso transaccional del servidor:

1. Obtener la identidad del usuario autenticado desde el token, no desde el cuerpo enviado por el navegador.
2. Validar identificadores, cantidades positivas y existencia de cada producto.
3. Leer y bloquear —o actualizar con control de versión— los productos involucrados para evitar que dos ventas concurrentes consuman las mismas unidades.
4. Verificar stock suficiente, capturar el precio del servidor y persistir la venta y sus detalles.
5. Descontar todo el stock dentro de la misma transacción; si falla cualquier línea, revertir toda la venta.
6. Responder con la venta registrada y stock restante. Un conflicto por falta de stock puede responder `409 Conflict`.

No se debe confiar en el total, precio, usuario ni stock calculados por el frontend. La interfaz solo muestra una prevalidación; el backend conserva la autoridad y garantiza atomicidad.

## Evolución recomendada para el frontend

La organización `features/core/shared` ya es una buena base modular. Para reducir acoplamiento a medida que crezca:

1. Mantener cada caso de uso dentro de su feature y evitar que el listado de productos acumule la presentación y coordinación de procesos de ventas.
2. Definir contratos de API explícitos para request/response y centralizar la configuración de la URL base de la API por entorno.
3. Mantener los guards como ayuda de navegación, pero validar todos los permisos en el backend.
4. Añadir pruebas focalizadas para el alta de usuarios y la venta: cantidades inválidas, errores `404/409`, ventas con varias líneas y actualización del stock presentado.
5. Si el catálogo o el historial crecen, añadir paginación y búsqueda del lado del servidor; no introducir estado global o microfrontends hasta que exista una necesidad real.

Estas mejoras son incrementales: no requieren convertir Angular en MVC ni añadir capas vacías. La separación debe seguir los límites de dominio y las responsabilidades reales.

## Cambios realizados en este repositorio

- Se mantiene la venta existente y su contrato `items: [{ productId, quantity }]`; la creación de usuarios y sus protecciones de acceso también se conservan.
- No se modifican endpoints ni el esquema del servidor porque no forman parte de este repositorio.
