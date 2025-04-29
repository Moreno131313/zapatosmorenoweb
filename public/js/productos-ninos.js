class ProductosNinos extends ProductosManager {
    constructor() {
        super('ninos');
        this.productos = [
            {
                id: 'nin-001',
                nombre: 'Zapatilla Escolar Azul',
                precio: 79900,
                descripcion: 'Zapatilla escolar resistente con refuerzo en puntera',
                imagen: '/imagenes/productos/ninos/zapatilla-escolar-azul.jpg',
                tipo: 'Escolar',
                tallas: ['28', '29', '30', '31', '32', '33', '34'],
                colores: ['Azul', 'Negro']
            },
            {
                id: 'nin-002',
                nombre: 'Bota Outdoor Niño',
                precio: 89900,
                descripcion: 'Bota resistente para actividades al aire libre',
                imagen: '/imagenes/productos/ninos/bota-outdoor-nino.jpg',
                tipo: 'Botas',
                tallas: ['30', '31', '32', '33', '34', '35'],
                colores: ['Marrón', 'Negro', 'Verde']
            },
            {
                id: 'nin-003',
                nombre: 'Sandalia Niña Rosa',
                precio: 69900,
                descripcion: 'Sandalia cómoda y ligera para el verano',
                imagen: '/imagenes/productos/ninos/sandalia-nina-rosa.jpg',
                tipo: 'Sandalias',
                tallas: ['25', '26', '27', '28', '29', '30'],
                colores: ['Rosa', 'Blanco', 'Azul']
            },
            {
                id: 'nin-004',
                nombre: 'Zapatilla Deportiva Niño',
                precio: 89900,
                descripcion: 'Zapatilla con suela acolchada para deportes',
                imagen: '/imagenes/productos/ninos/zapatilla-deportiva-nino.jpg',
                tipo: 'Deportivo',
                tallas: ['30', '31', '32', '33', '34', '35'],
                colores: ['Azul', 'Negro', 'Rojo']
            },
            {
                id: 'nin-005',
                nombre: 'Zapato Primeros Pasos',
                precio: 59900,
                descripcion: 'Zapato anatómico para los primeros pasos de tu bebé',
                imagen: '/imagenes/productos/ninos/zapato-primeros-pasos.jpg',
                tipo: 'Primeros Pasos',
                tallas: ['18', '19', '20', '21', '22'],
                colores: ['Beige', 'Azul', 'Rosa']
            },
            {
                id: 'nin-006',
                nombre: 'Zapatilla Casual Niña',
                precio: 79900,
                descripcion: 'Zapatilla de lona con diseño colorido para uso diario',
                imagen: '/imagenes/productos/ninos/zapatilla-casual-nina.jpg',
                tipo: 'Casual',
                tallas: ['28', '29', '30', '31', '32', '33'],
                colores: ['Multicolor', 'Rosa', 'Azul']
            }
        ];
    }

    async init() {
        await super.init();
        this.setupEventosEspeciales();
    }

    setupEventosEspeciales() {
        // Agregar eventos específicos para la sección de niños
        const filtroGenero = document.getElementById('genero-filtro');
        if (filtroGenero) {
            filtroGenero.addEventListener('change', () => {
                this.filtros.genero = filtroGenero.value;
                this.renderizarProductos();
            });
        }
    }

    renderizarProducto(producto) {
        return `
            <div class="producto-card" data-id="${producto.id}">
                <div class="producto-img-container">
                    <img src="${producto.imagen}" alt="${producto.nombre}" class="producto-img">
                </div>
                <div class="producto-info">
                    <h3 class="producto-titulo">${producto.nombre}</h3>
                    <p class="producto-precio">$${producto.precio.toLocaleString('es-CO')}</p>
                    <p class="producto-descripcion">${producto.descripcion}</p>
                    
                    <div class="producto-opciones">
                        <div class="select-grupo" style="grid-column: span 2;">
                            <label for="talla-${producto.id}">Talla</label>
                            <select class="select-talla" id="talla-${producto.id}" required>
                                <option value="">Seleccionar talla</option>
                                ${producto.tallas.map(talla => `<option value="${talla}">${talla}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <button class="btn-agregar-carrito" onclick="window['productosninos'].agregarAlCarrito('${producto.id}')">
                        <i class="fas fa-shopping-cart"></i> Agregar al carrito
                    </button>
                </div>
            </div>
        `;
    }

    filtrarProductos() {
        return this.productos.filter(producto => {
            // Filtros básicos heredados
            const cumpleTipo = !this.filtros.tipo || producto.tipo === this.filtros.tipo;
            const cumpleTalla = !this.filtros.talla || producto.tallas.includes(this.filtros.talla);
            
            // Filtro adicional por género (niños/niñas/bebé)
            let cumpleGenero = true;
            if (this.filtros.genero) {
                if (this.filtros.genero === 'ninos') {
                    cumpleGenero = ['nin-001', 'nin-002', 'nin-004'].includes(producto.id);
                } else if (this.filtros.genero === 'ninas') {
                    cumpleGenero = ['nin-003', 'nin-006'].includes(producto.id);
                } else if (this.filtros.genero === 'bebes') {
                    cumpleGenero = ['nin-005'].includes(producto.id);
                }
            }
            
            return cumpleTipo && cumpleTalla && cumpleGenero;
        });
    }

    // Sobrescribir el método agregarAlCarrito para que no requiera color
    agregarAlCarrito(productoId) {
        const productoCard = document.querySelector(`.producto-card[data-id="${productoId}"]`);
        const talla = productoCard.querySelector('.select-talla').value;
        
        if (!talla) {
            alert('Por favor selecciona una talla');
            return;
        }
        
        const producto = this.productos.find(p => p.id === productoId);
        if (!producto) return;
        
        // Agregar al carrito con color por defecto
        const item = {
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            talla: talla,
            color: producto.colores[0], // Usamos el primer color disponible por defecto
            cantidad: 1
        };
        
        if (typeof Carrito !== 'undefined') {
            Carrito.agregarItem(item);
            
            // Mostrar mensaje de éxito
            const mensaje = document.createElement('div');
            mensaje.className = 'mensaje-agregado';
            mensaje.innerHTML = '<i class="fas fa-check"></i> Producto agregado al carrito';
            document.body.appendChild(mensaje);
            
            // Ocultar mensaje después de 2 segundos
            setTimeout(() => {
                mensaje.remove();
            }, 2000);
        } else {
            console.error('El objeto Carrito no está definido');
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.productosNinos = new ProductosNinos();
    window.productosNinos.init();
});