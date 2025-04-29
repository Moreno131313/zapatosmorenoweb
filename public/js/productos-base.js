// Funciones base para la gestión de productos
class ProductosManager {
    constructor(categoria) {
        this.categoria = categoria;
        this.productos = [];
        this.filtros = {
            tipo: '',
            talla: '',
            color: ''
        };
    }

    async init() {
        this.contenedorProductos = document.getElementById(`productos-${this.categoria}`);
        this.noProductos = document.getElementById('no-productos');
        this.setupFiltros();
        this.renderizarProductos();
    }

    setupFiltros() {
        const filtroTipo = document.getElementById('tipo-filtro');
        const filtroTalla = document.getElementById('talla-filtro');
        const filtroColor = document.getElementById('color-filtro');
        const btnReset = document.getElementById('reset-filtros');

        if (filtroTipo) filtroTipo.addEventListener('change', () => {
            this.filtros.tipo = filtroTipo.value;
            this.renderizarProductos();
        });

        if (filtroTalla) filtroTalla.addEventListener('change', () => {
            this.filtros.talla = filtroTalla.value;
            this.renderizarProductos();
        });

        if (filtroColor) filtroColor.addEventListener('change', () => {
            this.filtros.color = filtroColor.value;
            this.renderizarProductos();
        });

        if (btnReset) btnReset.addEventListener('click', () => {
            if (filtroTipo) filtroTipo.value = '';
            if (filtroTalla) filtroTalla.value = '';
            if (filtroColor) filtroColor.value = '';
            this.resetFiltros();
        });
    }

    resetFiltros() {
        this.filtros = {
            tipo: '',
            talla: '',
            color: ''
        };
        this.renderizarProductos();
    }

    async cargarProductos() {
        try {
            const response = await fetch(`/api/productos?genero=${this.categoria}`);
            if (!response.ok) throw new Error('Error al cargar productos');
            this.productos = await response.json();
        } catch (error) {
            console.error('Error:', error);
            this.mostrarError('Error al cargar los productos');
        }
    }

    filtrarProductos() {
        return this.productos.filter(producto => {
            const cumpleTipo = !this.filtros.tipo || producto.tipo === this.filtros.tipo;
            const cumpleTalla = !this.filtros.talla || producto.tallas.includes(this.filtros.talla);
            const cumpleColor = !this.filtros.color || producto.colores.some(c => 
                c.toLowerCase() === this.filtros.color.toLowerCase()
            );
            return cumpleTipo && cumpleTalla && cumpleColor;
        });
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
                    
                    <button class="btn-agregar-carrito" onclick="window['productos${this.categoria.charAt(0).toUpperCase() + this.categoria.slice(1)}'].agregarAlCarrito('${producto.id}')">
                        <i class="fas fa-shopping-cart"></i> Agregar al carrito
                    </button>
                </div>
            </div>
        `;
    }

    renderizarProductos() {
        const productosFiltrados = this.filtrarProductos();
        
        if (productosFiltrados.length === 0) {
            if (this.contenedorProductos) this.contenedorProductos.style.display = 'none';
            if (this.noProductos) this.noProductos.style.display = 'flex';
        } else {
            if (this.contenedorProductos) {
                this.contenedorProductos.style.display = 'grid';
                this.contenedorProductos.innerHTML = productosFiltrados
                    .map(producto => this.renderizarProducto(producto))
                    .join('');
            }
            if (this.noProductos) this.noProductos.style.display = 'none';
        }
    }

    agregarAlCarrito(productoId) {
        const productoCard = document.querySelector(`.producto-card[data-id="${productoId}"]`);
        const talla = productoCard.querySelector('.select-talla').value;
        const color = productoCard.querySelector('.select-color').value;
        
        if (!talla || !color) {
            alert('Por favor selecciona talla y color');
            return;
        }
        
        const producto = this.productos.find(p => p.id === productoId);
        if (!producto) return;
        
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

    mostrarError(mensaje) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = mensaje;
        this.contenedorProductos.insertAdjacentElement('beforebegin', errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }

    mostrarNotificacion(mensaje) {
        const notificacion = document.createElement('div');
        notificacion.className = 'notificacion';
        notificacion.textContent = mensaje;
        document.body.appendChild(notificacion);
        setTimeout(() => notificacion.remove(), 3000);
    }
} 