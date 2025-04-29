// public/js/productos-hombres.js
class ProductosHombres extends ProductosManager {
    constructor() {
        super('hombre');
    }

    // Aquí podemos agregar métodos específicos para productos de hombres si es necesario
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const productosHombres = new ProductosManager('hombre');
    productosHombres.init();
});

// public/js/productos-hombres.js (continuación)
async function cargarProductos() {
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
    // Construir URL con parámetros de filtro
    let url = '/api/productos?genero=hombre';
    if (tipo) url += `&tipo=${tipo}`;
    if (talla) url += `&talla=${talla}`;
    if (color) url += `&color=${color}`;
    
    const response = await fetch(url);
    const productos = await response.json();
    
    if (productos.length === 0) {
      if (contenedorProductos) contenedorProductos.style.display = 'none';
      if (noProductos) noProductos.style.display = 'flex';
      return;
    }
    
    if (contenedorProductos) contenedorProductos.style.display = 'grid';
    if (noProductos) noProductos.style.display = 'none';
    
    // Renderizar productos
    contenedorProductos.innerHTML = productos.map(producto => {
      // Determinar tallas disponibles
      const tallas = producto.tallas ? producto.tallas.split(',') : [];
      const colores = producto.colores ? producto.colores.split(',') : [];
      
      // Formatear precio
      const precioFormateado = parseInt(producto.precio).toLocaleString('es-CO');
      
      return `
        <div class="producto-card" data-id="${producto.id}">
          <img src="${producto.imagen || '/imagenes/productos/placeholder.jpg'}" alt="${producto.nombre}" class="producto-img">
          <h3 class="producto-titulo">${producto.nombre}</h3>
          <p class="producto-precio">$${precioFormateado}</p>
          <p class="producto-descripcion">${producto.descripcion ? producto.descripcion.substring(0, 100) + '...' : ''}</p>
          
          <div class="producto-opciones">
            <div class="select-grupo">
              <label for="talla-${producto.id}">Talla</label>
              <select class="select-talla" id="talla-${producto.id}" required>
                <option value="">Seleccionar talla</option>
                ${tallas.map(talla => `<option value="${talla}">${talla}</option>`).join('')}
              </select>
            </div>
            
            <div class="select-grupo">
              <label for="color-${producto.id}">Color</label>
              <select class="select-color" id="color-${producto.id}" required>
                <option value="">Seleccionar color</option>
                ${colores.map(color => `<option value="${color}">${color}</option>`).join('')}
              </select>
            </div>
          </div>
          
          <button class="btn-agregar-carrito" data-id="${producto.id}">
            <i class="fas fa-shopping-cart"></i> Agregar al carrito
          </button>
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
  
  console.log("Enviando al carrito:", producto, talla, color);
  
  // Agregar al carrito
  Carrito.agregarItem(producto, talla, color, 1);
}

function resetearFiltros() {
  const tipo = document.getElementById('tipo-filtro');
  const talla = document.getElementById('talla-filtro');
  const color = document.getElementById('color-filtro');
  
  if (tipo) tipo.value = '';
  if (talla) talla.value = '';
  if (color) color.value = '';
  
  cargarProductos();
}

// Datos de productos para hombres
const productosHombres = [
    {
        id: 1,
        nombre: "Zapatos Oxford Negros",
        precio: 159900,
        descripcion: "Elegantes zapatos Oxford ideales para ocasiones formales.",
        imagen: "/imagenes/productos/hombres/oxford-negro.jpg",
        tipo: "formal",
        tallas: ["38", "39", "40", "41", "42", "43", "44"]
    },
    {
        id: 2,
        nombre: "Botas Casuales Marrones",
        precio: 189900,
        descripcion: "Botas casuales en cuero marrón, perfectas para uso diario.",
        imagen: "/imagenes/productos/hombres/botas-casual.jpg",
        tipo: "casual",
        tallas: ["38", "39", "40", "41", "42", "43"]
    },
    {
        id: 3,
        nombre: "Tenis Deportivos",
        precio: 129900,
        descripcion: "Tenis deportivos con diseño moderno y máxima comodidad.",
        imagen: "/imagenes/productos/hombres/tenis-deportivo.jpg",
        tipo: "deportivo",
        tallas: ["38", "39", "40", "41", "42", "43", "44"]
    },
    {
        id: 4,
        nombre: "Mocasines Elegantes",
        precio: 149900,
        descripcion: "Mocasines elegantes y cómodos, ideales para uso diario o eventos casuales.",
        imagen: "/imagenes/productos/hombres/mocasines.jpg",
        tipo: "casual",
        tallas: ["38", "39", "40", "41", "42", "43"]
    },
    {
        id: 5,
        nombre: "Zapatos de Vestir",
        precio: 179900,
        descripcion: "Zapatos de vestir en cuero de primera calidad, perfectos para reuniones formales.",
        imagen: "/imagenes/productos/hombres/zapatos-vestir.jpg",
        tipo: "formal",
        tallas: ["38", "39", "40", "41", "42", "43"]
    },
    {
        id: 6,
        nombre: "Zapatillas Running",
        precio: 199900,
        descripcion: "Zapatillas especiales para running con tecnología de amortiguación avanzada.",
        imagen: "/imagenes/productos/hombres/zapatillas-running.jpg",
        tipo: "deportivo",
        tallas: ["38", "39", "40", "41", "42", "43", "44"]
    }
];

document.addEventListener('DOMContentLoaded', function() {
    const contenedorProductos = document.getElementById('productos-hombres');
    const noProductos = document.getElementById('no-productos');
    const filtroTipo = document.getElementById('tipo-filtro');
    const filtroTalla = document.getElementById('talla-filtro');

    // Función para crear el HTML de un producto
    function crearProductoHTML(producto) {
        const precioFormateado = producto.precio.toLocaleString('es-CO');
        return `
            <div class="producto-card">
                <img src="${producto.imagen}" alt="${producto.nombre}" class="producto-img">
                <div class="producto-info">
                    <h3 class="producto-titulo">${producto.nombre}</h3>
                    <p class="producto-precio">$${precioFormateado}</p>
                    <p class="producto-descripcion">${producto.descripcion}</p>
                    <div class="talla-selector">
                        <label for="talla-${producto.id}">Talla:</label>
                        <select id="talla-${producto.id}" class="select-talla">
                            <option value="">Seleccionar talla</option>
                            ${producto.tallas.map(talla => `<option value="${talla}">${talla}</option>`).join('')}
                        </select>
                    </div>
                    <button class="btn-agregar-carrito" data-id="${producto.id}">
                        <i class="fas fa-shopping-cart"></i>
                        Agregar al carrito
                    </button>
                </div>
            </div>
        `;
    }

    // Función para filtrar productos
    function filtrarProductos() {
        const tipo = filtroTipo.value;
        const talla = filtroTalla.value;

        const productosFiltrados = productosHombres.filter(producto => {
            const cumpleTipo = !tipo || producto.tipo === tipo;
            const cumpleTalla = !talla || producto.tallas.includes(talla);
            return cumpleTipo && cumpleTalla;
        });

        if (productosFiltrados.length === 0) {
            if (contenedorProductos) contenedorProductos.style.display = 'none';
            if (noProductos) noProductos.style.display = 'flex';
        } else {
            if (contenedorProductos) contenedorProductos.style.display = 'grid';
            if (noProductos) noProductos.style.display = 'none';
            contenedorProductos.innerHTML = productosFiltrados
                .map(producto => crearProductoHTML(producto))
                .join('');
            
            // Agregar event listeners a los botones
            const botonesAgregar = document.querySelectorAll('.btn-agregar-carrito');
            botonesAgregar.forEach(boton => {
                boton.addEventListener('click', agregarAlCarrito);
            });
        }
    }

    // Función para agregar al carrito
    function agregarAlCarrito(event) {
        event.preventDefault();
        
        const boton = event.currentTarget;
        const productoId = boton.dataset.id;
        const productoCard = boton.closest('.producto-card');
        
        const talla = productoCard.querySelector('.select-talla').value;
        
        if (!talla) {
            alert('Por favor selecciona una talla');
            return;
        }
        
        const producto = productosHombres.find(p => p.id === parseInt(productoId));
        if (producto) {
            // Asumiendo que existe una clase Carrito global
            if (typeof Carrito !== 'undefined') {
                Carrito.agregarItem(producto, talla, 1);
                alert('Producto agregado al carrito');
            } else {
                console.error('La clase Carrito no está definida');
            }
        }
    }

    // Event listeners para filtros
    if (filtroTipo) filtroTipo.addEventListener('change', filtrarProductos);
    if (filtroTalla) filtroTalla.addEventListener('change', filtrarProductos);

    // Botón para resetear filtros
    const btnReset = document.getElementById('reset-filtros');
    if (btnReset) {
        btnReset.addEventListener('click', function() {
            if (filtroTipo) filtroTipo.value = '';
            if (filtroTalla) filtroTalla.value = '';
            filtrarProductos();
        });
    }

    // Cargar todos los productos inicialmente
    filtrarProductos();
});