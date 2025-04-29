class ProductosMujeres extends ProductosManager {
    constructor() {
        super('mujeres');
        this.productos = [
            {
                id: 'muj-001',
                nombre: 'Tacón Elegante Negro',
                precio: 159900,
                descripcion: 'Tacón elegante en cuero negro con acabado brillante',
                imagen: '/imagenes/productos/mujeres/tacon-elegante-negro.jpg',
                tipo: 'Tacones',
                tallas: ['35', '36', '37', '38', '39'],
                colores: ['Negro', 'Rojo', 'Beige']
            },
            {
                id: 'muj-002',
                nombre: 'Sandalia de Plataforma',
                precio: 129900,
                descripcion: 'Sandalia con plataforma y tiras cruzadas',
                imagen: '/imagenes/productos/mujeres/sandalia-plataforma.jpg',
                tipo: 'Sandalias',
                tallas: ['35', '36', '37', '38'],
                colores: ['Dorado', 'Plateado', 'Negro']
            },
            {
                id: 'muj-003',
                nombre: 'Bota Alta Cuero',
                precio: 249900,
                descripcion: 'Bota alta en cuero genuino con cierre lateral',
                imagen: '/imagenes/productos/mujeres/bota-alta-cuero.jpg',
                tipo: 'Botas',
                tallas: ['36', '37', '38', '39'],
                colores: ['Marrón', 'Negro']
            },
            {
                id: 'muj-004',
                nombre: 'Zapato Casual Sport',
                precio: 139900,
                descripcion: 'Zapato casual deportivo con suela confortable',
                imagen: '/imagenes/productos/mujeres/casual-sport.jpg',
                tipo: 'Casuales',
                tallas: ['35', '36', '37', '38', '39'],
                colores: ['Blanco', 'Rosa', 'Azul']
            },
            {
                id: 'muj-005',
                nombre: 'Stiletto Clásico',
                precio: 179900,
                descripcion: 'Stiletto clásico en charol con punta fina',
                imagen: '/imagenes/productos/mujeres/stiletto-clasico.jpg',
                tipo: 'Tacones',
                tallas: ['35', '36', '37', '38'],
                colores: ['Negro', 'Rojo', 'Nude']
            },
            {
                id: 'muj-006',
                nombre: 'Baleta Elegante',
                precio: 99900,
                descripcion: 'Baleta elegante con detalles decorativos',
                imagen: '/imagenes/productos/mujeres/baleta-elegante.jpg',
                tipo: 'Baletas',
                tallas: ['35', '36', '37', '38', '39'],
                colores: ['Negro', 'Azul', 'Beige']
            }
        ];
    }

    async init() {
        await super.init();
    }

    renderizarProducto(producto) {
        return `
            <div class="producto-card" data-id="${producto.id}">
                <div class="producto-img-container">
                    <img src="${producto.imagen}" alt="${producto.nombre}" class="producto-img">
                </div>
                <div class="producto-info">
                    <div class="producto-detalles">
                        <h3 class="producto-titulo">${producto.nombre}</h3>
                        <p class="producto-precio">$${producto.precio.toLocaleString('es-CO')}</p>
                        <p class="producto-descripcion">${producto.descripcion}</p>
                    </div>
                    
                    <div class="producto-opciones">
                        <div class="select-grupo">
                            <label for="talla-${producto.id}">Talla</label>
                            <select class="select-talla" id="talla-${producto.id}" required>
                                <option value="">Seleccionar talla</option>
                                ${producto.tallas.map(talla => `<option value="${talla}">${talla}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <button class="btn-agregar-carrito" onclick="window['productosMujeres'].agregarAlCarrito('${producto.id}')">
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
            const cumpleColor = !this.filtros.color || producto.colores.some(c => 
                c.toLowerCase() === this.filtros.color.toLowerCase()
            );
            
            return cumpleTipo && cumpleTalla && cumpleColor;
        });
    }

    // Método para agregar al carrito con color seleccionado
    agregarAlCarrito(productoId) {
        const productoCard = document.querySelector(`.producto-card[data-id="${productoId}"]`);
        const talla = productoCard.querySelector('.select-talla').value;
        
        if (!talla) {
            alert('Por favor selecciona una talla');
            return;
        }
        
        const producto = this.productos.find(p => p.id === productoId);
        if (!producto) return;

        // Si hay un filtro de color activo, usar ese color, de lo contrario usar el primer color disponible
        let color = this.filtros.color && producto.colores.includes(this.filtros.color) 
            ? this.filtros.color 
            : producto.colores[0];
        
        // Agregar al carrito
        const item = {
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            talla: talla,
            color: color,
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
    window.productosMujeres = new ProductosMujeres();
    window.productosMujeres.init();
});