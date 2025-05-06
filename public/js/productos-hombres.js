// public/js/productos-hombres.js
class ProductosHombres extends ProductosManager {
    constructor() {
        super('hombre');
    }

    // Aquí podemos agregar métodos específicos para productos de hombres si es necesario
}

// Inicializar cuando el DOM esté listo
// document.addEventListener('DOMContentLoaded', () => {
//     window.productosHombres = new ProductosManager('hombre');
//     window.productosHombres.init();
// });

// Datos de productos para hombres
const productosHombres = [
    {
        id: 1,
        nombre: "Zapatos Oxford Negros",
        precio: 159900,
        descripcion: "Elegantes zapatos Oxford ideales para ocasiones formales.",
        imagen: "/imagenes/productos/hombres/oxford-negro.jpg",
        tipo: "formal",
        tallas: ["38", "39", "40", "41", "42", "43", "44"],
        colores: ["Negro", "Marrón"],
        materiales: "Cuero genuino, suela de goma antideslizante, forro interior de tela suave",
        inventario: {
            "Negro": ["38", "39", "40", "41", "42", "43"],
            "Marrón": ["39", "40", "41", "42"]
        }
    },
    {
        id: 2,
        nombre: "Botas Casuales Marrones",
        precio: 189900,
        descripcion: "Botas casuales en cuero marrón, perfectas para uso diario.",
        imagen: "/imagenes/productos/hombres/botas-casual.jpg",
        tipo: "casual",
        tallas: ["38", "39", "40", "41", "42", "43"],
        colores: ["Marrón", "Negro"],
        materiales: "Exterior de cuero natural, interior acolchado, suela de goma resistente",
        inventario: {
            "Marrón": ["38", "39", "40", "41", "42", "43"],
            "Negro": ["38", "40", "41", "43"]
        }
    },
    {
        id: 3,
        nombre: "Tenis Deportivos",
        precio: 129900,
        descripcion: "Tenis deportivos con diseño moderno y máxima comodidad.",
        imagen: "/imagenes/productos/hombres/tenis-deportivo.jpg",
        tipo: "deportivo",
        tallas: ["38", "39", "40", "41", "42", "43", "44"],
        colores: ["Azul", "Negro", "Rojo"],
        materiales: "Malla transpirable, plantilla de espuma viscoelástica, suela de goma con tecnología de amortiguación",
        inventario: {
            "Azul": ["38", "39", "40", "42", "43", "44"],
            "Negro": ["38", "39", "40", "41", "42", "43", "44"],
            "Rojo": ["39", "40", "42", "43"]
        }
    },
    {
        id: 4,
        nombre: "Mocasines Elegantes",
        precio: 149900,
        descripcion: "Mocasines elegantes y cómodos, ideales para uso diario o eventos casuales.",
        imagen: "/imagenes/productos/hombres/mocasines.jpg",
        tipo: "casual",
        tallas: ["38", "39", "40", "41", "42", "43"],
        colores: ["Negro", "Marrón"],
        materiales: "Cuero premium, plantilla acolchada, suela flexible de goma",
        inventario: {
            "Negro": ["38", "39", "40", "41", "42"],
            "Marrón": ["38", "39", "41", "42", "43"]
        }
    },
    {
        id: 5,
        nombre: "Zapatos de Vestir",
        precio: 179900,
        descripcion: "Zapatos de vestir en cuero de primera calidad, perfectos para reuniones formales.",
        imagen: "/imagenes/productos/hombres/zapatos-vestir.jpg",
        tipo: "formal",
        tallas: ["38", "39", "40", "41", "42", "43"],
        colores: ["Negro", "Marrón"],
        materiales: "Cuero italiano de alta calidad, suela de cuero, forro interior de piel",
        inventario: {
            "Negro": ["39", "40", "41", "42", "43"],
            "Marrón": ["38", "40", "41", "42"]
        }
    },
    {
        id: 6,
        nombre: "Zapatillas Running",
        precio: 199900,
        descripcion: "Zapatillas especiales para running con tecnología de amortiguación avanzada.",
        imagen: "/imagenes/productos/hombres/zapatillas-running.jpg",
        tipo: "deportivo",
        tallas: ["38", "39", "40", "41", "42", "43", "44"],
        colores: ["Azul", "Negro", "Rojo"],
        materiales: "Tejido sintético ligero, plantilla de espuma con memoria, suela con tecnología de absorción de impactos",
        inventario: {
            "Azul": ["38", "39", "41", "42", "43", "44"],
            "Negro": ["38", "39", "40", "41", "42", "43"],
            "Rojo": ["39", "40", "42", "44"]
        }
    }
];

