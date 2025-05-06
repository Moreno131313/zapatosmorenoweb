# Casos de Uso - Zapatos Moreno

## Gestión de Usuarios

### CU-01: Registro de Usuario
**Actor Principal:** Usuario no registrado
**Precondiciones:** Ninguna
**Flujo Principal:**
1. Usuario accede a la página de registro
2. Sistema muestra formulario de registro
3. Usuario ingresa datos personales:
   - Nombre completo
   - Email
   - Contraseña
   - Teléfono
   - Fecha de nacimiento
4. Sistema valida datos
5. Sistema crea cuenta y envía email de confirmación

### CU-02: Inicio de Sesión
**Actor Principal:** Usuario registrado
**Precondiciones:** Usuario registrado en el sistema
**Flujo Principal:**
1. Usuario accede a la página de login
2. Usuario ingresa credenciales
3. Sistema valida credenciales
4. Sistema genera token JWT
5. Sistema redirige al dashboard

## Gestión de Productos

### CU-03: Búsqueda de Productos
**Actor Principal:** Usuario (registrado o no)
**Precondiciones:** Ninguna
**Flujo Principal:**
1. Usuario accede al catálogo
2. Usuario aplica filtros:
   - Género
   - Tipo de calzado
   - Rango de precios
   - Tallas disponibles
3. Sistema muestra resultados filtrados

### CU-04: Ver Detalle de Producto
**Actor Principal:** Usuario (registrado o no)
**Precondiciones:** Ninguna
**Flujo Principal:**
1. Usuario selecciona un producto
2. Sistema muestra:
   - Información detallada
   - Fotos
   - Tallas disponibles
   - Stock
   - Precio

## Gestión del Carrito

### CU-05: Agregar al Carrito
**Actor Principal:** Usuario
**Precondiciones:** Producto con stock disponible
**Flujo Principal:**
1. Usuario selecciona:
   - Talla
   - Color
   - Cantidad
2. Usuario agrega al carrito
3. Sistema valida stock
4. Sistema actualiza carrito

### CU-06: Gestionar Carrito
**Actor Principal:** Usuario
**Precondiciones:** Carrito con productos
**Flujo Principal:**
1. Usuario accede al carrito
2. Usuario puede:
   - Modificar cantidades
   - Eliminar productos
   - Ver total
3. Sistema actualiza totales

## Proceso de Compra

### CU-07: Checkout
**Actor Principal:** Usuario registrado
**Precondiciones:** Carrito con productos, Usuario logueado
**Flujo Principal:**
1. Usuario inicia checkout
2. Usuario selecciona/agrega dirección
3. Usuario selecciona método de pago
4. Sistema valida datos
5. Sistema procesa pago
6. Sistema genera orden

### CU-08: Gestión de Direcciones
**Actor Principal:** Usuario registrado
**Precondiciones:** Usuario logueado
**Flujo Principal:**
1. Usuario accede a direcciones
2. Usuario puede:
   - Agregar dirección
   - Editar dirección existente
   - Eliminar dirección
   - Marcar dirección principal

## Administración

### CU-09: Gestión de Inventario
**Actor Principal:** Administrador
**Precondiciones:** Usuario con rol administrador
**Flujo Principal:**
1. Administrador accede a inventario
2. Puede:
   - Actualizar stock
   - Modificar precios
   - Agregar/eliminar productos
   - Ver estadísticas

### CU-10: Gestión de Pedidos
**Actor Principal:** Administrador
**Precondiciones:** Usuario con rol administrador
**Flujo Principal:**
1. Administrador accede a pedidos
2. Puede:
   - Ver detalles de pedidos
   - Actualizar estado
   - Generar reportes
   - Gestionar devoluciones 