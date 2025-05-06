// Módulo para gestionar productos de mujeres
class ProductosMujeres extends ProductosManager {
    constructor() {
        super('mujer');
    }

    // Aquí podemos agregar métodos específicos para productos de mujeres si es necesario
}

// Inicializar cuando el DOM esté listo
// document.addEventListener('DOMContentLoaded', () => {
//     window.productosMujer = new ProductosManager('mujer');
//     window.productosMujer.init();
// });

// Datos de productos para mujeres
const productosMujeres = [
    {
        id: 7,
        nombre: "Tacón Elegante Negro",
        precio: 159900,
        descripcion: "Tacón elegante en cuero negro con acabado brillante",
        imagen: "/imagenes/productos/mujeres/tacon-elegante-negro.jpg",
        tipo: "Tacones",
        tallas: ["35", "36", "37", "38", "39"],
        colores: ["Negro", "Rojo", "Nude"],
        materiales: "Cuero sintético de alta calidad, interior con forro de tela suave, tacón de 10cm",
        inventario: {
            "Negro": ["35", "36", "37", "38", "39"],
            "Rojo": ["35", "36", "37", "38"],
            "Nude": ["36", "37", "38"]
        }
    },
    {
        id: 8,
        nombre: "Sandalia Plataforma",
        precio: 129900,
        descripcion: "Sandalia con plataforma y tiras cruzadas",
        imagen: "/imagenes/productos/mujeres/sandalia-plataforma.jpg",
        tipo: "Sandalias",
        tallas: ["35", "36", "37", "38"],
        colores: ["Dorado", "Plateado", "Negro"],
        materiales: "Cuero sintético, plataforma de corcho natural, plantilla acolchada para mayor comodidad",
        inventario: {
            "Dorado": ["35", "36", "37"],
            "Plateado": ["35", "36", "37", "38"],
            "Negro": ["36", "37", "38"]
        }
    },
    {
        id: 9,
        nombre: "Bota Alta Cuero",
        precio: 249900,
        descripcion: "Bota alta en cuero genuino con cierre lateral",
        imagen: "/imagenes/productos/mujeres/bota-alta-cuero.jpg",
        tipo: "Botas",
        tallas: ["36", "37", "38", "39"],
        colores: ["Marrón", "Negro"],
        materiales: "Cuero genuino de primera calidad, forro interior de piel sintética, suela de goma antideslizante",
        inventario: {
            "Marrón": ["36", "37", "38", "39"],
            "Negro": ["37", "38", "39"]
        }
    },
    {
        id: 10,
        nombre: "Zapato Casual Sport",
        precio: 139900,
        descripcion: "Zapato casual deportivo con suela confortable",
        imagen: "/imagenes/productos/mujeres/casual-sport.jpg",
        tipo: "Casuales",
        tallas: ["35", "36", "37", "38", "39"],
        colores: ["Blanco", "Rosa", "Azul"],
        materiales: "Exterior de malla transpirable, suela de EVA ligera, plantilla memory foam extraíble",
        inventario: {
            "Blanco": ["35", "36", "37", "38", "39"],
            "Rosa": ["35", "36", "37", "38"],
            "Azul": ["36", "37", "38", "39"]
        }
    },
    {
        id: 11,
        nombre: "Stiletto Clásico",
        precio: 179900,
        descripcion: "Stiletto clásico en charol con punta fina",
        imagen: "/imagenes/productos/mujeres/stiletto-clasico.jpg",
        tipo: "Tacones",
        tallas: ["35", "36", "37", "38"],
        colores: ["Negro", "Rojo", "Nude"],
        materiales: "Charol de alta calidad, forro interior transpirable, tacón ergonómico de 12cm",
        inventario: {
            "Negro": ["35", "36", "37", "38"],
            "Rojo": ["35", "36", "37"],
            "Nude": ["36", "37", "38"]
        }
    },
    {
        id: 12,
        nombre: "Baleta Elegante",
        precio: 99900,
        descripcion: "Baleta elegante con detalles decorativos",
        imagen: "/imagenes/productos/mujeres/baleta-elegante.jpg",
        tipo: "Baletas",
        tallas: ["35", "36", "37", "38", "39"],
        colores: ["Negro", "Azul", "Beige"],
        materiales: "Exterior de piel sintética suave, plantilla acolchada, suela plana de goma flexible",
        inventario: {
            "Negro": ["35", "36", "37", "38", "39"],
            "Azul": ["35", "36", "37", "38"],
            "Beige": ["36", "37", "38", "39"]
        }
    }
];

// Función para cargar los productos de mujeres
function cargarProductos() {
    const contenedorProductos = document.getElementById('productos-mujeres');
    const noProductos = document.getElementById('no-productos');
    
    if (!contenedorProductos) return;
    
    // Mostrar indicador de carga
    contenedorProductos.innerHTML = '<div class="loading">Cargando productos...</div>';
    
    // Obtener valores de filtros
    const tipo = document.getElementById('tipo-filtro')?.value || '';
    const talla = document.getElementById('talla-filtro')?.value || '';
    const color = document.getElementById('color-filtro')?.value || '';
    
    try {
        // Filtrar productos
        let productos = [...productosMujeres];
        
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
    talla: talla,
    color: color,
    cantidad: 1
  };
  
  // Agregar al carrito
  if (typeof Carrito !== 'undefined') {
    try {
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