// public/js/productos-hombres.js (continuación)
function cargarProductos() {
  const contenedorProductos = document.getElementById('productos-hombres');
  const noProductos = document.getElementById('no-productos');
  
  if (!contenedorProductos) return;
  
  // Mostrar indicador de carga
  contenedorProductos.innerHTML = '<div class="loading">Cargando productos...</div>';
  
  // Obtener valores de filtros
  const tipo = document.getElementById('tipo-filtro')?.value || '';
  const talla = document.getElementById('talla-filtro')?.value || '';
  const color = document.getElementById('color-filtro')?.value || '';
  
  try {
    // Filtrar productos localmente en lugar de usar la API
    let productos = [...productosHombres];
    
    if (tipo) {
      productos = productos.filter(p => p.tipo.toLowerCase() === tipo.toLowerCase());
    }
    
    if (talla) {
      productos = productos.filter(p => p.tallas.includes(talla));
    }
    
    if (color) {
      productos = productos.filter(p => p.colores.some(c => c.toLowerCase() === color.toLowerCase()));
    }
    
    if (productos.length === 0) {
      if (contenedorProductos) contenedorProductos.style.display = 'none';
      if (noProductos) noProductos.style.display = 'flex';
      return;
    }
    
    if (contenedorProductos) contenedorProductos.style.display = 'grid';
    if (noProductos) noProductos.style.display = 'none';
    
    // Renderizar productos
    contenedorProductos.innerHTML = productos.map(producto => {
      // Formatear precio
      const precioFormateado = producto.precio.toLocaleString('es-CO');
      
      // Asegurar que la imagen tenga ruta absoluta
      let imagenSrc = producto.imagen || '/imagenes/productos/placeholder.jpg';
      if (!imagenSrc.startsWith('/')) {
        imagenSrc = '/' + imagenSrc;
      }
      
      return `
        <div class="producto-card" data-id="${producto.id}">
          <a href="/detalle-producto.html?id=${producto.id}" class="producto-link">
            <img src="${imagenSrc}" alt="${producto.nombre}" class="producto-img">
          </a>
          <div class="producto-info">
            <a href="/detalle-producto.html?id=${producto.id}" class="producto-link">
              <h3 class="producto-titulo">${producto.nombre}</h3>
            </a>
            <p class="producto-precio">$${precioFormateado}</p>
            <p class="producto-descripcion">${producto.descripcion ? producto.descripcion.substring(0, 100) + '...' : ''}</p>
            
            <div class="producto-opciones">
              <div class="select-grupo">
                <label for="talla-${producto.id}">Talla</label>
                <select class="select-talla" id="talla-${producto.id}" required>
                  <option value="">Seleccionar talla</option>
                  ${producto.tallas.map(talla => `<option value="${talla}">${talla}</option>`).join('')}
                </select>
              </div>
              
              <div class="select-grupo">
                <label for="color-${producto.id}">Color</label>
                <select class="select-color" id="color-${producto.id}" required>
                  <option value="">Seleccionar color</option>
                  ${producto.colores.map(color => `<option value="${color}">${color}</option>`).join('')}
                </select>
              </div>
            </div>
            
            <div class="producto-acciones">
              <button class="btn-agregar-carrito" data-id="${producto.id}">
                <i class="fas fa-shopping-cart"></i> Agregar al carrito
              </button>
              <a href="/detalle-producto.html?id=${producto.id}" class="btn-ver-detalle">
                <i class="fas fa-eye"></i> Ver detalle
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Agregar event listeners a los botones
    const botonesAgregar = document.querySelectorAll('.btn-agregar-carrito');
    botonesAgregar.forEach(boton => {
      boton.addEventListener('click', agregarAlCarrito);
    });
  } catch (error) {
    console.error('Error al cargar productos:', error);
    contenedorProductos.innerHTML = '<div class="error">Error al cargar productos. Intenta nuevamente.</div>';
  }
}

function agregarAlCarrito(event) {
  event.preventDefault();
  
  const boton = event.currentTarget;
  const productoId = boton.dataset.id;
  const productoCard = boton.closest('.producto-card');
  
  const talla = productoCard.querySelector('.select-talla').value;
  const color = productoCard.querySelector('.select-color').value;
  
  if (!talla || !color) {
    alert('Por favor selecciona talla y color');
    return;
  }
  
  const producto = {
    id: productoId,
    nombre: productoCard.querySelector('.producto-titulo').textContent,
    precio: parseFloat(productoCard.querySelector('.producto-precio').textContent.replace('$', '').replace(/\./g, '').replace(',', '.')),
    imagen: productoCard.querySelector('.producto-img').src,
  };
  
  // Agregar al carrito
  if (typeof Carrito !== 'undefined') {
    try {
      producto.talla = talla;
      producto.color = color;
      producto.cantidad = 1;
      
      Carrito.agregarItem(producto);
      
      // Mostrar notificación
      const notificacion = document.createElement('div');
      notificacion.className = 'notificacion';
      notificacion.textContent = `${producto.nombre} añadido al carrito`;
      document.body.appendChild(notificacion);
      
      setTimeout(() => {
        notificacion.classList.add('fadeout');
        setTimeout(() => notificacion.remove(), 500);
      }, 2500);
      
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      alert('Ocurrió un error al agregar el producto al carrito');
    }
  } else {
    console.error('El objeto Carrito no está disponible');
    alert('Error: No se pudo agregar al carrito');
  }
}

function resetearFiltros() {
  // Obtener elementos
  const tipoFiltro = document.getElementById('tipo-filtro');
  const tallaFiltro = document.getElementById('talla-filtro');
  const colorFiltro = document.getElementById('color-filtro');
  
  // Resetear valores
  if (tipoFiltro) tipoFiltro.value = '';
  if (tallaFiltro) tallaFiltro.value = '';
  if (colorFiltro) colorFiltro.value = '';
  
  // Volver a cargar productos sin filtros
  cargarProductos();
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  const filtroTipo = document.getElementById('tipo-filtro');
  const filtroTalla = document.getElementById('talla-filtro');
  const filtroColor = document.getElementById('color-filtro');
  const btnResetear = document.getElementById('reset-filtros');
  
  // Añadir event listeners a los filtros
  if (filtroTipo) filtroTipo.addEventListener('change', cargarProductos);
  if (filtroTalla) filtroTalla.addEventListener('change', cargarProductos);
  if (filtroColor) filtroColor.addEventListener('change', cargarProductos);
  if (btnResetear) btnResetear.addEventListener('click', resetearFiltros);
  
  // Cargar productos al inicio
  cargarProductos();
});