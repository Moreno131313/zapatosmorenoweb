// Clase para los productos de niños
class ProductosNinos extends ProductosManager {
    constructor() {
        super('nino');
    }

    // Aquí podemos agregar métodos específicos para productos de niños si es necesario
}

// Inicializar cuando el DOM esté listo
// document.addEventListener('DOMContentLoaded', () => {
//     window.productosNino = new ProductosManager('nino');
//     window.productosNino.init();
// });

// Datos de productos para niños
const productosNinos = [
    {
        id: 13,
        nombre: "Zapatilla Escolar Azul",
        precio: 79900,
        descripcion: "Zapatilla escolar resistente con refuerzo en puntera",
        imagen: "/imagenes/productos/ninos/zapatilla-escolar-azul.jpg",
        tipo: "Escolar",
        genero: "ninos",
        tallas: ["28", "29", "30", "31", "32", "33", "34"],
        colores: ["Azul", "Negro"],
        materiales: "Cuero sintético resistente al agua, suela de goma reforzada, forro antibacteriano",
        inventario: {
            "Azul": ["28", "29", "30", "31", "32", "33", "34"],
            "Negro": ["29", "30", "31", "32", "33"]
        }
    },
    {
        id: 14,
        nombre: "Sandalia Niña Verano",
        precio: 59900,
        descripcion: "Sandalia para niña con tiras y detalle floral",
        imagen: "/imagenes/productos/ninos/sandalia-nina-rosa.jpg",
        tipo: "Sandalias",
        genero: "ninas",
        tallas: ["24", "25", "26", "27", "28", "29"],
        colores: ["Rosa", "Blanco", "Azul claro"],
        materiales: "Sintético suave, plantilla acolchada, suela flexible con agarre antideslizante",
        inventario: {
            "Rosa": ["24", "25", "26", "27", "28", "29"],
            "Blanco": ["24", "25", "26", "27", "28"],
            "Azul claro": ["25", "26", "27", "28", "29"]
        }
    },
    {
        id: 15,
        nombre: "Bota Niño Outdoor",
        precio: 89900,
        descripcion: "Bota para niño ideal para actividades al aire libre",
        imagen: "/imagenes/productos/ninos/bota-outdoor-nino.jpg",
        tipo: "Botas",
        genero: "ninos",
        tallas: ["30", "31", "32", "33", "34", "35"],
        colores: ["Marrón", "Negro", "Verde"],
        materiales: "Exterior resistente al agua, forro térmico interior, suela de goma con tracción reforzada",
        inventario: {
            "Marrón": ["30", "31", "32", "33", "34", "35"],
            "Negro": ["30", "31", "32", "33", "34"],
            "Verde": ["31", "32", "33", "34", "35"]
        }
    },
    {
        id: 16,
        nombre: "Zapatito Primeros Pasos",
        precio: 69900,
        descripcion: "Zapatos para bebé que inicia a caminar con suela flexible",
        imagen: "/imagenes/productos/ninos/zapato-primeros-pasos.jpg",
        tipo: "Primeros Pasos",
        genero: "bebes",
        tallas: ["18", "19", "20", "21", "22"],
        colores: ["Blanco", "Azul", "Beige"],
        materiales: "Cuero natural hipoalergénico, suela ultra flexible, cierre con velcro ajustable",
        inventario: {
            "Blanco": ["18", "19", "20", "21", "22"],
            "Azul": ["18", "19", "20", "21"],
            "Beige": ["19", "20", "21", "22"]
        }
    },
    {
        id: 17,
        nombre: "Tenis Deportivo Niño",
        precio: 84900,
        descripcion: "Tenis deportivo con amortiguación y suela antideslizante",
        imagen: "/imagenes/productos/ninos/zapatilla-deportiva-nino.jpg",
        tipo: "Deportivo",
        genero: "ninos",
        tallas: ["28", "29", "30", "31", "32", "33", "34"],
        colores: ["Negro/Verde", "Azul/Rojo", "Gris/Amarillo"],
        materiales: "Malla transpirable, plantilla con amortiguación, suela de goma con sistema de flexibilidad",
        inventario: {
            "Negro/Verde": ["28", "29", "30", "31", "32", "33"],
            "Azul/Rojo": ["28", "29", "30", "31", "32", "34"],
            "Gris/Amarillo": ["29", "30", "31", "32", "33", "34"]
        }
    },
    {
        id: 18,
        nombre: "Bailarina Niña Escolar",
        precio: 64900,
        descripcion: "Bailarina escolar con detalle de lazo y cierre ajustable",
        imagen: "/imagenes/productos/ninos/zapatilla-casual-nina.jpg",
        tipo: "Escolar",
        genero: "ninas",
        tallas: ["26", "27", "28", "29", "30", "31", "32"],
        colores: ["Negro", "Azul marino"],
        materiales: "Cuero sintético, plantilla acolchada, suela antideslizante con absorción de impacto",
        inventario: {
            "Negro": ["26", "27", "28", "29", "30", "31", "32"],
            "Azul marino": ["27", "28", "29", "30", "31"]
        }
    }
];

// Función para cargar productos
function cargarProductos() {
    const contenedorProductos = document.getElementById('productos-ninos');
    const noProductos = document.getElementById('no-productos');
    
    if (!contenedorProductos) return;
    
    // Mostrar indicador de carga
    contenedorProductos.innerHTML = '<div class="loading">Cargando productos...</div>';
    
    // Obtener valores de filtros
    const genero = document.getElementById('genero-filtro')?.value || '';
    const tipo = document.getElementById('tipo-filtro')?.value || '';
    const talla = document.getElementById('talla-filtro')?.value || '';
    
    try {
        // Filtrar productos
        let productos = [...productosNinos];
        
        if (genero) {
            productos = productos.filter(p => p.genero === genero);
        }
        
        if (tipo) {
            productos = productos.filter(p => p.tipo === tipo);
        }
        
        if (talla) {
            productos = productos.filter(p => p.tallas.includes(talla));
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
    const generoFiltro = document.getElementById('genero-filtro');
    const tipoFiltro = document.getElementById('tipo-filtro');
    const tallaFiltro = document.getElementById('talla-filtro');
    
    // Resetear valores
    if (generoFiltro) generoFiltro.value = '';
    if (tipoFiltro) tipoFiltro.value = '';
    if (tallaFiltro) tallaFiltro.value = '';
    
    // Volver a cargar productos sin filtros
    cargarProductos();
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    const filtroGenero = document.getElementById('genero-filtro');
    const filtroTipo = document.getElementById('tipo-filtro');
    const filtroTalla = document.getElementById('talla-filtro');
    const btnResetear = document.getElementById('reset-filtros');
    
    // Añadir event listeners a los filtros
    if (filtroGenero) filtroGenero.addEventListener('change', cargarProductos);
    if (filtroTipo) filtroTipo.addEventListener('change', cargarProductos);
    if (filtroTalla) filtroTalla.addEventListener('change', cargarProductos);
    if (btnResetear) btnResetear.addEventListener('click', resetearFiltros);
    
    // Cargar productos al inicio
    cargarProductos();
});