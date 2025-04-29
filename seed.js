const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'zapatosmoreno',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('Iniciando script de carga de datos...');
console.log('Configuración:', {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'zapatosmoreno'
});

async function cargarDatosIniciales() {
  try {
    const connection = await pool.getConnection();
    
    try {
      console.log('Comenzando la carga de datos iniciales...');

      // Insertar categorías
      console.log('Insertando categorías...');
      await connection.query(`
        INSERT INTO categorias (nombre, descripcion) VALUES 
        ('Formal', 'Zapatos elegantes para ocasiones formales'),
        ('Casual', 'Zapatos cómodos para uso diario'),
        ('Deportivo', 'Zapatos para actividades deportivas'),
        ('Tacos', 'Zapatos de tacón para mujeres'),
        ('Sandalias', 'Calzado ligero y abierto para clima cálido'),
        ('Botas', 'Calzado que cubre el pie y parte del tobillo'),
        ('Escolares', 'Zapatos para niños en edad escolar'),
        ('Primeros pasos', 'Zapatos para bebés que están comenzando a caminar')
      `);
      
      console.log('Categorías insertadas correctamente');

      // Insertar productos para hombres
      console.log('Insertando productos para hombres...');
      await connection.query(`
        INSERT INTO productos (nombre, descripcion, precio, categoria_id, tipo, genero, imagen, disponible) VALUES 
        ('Zapato Oxford Negro', 'Zapato formal de cuero genuino con diseño clásico Oxford, perfecto para eventos formales y uso profesional.', 159900, 1, 'formal', 'hombre', '/imagenes/productos/hombre-oxford-negro.jpg', 1),
        ('Mocasín Casual Marrón', 'Mocasín casual de cuero sintético, cómodo y versátil para el día a día.', 129900, 2, 'casual', 'hombre', '/imagenes/productos/hombre-mocasin-marron.jpg', 1),
        ('Tenis Deportivo Azul', 'Tenis deportivos con tecnología de amortiguación y suela antideslizante, ideales para running y uso diario.', 149900, 3, 'deportivo', 'hombre', '/imagenes/productos/hombre-tenis-azul.jpg', 1),
        ('Botín Chelsea Negro', 'Botín estilo Chelsea en cuero negro, elegante y fácil de poner con su diseño elastizado en los laterales.', 189900, 6, 'casual', 'hombre', '/imagenes/productos/hombre-botin-chelsea.jpg', 1),
        ('Sandalia Flip Flop Café', 'Sandalias tipo flip flop en tono café, perfectas para playa y clima cálido.', 59900, 5, 'casual', 'hombre', '/imagenes/productos/hombre-sandalia-cafe.jpg', 1)
      `);
      
      console.log('Productos para hombres insertados correctamente');

      // Insertar productos para mujeres
      console.log('Insertando productos para mujeres...');
      await connection.query(`
        INSERT INTO productos (nombre, descripcion, precio, categoria_id, tipo, genero, imagen, disponible) VALUES 
        ('Tacón Stiletto Negro', 'Elegante tacón alto tipo stiletto en color negro, perfecto para eventos formales y uso profesional.', 169900, 4, 'tacos', 'mujer', '/imagenes/productos/mujer-tacon-negro.jpg', 1),
        ('Baleta Casual Beige', 'Baletas cómodas en tono beige, ideales para uso diario, combina con todo.', 89900, 2, 'casual', 'mujer', '/imagenes/productos/mujer-baleta-beige.jpg', 1),
        ('Sandalia de Plataforma Rosada', 'Sandalias de plataforma en color rosa, combinan estilo y comodidad para el verano.', 139900, 5, 'plataformas', 'mujer', '/imagenes/productos/mujer-sandalia-rosada.jpg', 1),
        ('Bota Alta Negra', 'Botas altas en cuero negro con tacón medio, elegantes y versátiles para temporada fría.', 209900, 6, 'botas', 'mujer', '/imagenes/productos/mujer-bota-negra.jpg', 1),
        ('Tenis Fashion Blanco', 'Tenis blancos con detalles modernos, tendencia actual que combina estilo y comodidad.', 159900, 3, 'casual', 'mujer', '/imagenes/productos/mujer-tenis-blanco.jpg', 1)
      `);
      
      console.log('Productos para mujeres insertados correctamente');

      // Insertar productos para niños
      console.log('Insertando productos para niños...');
      await connection.query(`
        INSERT INTO productos (nombre, descripcion, precio, categoria_id, tipo, genero, imagen, disponible) VALUES 
        ('Zapato Escolar Negro Niño', 'Zapato escolar en cuero sintético negro, resistente y cómodo para uso diario escolar.', 89900, 7, 'escolar', 'niño', '/imagenes/productos/nino-zapato-escolar.jpg', 1),
        ('Tenis Deportivo Multicolor Niño', 'Tenis deportivos coloridos con luces LED, diversión y comodidad para los más pequeños.', 109900, 3, 'deportivo', 'niño', '/imagenes/productos/nino-tenis-multicolor.jpg', 1),
        ('Sandalia Rosa Niña', 'Sandalias en color rosa con detalles brillantes, cómodas para días calurosos.', 79900, 5, 'sandalias', 'niña', '/imagenes/productos/nina-sandalia-rosa.jpg', 1),
        ('Zapato Escolar Negro Niña', 'Zapato escolar femenino en cuero sintético negro, elegante y duradero.', 89900, 7, 'escolar', 'niña', '/imagenes/productos/nina-zapato-escolar.jpg', 1),
        ('Zapatito Primeros Pasos Azul', 'Zapatitos suaves y flexibles para bebés que están comenzando a caminar, en color azul.', 69900, 8, 'bebe', 'bebe', '/imagenes/productos/bebe-primeros-pasos.jpg', 1)
      `);
      
      console.log('Productos para niños insertados correctamente');

      // Generar inventario para los productos
      console.log('Generando inventario para productos...');
      const [productos] = await connection.query('SELECT id, genero FROM productos');
      
      for (const producto of productos) {
        let tallas = [];
        let colores = ['Negro', 'Blanco'];
        
        // Asignar tallas y colores según el tipo de producto
        if (producto.genero === 'hombre') {
          tallas = ['38', '39', '40', '41', '42', '43', '44'];
          colores.push('Marrón', 'Azul', 'Gris');
        } else if (producto.genero === 'mujer') {
          tallas = ['34', '35', '36', '37', '38', '39', '40'];
          colores.push('Beige', 'Rosa', 'Rojo');
        } else if (['niño', 'niña'].includes(producto.genero)) {
          tallas = ['24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35'];
          colores.push('Azul', 'Rosa', 'Rojo');
        } else if (producto.genero === 'bebe') {
          tallas = ['18', '19', '20', '21', '22', '23'];
          colores.push('Azul', 'Rosa', 'Amarillo');
        }
        
        console.log(`Generando inventario para producto ID ${producto.id}`);
        
        // Insertar combinaciones de talla y color con stock aleatorio
        for (const talla of tallas) {
          for (const color of colores) {
            const stock = Math.floor(Math.random() * 20) + 5; // Stock entre 5 y 24
            await connection.query(
              'INSERT INTO inventario (producto_id, talla, color, stock) VALUES (?, ?, ?, ?)',
              [producto.id, talla, color, stock]
            );
          }
        }
      }
      
      console.log('Inventario generado correctamente');

      // Insertar un usuario administrador
      console.log('Creando usuario administrador...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(`
        INSERT INTO usuarios (nombre, email, password, telefono, fecha_registro) VALUES 
        ('Administrador', 'admin@zapatosmoreno.com', ?, '3234567890', NOW())
      `, [hashedPassword]);
      
      console.log('Usuario administrador creado correctamente');

      // Insertar cupones de descuento
      console.log('Insertando cupones de descuento...');
      await connection.query(`
        INSERT INTO cupones (codigo, descuento, tipo, fecha_inicio, fecha_fin, cantidad_maxima, cantidad_usada, activo) VALUES 
        ('BIENVENIDO10', 10.00, 'porcentaje', '2023-01-01', '2025-12-31', 1000, 0, 1),
        ('VERANO2023', 15.00, 'porcentaje', '2023-06-01', '2023-08-31', 500, 0, 1),
        ('PROMO50', 50.00, 'porcentaje', '2023-01-01', '2023-12-31', 100, 0, 1)
      `);
      
      console.log('Cupones de descuento insertados correctamente');

      console.log('¡Datos iniciales cargados correctamente!');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    await pool.end();
  }
}

// Ejecutar la función de carga de datos
cargarDatosIniciales().then(() => {
  console.log('Proceso de carga de datos completado.');
});