# Zapatos Moreno - E-commerce de Calzado

## Descripción del Proyecto
Sistema de e-commerce especializado en la venta de calzado, desarrollado con Node.js y Express para el backend, y una arquitectura moderna de componentes para el frontend.

## Arquitectura del Sistema

### Capas de la Aplicación
1. **Capa de Presentación (Frontend)**
   - Componentes React
   - Gestión de estado
   - Interfaces de usuario
   
2. **Capa de Negocio (Backend)**
   - API REST
   - Lógica de negocio
   - Servicios
   
3. **Capa de Datos**
   - MySQL para datos principales
   - SQLite para caché y datos locales

### Patrones de Diseño Implementados
- MVC (Model-View-Controller)
- Repository Pattern
- Factory Pattern
- Singleton para conexiones DB

## Estructura del Proyecto
```
zapatosmorenoweb/
├── controllers/     # Controladores de la aplicación
├── models/         # Modelos de datos
├── routes/         # Rutas de la API
├── middleware/     # Middleware de autenticación y validación
├── utils/          # Utilidades y helpers
├── config/         # Configuraciones
├── db/            # Scripts y configuración de base de datos
├── public/        # Archivos estáticos
└── tests/         # Pruebas unitarias
```

## Requisitos del Sistema
- Node.js v14 o superior
- MySQL 8.0
- SQLite 3
- npm o yarn

## Configuración del Ambiente de Desarrollo

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/zapatosmorenoweb.git

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Inicializar la base de datos
npm run db:setup
```

### Variables de Entorno
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=zapatosmoreno
JWT_SECRET=tu_secret_key
```

## Endpoints de la API

### Autenticación
- POST /api/auth/registro
- POST /api/auth/login

### Productos
- GET /api/productos
- GET /api/productos/:id
- GET /api/productos/:id/inventario

### Carrito
- GET /api/carrito
- POST /api/carrito/agregar
- PUT /api/carrito/actualizar/:id

### Direcciones
- GET /api/direcciones
- POST /api/direcciones
- PUT /api/direcciones/:id

## Seguridad
- Autenticación JWT
- Validación de datos con express-validator
- Sanitización de entradas
- CORS configurado
- Encriptación de contraseñas con bcrypt

## Pruebas
```bash
# Ejecutar pruebas unitarias
npm run test

# Ejecutar pruebas de integración
npm run test:integration
```

## Control de Versiones
El proyecto utiliza Git para el control de versiones. Las ramas principales son:
- main: Producción
- develop: Desarrollo
- feature/*: Nuevas características
- hotfix/*: Correcciones urgentes

## Frameworks y Librerías Utilizadas

### Backend
- Express.js - Framework web
- Sequelize - ORM
- JWT - Autenticación
- bcrypt - Encriptación
- express-validator - Validación

### Frontend (si aplica)
- React.js
- Redux - Gestión de estado
- Axios - Cliente HTTP
- Material-UI - Componentes UI

## Documentación Adicional
- [Diagrama de Clases](./docs/class-diagram.md)
- [Diagrama de Componentes](./docs/component-diagram.md)
- [Casos de Uso](./docs/use-cases.md)
- [Manual de Despliegue](./docs/deployment.md)

## Contribución
1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia
Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## Contacto
- Email: info@zapatosmoreno.com
- Sitio web: www.zapatosmoreno.com 