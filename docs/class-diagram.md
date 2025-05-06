# Diagrama de Clases - Zapatos Moreno

## Entidades Principales

### Usuario
```mermaid
classDiagram
    class Usuario {
        +int id
        +String nombre
        +String email
        +String password
        +String telefono
        +Date fecha_nacimiento
        +String genero
        +registrar()
        +login()
        +actualizarPerfil()
    }
```

### Producto
```mermaid
classDiagram
    class Producto {
        +int id
        +String nombre
        +float precio
        +String descripcion
        +String imagen
        +String genero
        +String tipo
        +obtenerDetalles()
        +actualizarStock()
    }
```

### Carrito
```mermaid
classDiagram
    class Carrito {
        +int id
        +int usuario_id
        +float total
        +Date fecha_creacion
        +agregarProducto()
        +eliminarProducto()
        +actualizarCantidad()
        +calcularTotal()
    }
```

### Dirección
```mermaid
classDiagram
    class Direccion {
        +int id
        +int usuario_id
        +String nombre
        +String direccion
        +String ciudad
        +String codigo_postal
        +String telefono
        +boolean es_principal
        +agregar()
        +actualizar()
        +eliminar()
    }
```

## Relaciones

```mermaid
classDiagram
    Usuario "1" -- "*" Carrito
    Usuario "1" -- "*" Direccion
    Carrito "*" -- "*" Producto
    class CarritoProducto{
        +int carrito_id
        +int producto_id
        +int cantidad
        +String talla
        +String color
    }
```

## Patrones de Diseño Implementados

### Repository Pattern
```mermaid
classDiagram
    class IRepository {
        <<interface>>
        +crear()
        +obtener()
        +actualizar()
        +eliminar()
    }
    class ProductoRepository {
        +crear(producto)
        +obtener(id)
        +actualizar(producto)
        +eliminar(id)
    }
    class UsuarioRepository {
        +crear(usuario)
        +obtener(id)
        +actualizar(usuario)
        +eliminar(id)
    }
    IRepository <|.. ProductoRepository
    IRepository <|.. UsuarioRepository
```

### Factory Pattern
```mermaid
classDiagram
    class DatabaseFactory {
        +crearConexion()
    }
    class MySQLConnection {
        +conectar()
        +desconectar()
        +ejecutarQuery()
    }
    class SQLiteConnection {
        +conectar()
        +desconectar()
        +ejecutarQuery()
    }
    DatabaseFactory --> MySQLConnection
    DatabaseFactory --> SQLiteConnection
``` 