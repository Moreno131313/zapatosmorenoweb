// public/js/carrito.js
const Carrito = {
  items: [],
  
  async sincronizarConServidor() {
    try {
      // Verificar si hay un usuario autenticado
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No hay usuario autenticado, usando carrito local');
        return false;
      }
      
      console.log('Usuario autenticado, sincronizando carrito con servidor');
      
      // Si el usuario está autenticado, sincronizar el carrito con el servidor
      const response = await fetch('/api/carrito/sincronizar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: this.items })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('Carrito sincronizado con servidor:', result.data);
        // Actualizar el carrito local con la versión del servidor
        this.items = result.data;
        this.guardarCarrito();
        this.actualizarContador();
        return true;
      } else {
        console.error('Error al sincronizar carrito:', result.mensaje || 'Error desconocido');
        return false;
      }
    } catch (error) {
      console.error('Error en sincronizarConServidor:', error);
      return false;
    }
  },
  
  async cargarDesdeServidor() {
    try {
      // Verificar si hay un usuario autenticado
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No hay usuario autenticado, cargando carrito local');
        this.cargarCarritoDesdeLocalStorage();
        return false;
      }
      
      console.log('Usuario autenticado, cargando carrito desde servidor');
      
      // Si el usuario está autenticado, obtener carrito del servidor
      const response = await fetch('/api/carrito', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('Carrito cargado desde servidor:', result.data);
        
        // Si no hay items en el servidor pero hay en localStorage
        const carritoLocal = localStorage.getItem('carrito');
        if (result.data.length === 0 && carritoLocal && carritoLocal !== '[]') {
          console.log('Carrito vacío en servidor pero con datos en local, sincronizando...');
          this.cargarCarritoDesdeLocalStorage();
          await this.sincronizarConServidor();
        } else {
          // Usar carrito del servidor
          this.items = result.data;
          this.guardarCarrito();
          this.actualizarContador();
        }
        return true;
      } else {
        console.error('Error al cargar carrito desde servidor:', result.mensaje || 'Error desconocido');
        this.cargarCarritoDesdeLocalStorage();
        return false;
      }
    } catch (error) {
      console.error('Error en cargarDesdeServidor:', error);
      this.cargarCarritoDesdeLocalStorage();
      return false;
    }
  },
  
  async agregarItemAlServidor(producto) {
    try {
      // Verificar si hay un usuario autenticado
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No hay usuario autenticado, sólo se guardará localmente');
        return false;
      }
      
      // Si el usuario está autenticado, agregar al servidor
      const response = await fetch('/api/carrito/agregar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ producto })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('Producto agregado al carrito en servidor:', result.data);
        // Actualizar el carrito local con la versión del servidor
        this.items = result.data;
        this.guardarCarrito();
        this.actualizarContador();
        return true;
      } else {
        console.error('Error al agregar producto al carrito en servidor:', result.mensaje || 'Error desconocido');
        return false;
      }
    } catch (error) {
      console.error('Error en agregarItemAlServidor:', error);
      return false;
    }
  },
  
  async actualizarCantidadEnServidor(index, cantidad) {
    try {
      // Verificar si hay un usuario autenticado
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No hay usuario autenticado, sólo se actualizará localmente');
        return false;
      }
      
      // Obtener datos del producto
      const producto = this.items[index];
      if (!producto) {
        console.error('Producto no encontrado en índice:', index);
        return false;
      }
      
      // Si el usuario está autenticado, actualizar en servidor
      const response = await fetch('/api/carrito/actualizar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productoId: producto.id,
          talla: producto.talla,
          color: producto.color,
          cantidad
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('Cantidad actualizada en servidor:', result.data);
        // Actualizar el carrito local con la versión del servidor
        this.items = result.data;
        this.guardarCarrito();
        this.actualizarContador();
        return true;
      } else {
        console.error('Error al actualizar cantidad en servidor:', result.mensaje || 'Error desconocido');
        return false;
      }
    } catch (error) {
      console.error('Error en actualizarCantidadEnServidor:', error);
      return false;
    }
  },
  
  async eliminarProductoEnServidor(index) {
    try {
      // Verificar si hay un usuario autenticado
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No hay usuario autenticado, sólo se eliminará localmente');
        return false;
      }
      
      // Obtener datos del producto
      const producto = this.items[index];
      if (!producto) {
        console.error('Producto no encontrado en índice:', index);
        return false;
      }
      
      // Si el usuario está autenticado, eliminar en servidor
      const response = await fetch('/api/carrito/eliminar', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productoId: producto.id,
          talla: producto.talla,
          color: producto.color
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('Producto eliminado en servidor:', result.data);
        // Actualizar el carrito local con la versión del servidor
        this.items = result.data;
        this.guardarCarrito();
        this.actualizarContador();
        return true;
      } else {
        console.error('Error al eliminar producto en servidor:', result.mensaje || 'Error desconocido');
        return false;
      }
    } catch (error) {
      console.error('Error en eliminarProductoEnServidor:', error);
      return false;
    }
  },
  
  async vaciarCarritoEnServidor() {
    try {
      // Verificar si hay un usuario autenticado
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No hay usuario autenticado, sólo se vaciará localmente');
        return false;
      }
      
      // Si el usuario está autenticado, vaciar carrito en servidor
      const response = await fetch('/api/carrito/vaciar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('Carrito vaciado en servidor');
        return true;
      } else {
        console.error('Error al vaciar carrito en servidor:', result.mensaje || 'Error desconocido');
        return false;
      }
    } catch (error) {
      console.error('Error en vaciarCarritoEnServidor:', error);
      return false;
    }
  },
  
  async agregarItem(producto) {
    console.log('Agregando al carrito:', producto);
    
    // Si el producto tiene talla y color (viene como objeto completo)
    if (typeof producto === 'object' && producto.talla && producto.color) {
      await this.agregarItemCompleto(producto);
      return;
    }
    
    // Si los parámetros vienen separados (versión antigua)
    const talla = arguments[1];
    const color = arguments[2];
    const cantidad = arguments[3] || 1;
    
    // Construir objeto completo
    const productoCompleto = {
      id: producto.id,
      nombre: producto.nombre,
      imagen: producto.imagen,
      precio: parseFloat(producto.precio),
      talla: talla,
      color: color,
      cantidad: cantidad
    };
    
    await this.agregarItemCompleto(productoCompleto);
  },
  
  async agregarItemCompleto(producto) {
    // Verificar si el producto ya está en el carrito con la misma talla y color
    const index = this.items.findIndex(item => 
      item.id === producto.id && 
      item.talla === producto.talla && 
      item.color === producto.color
    );
    
    if (index !== -1) {
      // Si ya existe, incrementar la cantidad
      const nuevaCantidad = this.items[index].cantidad + producto.cantidad;
      await this.cambiarCantidad(index, nuevaCantidad, true); // true para indicar que es cantidad absoluta
    } else {
      // Si no existe, agregarlo como nuevo item
      this.items.push({
        id: producto.id,
        nombre: producto.nombre,
        imagen: producto.imagen,
        precio: parseFloat(producto.precio),
        talla: producto.talla,
        color: producto.color,
        cantidad: producto.cantidad
      });
      
      this.guardarCarrito();
      this.actualizarContador();
      
      // Intentar sincronizar con servidor
      await this.agregarItemAlServidor(producto);
    }
    
    console.log('Carrito actualizado:', this.items);
    
    // Mostrar notificación
    this.mostrarNotificacion();
  },
  
  async cambiarCantidad(index, cantidad, esAbsoluta = false) {
    if (index < 0 || index >= this.items.length) {
      console.error('Índice inválido para cambiar cantidad:', index);
      return;
    }
    
    let nuevaCantidad;
    if (esAbsoluta) {
      nuevaCantidad = cantidad;
    } else {
      nuevaCantidad = this.items[index].cantidad + cantidad;
    }
    
    // Si la cantidad es 0 o menor, eliminar el producto
    if (nuevaCantidad <= 0) {
      await this.eliminarProducto(index);
      return;
    }
    
    // Actualizar localmente primero
    this.items[index].cantidad = nuevaCantidad;
    this.guardarCarrito();
    this.actualizarContador();
    
    // Intentar actualizar en servidor
    await this.actualizarCantidadEnServidor(index, nuevaCantidad);
    
    if (this.onCambiarCantidad) {
      this.onCambiarCantidad();
    }
  },
  
  async eliminarProducto(index) {
    if (index < 0 || index >= this.items.length) {
      console.error('Índice inválido para eliminar producto:', index);
      return;
    }
    
    // Intentar eliminar en servidor primero
    await this.eliminarProductoEnServidor(index);
    
    // Eliminar localmente
    this.items.splice(index, 1);
    this.guardarCarrito();
    this.actualizarContador();
    
    if (this.onEliminarProducto) {
      this.onEliminarProducto();
    }
  },
  
  async vaciarCarrito() {
    // Intentar vaciar en servidor primero
    await this.vaciarCarritoEnServidor();
    
    // Vaciar localmente
    this.items = [];
    this.guardarCarrito();
    this.actualizarContador();
    this.renderizarCarrito(); // Asegurarse de renderizar después de vaciar
  },
  
  async finalizarCompra() {
    if (this.items.length === 0) {
      alert('No hay productos en el carrito');
      return;
    }
    
    // Aquí se podría implementar la lógica para procesar el pago
    // Por ahora, solo mostraremos un mensaje de confirmación
    alert('¡Gracias por tu compra! Tu pedido ha sido procesado.');
    
    // Vaciar el carrito después de la compra
    await this.vaciarCarrito();
    
    // Redireccionar a la página principal después de unos segundos
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  },
  
  cargarCarritoDesdeLocalStorage() {
    const carritoGuardado = localStorage.getItem('carrito');
    console.log('Cargando carrito desde localStorage:', carritoGuardado);
    
    if (carritoGuardado) {
      try {
        this.items = JSON.parse(carritoGuardado);
        console.log('Carrito cargado:', this.items);
      } catch (error) {
        console.error('Error al cargar carrito desde localStorage:', error);
        this.items = [];
      }
    } else {
      console.log('No hay carrito guardado en localStorage');
      this.items = [];
    }
    this.actualizarContador();
  },
  
  inicializar() {
    console.log('Inicializando carrito...');
    
    // Cargar carrito, intentando primero desde el servidor
    this.cargarDesdeServidor().then(exito => {
      console.log('Carrito cargado correctamente: ', exito);
      
      // Crear botón flotante del carrito
      this.crearBotonFlotante();
      
      // Si estamos en la página del carrito, renderizar los productos
      const enPaginaCarrito = window.location.pathname.includes('carrito.html') || 
                           document.getElementById('lista-productos-carrito') || 
                           document.getElementById('cart-items');
      
      if (enPaginaCarrito) {
        console.log('Estamos en la página del carrito, renderizando...');
        this.renderizarCarrito();
      }
      
      this.actualizarContador();
    });
  },
  
  renderizarCarrito() {
    console.log('Renderizando carrito con items:', this.items);
    // Buscar el contenedor en ambos posibles IDs
    let contenedorCarrito = document.getElementById('lista-productos-carrito') || document.getElementById('cart-items');
    
    // Verificar si estamos en la página del carrito
    if (!contenedorCarrito) {
      console.log('No se encontró el contenedor del carrito, intentando recrearlo...');
      
      // Intentar encontrar algún contenedor padre donde podamos recrear el carrito
      const mainContainer = document.querySelector('.carrito-container') || document.querySelector('main');
      if (mainContainer) {
        console.log('Encontrado contenedor principal, recreando el carrito...');
        // Intentar recrear el contenedor del carrito
        const cartContainer = document.createElement('div');
        cartContainer.className = 'cart-container';
        
        contenedorCarrito = document.createElement('div');
        contenedorCarrito.className = 'cart-items';
        contenedorCarrito.id = 'lista-productos-carrito';
        contenedorCarrito.setAttribute('data-container', 'carrito');
        
        cartContainer.appendChild(contenedorCarrito);
        
        // Encontrar dónde insertar el contenedor recreado
        const existingCartContainer = mainContainer.querySelector('.cart-container');
        if (existingCartContainer) {
          // Reemplazar el contenedor existente
          mainContainer.replaceChild(cartContainer, existingCartContainer);
        } else {
          // O simplemente añadirlo
          mainContainer.appendChild(cartContainer);
        }
        
        console.log('Contenedor del carrito recreado:', contenedorCarrito);
      } else {
        console.log('No estamos en la página del carrito, no es necesario renderizar');
        return;
      }
    }
    
    // Debug para verificar si hay items en el carrito
    console.log(`Hay ${this.items.length} productos en el carrito`);
    console.table(this.items);
    
    const subtotalElement = document.getElementById('subtotal');
    const ivaElement = document.getElementById('iva');
    const totalElement = document.getElementById('total');
    
    // Siempre vaciar el contenedor primero
    contenedorCarrito.innerHTML = '';
    
    if (this.items.length === 0) {
      // Mostrar carrito vacío
      const emptyCartDiv = document.createElement('div');
      emptyCartDiv.className = 'cart-empty';
      emptyCartDiv.innerHTML = `
        <i class="fas fa-shopping-cart"></i>
        <h3>Tu carrito está vacío</h3>
        <p>Parece que aún no has añadido productos a tu carrito</p>
        <a href="index.html" class="btn-volver-compras">
          <i class="fas fa-arrow-left"></i> Volver a la tienda
        </a>
      `;
      
      contenedorCarrito.appendChild(emptyCartDiv);
      
      if (subtotalElement) subtotalElement.textContent = '$0';
      if (ivaElement) ivaElement.textContent = '$0';
      if (totalElement) totalElement.textContent = '$0';
      
      return;
    }
    
    // Renderizar items del carrito uno por uno
    this.items.forEach((item, index) => {
      const cartItemDiv = document.createElement('div');
      cartItemDiv.className = 'cart-item';
      cartItemDiv.dataset.index = index;
      
      // Corregir la ruta de la imagen si es necesario
      let imagenUrl = item.imagen || 'imagenes/productos/logo.png';
      
      // Si la ruta comienza con '/', quitarlo para que sea relativa al sitio
      if (imagenUrl && imagenUrl.startsWith('/')) {
        imagenUrl = imagenUrl.substring(1);
      }
      
      cartItemDiv.innerHTML = `
        <div class="cart-item-image">
          <img src="${imagenUrl}" alt="${item.nombre}" class="cart-item-img" 
               onerror="this.src='imagenes/productos/logo.png'; this.onerror=null;">
        </div>
        <div class="cart-item-details">
          <h3 class="cart-item-name">${item.nombre}</h3>
          <div class="cart-item-atributos">
            <span class="cart-item-atributo">Talla: ${item.talla}</span>
            <span class="cart-item-atributo">Color: ${item.color}</span>
          </div>
          <p class="cart-item-price">$${(item.precio * item.cantidad).toLocaleString('es-CO')}</p>
          <p class="cart-item-unit-price">$${parseFloat(item.precio).toLocaleString('es-CO')} / unidad</p>
        </div>
        <div class="cart-item-actions">
          <div class="quantity-control">
            <button class="quantity-btn decrease-btn" data-index="${index}">
              <i class="fas fa-minus"></i>
            </button>
            <input type="number" class="quantity-input" value="${item.cantidad}" min="1" max="10" readonly>
            <button class="quantity-btn increase-btn" data-index="${index}">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <button class="remove-btn" data-index="${index}">
            <i class="fas fa-trash-alt"></i> Eliminar
          </button>
        </div>
      `;
      
      contenedorCarrito.appendChild(cartItemDiv);
    });
    
    // Agregar un resumen del carrito si estamos en la página del carrito
    const cartSummaryElement = document.querySelector('.cart-summary');
    if (!cartSummaryElement && window.location.pathname.includes('carrito.html')) {
      const summaryContainer = document.createElement('div');
      summaryContainer.className = 'cart-summary';
      summaryContainer.innerHTML = `
        <h3>Resumen del pedido</h3>
        <div class="summary-line">
          <span>Subtotal:</span>
          <span id="subtotal">$${this.obtenerTotal().toLocaleString('es-CO')}</span>
        </div>
        <div class="summary-line">
          <span>IVA (19%):</span>
          <span id="iva">$${(this.obtenerTotal() * 0.19).toLocaleString('es-CO')}</span>
        </div>
        <div class="summary-line total-line">
          <strong>Total:</strong>
          <strong id="total">$${(this.obtenerTotal() * 1.19).toLocaleString('es-CO')}</strong>
        </div>
        <div class="coupon-section">
          <input type="text" id="cupon-codigo" placeholder="Código de cupón">
          <button id="btn-aplicar-cupon" class="btn-coupon">Aplicar</button>
        </div>
        <button id="btn-finalizar-compra" class="btn-checkout">
          <i class="fas fa-shopping-bag"></i> Finalizar compra
        </button>
      `;

      // Buscar dónde insertar el resumen
      const cartGrid = document.querySelector('.cart-grid');
      if (cartGrid) {
        cartGrid.appendChild(summaryContainer);
      } else {
        const carritoContainer = document.querySelector('.carrito-container');
        if (carritoContainer) {
          carritoContainer.appendChild(summaryContainer);
        }
      }
    } else {
      // Calcular totales
      const subtotal = this.obtenerTotal();
      const iva = subtotal * 0.19;
      const total = subtotal + iva;

      if (subtotalElement) subtotalElement.textContent = `$${subtotal.toLocaleString('es-CO')}`;
      if (ivaElement) ivaElement.textContent = `$${iva.toLocaleString('es-CO')}`;
      if (totalElement) totalElement.textContent = `$${total.toLocaleString('es-CO')}`;
    }
    
    // Agregar event listeners
    this.agregarEventListeners();
  },
  
  agregarEventListeners() {
    // Botones para aumentar cantidad
    const increaseBtns = document.querySelectorAll('.increase-btn');
    increaseBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.actualizarCantidad(index, this.items[index].cantidad + 1);
      });
    });
    
    // Botones para disminuir cantidad
    const decreaseBtns = document.querySelectorAll('.decrease-btn');
    decreaseBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        if (this.items[index].cantidad > 1) {
          this.actualizarCantidad(index, this.items[index].cantidad - 1);
        }
      });
    });
    
    // Botones para eliminar item
    const removeBtns = document.querySelectorAll('.remove-btn');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.removerItem(index);
      });
    });
    
    // Botón para aplicar cupón
    const btnAplicarCupon = document.getElementById('btn-aplicar-cupon');
    if (btnAplicarCupon) {
      btnAplicarCupon.addEventListener('click', () => {
        const codigoCupon = document.getElementById('cupon-codigo').value;
        if (!codigoCupon) return;
        
        // Simulación de aplicación de cupón
        alert(`Cupón "${codigoCupon}" aplicado con éxito.`);
      });
    }
    
    // Botón finalizar compra
    const btnFinalizarCompra = document.getElementById('btn-finalizar-compra');
    if (btnFinalizarCompra) {
      btnFinalizarCompra.addEventListener('click', () => this.finalizarCompra());
    }

    // Botón flotante del carrito (si existe)
    const floatingCartBtn = document.querySelector('.floating-cart-button');
    if (floatingCartBtn) {
      floatingCartBtn.addEventListener('click', () => {
        // Redirigir a la página del carrito o mostrar un overlay del carrito
        window.location.href = 'carrito.html';
      });
    }
  },
  
  obtenerTotal() {
    return this.items.reduce((total, item) => {
      return total + (parseFloat(item.precio) * item.cantidad);
    }, 0);
  },
  
  guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(this.items));
  },
  
  contarItems() {
    return this.items.reduce((total, item) => total + item.cantidad, 0);
  },
  
  actualizarContador() {
    const contadores = document.querySelectorAll('.cart-count');
    const cantidad = this.contarItems();
    
    contadores.forEach(contador => {
      contador.textContent = cantidad;
      
      // Mostrar u ocultar contador según cantidad
      if (cantidad > 0) {
        contador.style.display = 'inline-block';
      } else {
        contador.style.display = 'none';
      }
    });

    // Actualizar el contador flotante si existe
    const floatingCount = document.querySelector('.floating-count');
    if (floatingCount) {
      floatingCount.textContent = cantidad;
      floatingCount.style.display = cantidad > 0 ? 'flex' : 'none';
    }
  },
  
  mostrarNotificacion() {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = 'cart-notification';
    notificacion.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>¡Producto añadido al carrito!</span>
    `;
    
    // Estilos para la notificación
    Object.assign(notificacion.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      zIndex: '1000',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      opacity: '0',
      transform: 'translateY(-20px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease'
    });
    
    // Agregar al body
    document.body.appendChild(notificacion);
    
    // Mostrar con animación
    setTimeout(() => {
      notificacion.style.opacity = '1';
      notificacion.style.transform = 'translateY(0)';
    }, 10);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
      notificacion.style.opacity = '0';
      notificacion.style.transform = 'translateY(-20px)';
      
      setTimeout(() => {
        if (document.body.contains(notificacion)) {
          document.body.removeChild(notificacion);
        }
      }, 500);
    }, 3000);
  },
  
  crearBotonFlotante() {
    // Si ya existe un botón flotante, no crear otro
    if (document.querySelector('.floating-cart-button')) return;

    // Si estamos en la página del carrito, no crear el botón flotante
    if (window.location.pathname.includes('carrito.html')) return;

    const floatingBtn = document.createElement('button');
    floatingBtn.className = 'floating-cart-button';
    floatingBtn.innerHTML = `
      <i class="fas fa-shopping-cart"></i>
      <span class="floating-count">${this.contarItems()}</span>
    `;

    floatingBtn.addEventListener('click', () => {
      window.location.href = 'carrito.html';
    });

    document.body.appendChild(floatingBtn);

    // Mostrar/ocultar contador según cantidad
    const floatingCount = floatingBtn.querySelector('.floating-count');
    if (floatingCount) {
      floatingCount.style.display = this.contarItems() > 0 ? 'flex' : 'none';
    }
  }
};

// Inicializar carrito cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM cargado, inicializando carrito...');
  Carrito.inicializar();
});

// También verificar cuando la ventana esté completamente cargada
window.addEventListener('load', () => {
  console.log('Ventana cargada, verificando carrito...');
  Carrito.actualizarContador();
  
  // Verificar específicamente si estamos en la página de carrito
  if (window.location.pathname.includes('carrito.html')) {
    console.log('Estamos en la página de carrito, renderizando después de carga completa...');
    Carrito.renderizarCarrito();
  }
});