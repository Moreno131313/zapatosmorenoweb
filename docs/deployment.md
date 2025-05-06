# Manual de Despliegue - Zapatos Moreno

## Requisitos del Sistema

### Software Necesario
- Node.js v14 o superior
- MySQL 8.0
- SQLite 3
- Git
- npm o yarn
- PM2 (para producción)

### Recursos Mínimos del Servidor
- CPU: 2 cores
- RAM: 4GB
- Almacenamiento: 20GB
- SO: Ubuntu 20.04 LTS o superior

## Configuración del Ambiente de Desarrollo

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/zapatosmorenoweb.git
cd zapatosmorenoweb
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
```bash
cp .env.example .env
```

Editar `.env` con los valores correspondientes:
```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=zapatosmoreno

# JWT
JWT_SECRET=tu_secret_key
JWT_EXPIRES_IN=24h

# Correo
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password
```

### 4. Inicializar Base de Datos
```bash
# Crear base de datos
npm run db:create

# Ejecutar migraciones
npm run db:migrate

# Cargar datos iniciales
npm run db:seed
```

## Despliegue en Producción

### 1. Preparación del Servidor

```bash
# Actualizar sistema
sudo apt update
sudo apt upgrade

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar MySQL
sudo apt install mysql-server
sudo mysql_secure_installation

# Instalar PM2
sudo npm install -g pm2
```

### 2. Configurar MySQL

```sql
CREATE DATABASE zapatosmoreno;
CREATE USER 'zapatosmoreno'@'localhost' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON zapatosmoreno.* TO 'zapatosmoreno'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Desplegar Aplicación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/zapatosmorenoweb.git
cd zapatosmorenoweb

# Instalar dependencias
npm install --production

# Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con valores de producción

# Construir aplicación
npm run build

# Iniciar con PM2
pm2 start ecosystem.config.js
```

### 4. Configurar Nginx como Proxy Inverso

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Configurar SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

## Mantenimiento

### Monitoreo
```bash
# Ver logs
pm2 logs

# Monitorear recursos
pm2 monit

# Ver estado de la aplicación
pm2 status
```

### Backups
```bash
# Backup de base de datos
mysqldump -u root -p zapatosmoreno > backup_$(date +%Y%m%d).sql

# Backup de archivos
tar -czf backup_files_$(date +%Y%m%d).tar.gz /ruta/a/zapatosmorenoweb
```

### Actualización
```bash
# Detener aplicación
pm2 stop zapatosmoreno

# Actualizar código
git pull origin main

# Instalar nuevas dependencias
npm install --production

# Ejecutar migraciones
npm run db:migrate

# Reiniciar aplicación
pm2 restart zapatosmoreno
```

## Solución de Problemas

### Problemas Comunes

1. **Error de conexión a la base de datos**
```bash
# Verificar estado de MySQL
sudo systemctl status mysql

# Verificar conexión
mysql -u zapatosmoreno -p -h localhost
```

2. **Error 502 Bad Gateway**
```bash
# Verificar logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar estado de la aplicación
pm2 status
```

3. **Problemas de memoria**
```bash
# Verificar uso de memoria
free -m

# Verificar logs de PM2
pm2 logs
```

### Contacto de Soporte
- Email: soporte@zapatosmoreno.com
- Teléfono: +XX XXX XXX XXXX
- Horario: Lunes a Viernes, 9:00 - 18:00 