// public/js/carrito.js
const Carrito = {
  items: [],
  notificaciones: [],
  
  async sincronizarConServidor() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No hay usuario autenticado, usando carrito local');
        return false;
      }
      
      // Si el carrito está vacío, no hay nada que sincronizar
      if (this.items.length === 0) {
        console.log('El carrito está vacío, no hay nada que sincronizar');
        return true;
      }
      
      console.log('Intentando sincronizar carrito con el servidor...');
      
      const response = await fetch('/api/carrito/sincronizar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: this.items })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en respuesta del servidor:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Carrito sincronizado con servidor:', result.data);
        this.items = result.data;
        this.guardarCarrito();
        this.actualizarContador();
        
        // Si estamos en la página de carrito, renderizar de nuevo
        if (window.location.pathname.includes('carrito.html')) {
          this.renderizarCarrito();
        }
        
        this.mostrarNotificacion('Carrito sincronizado con éxito', 'success');
        return true;
      } else {
        this.mostrarNotificacion(result.mensaje || 'Error al sincronizar carrito', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error en sincronizarConServidor:', error);
      this.mostrarNotificacion('Error al sincronizar carrito', 'error');
      return false;
    }
  },
  
  async cargarDesdeServidor() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No hay usuario autenticado, usando carrito local');
        return false;
      }
      
      console.log('Intentando cargar carrito desde el servidor...');
      
      try {
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Tiempo de espera agotado')), 5000)
        );
        
        const fetchPromise = fetch('/api/carrito', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Usar Promise.race para establecer un tiempo límite
        const response = await Promise.race([fetchPromise, timeout]);
        
        // Manejar errores de red o del servidor
        if (!response.ok) {
          console.error(`Error al cargar carrito desde servidor: ${response.status} ${response.statusText}`);
          // En caso de error, seguir usando el carrito local
          return false;
        }
        
        const result = await response.json();
        
        // Ahora siempre debería ser exitoso, pero verificamos igualmente
        if (result.success) {
          console.log('Carrito cargado desde servidor:', result.data);
          
          // Si el carrito del servidor está vacío pero hay items en localStorage
          const carritoLocal = localStorage.getItem('carrito');
          if (result.data.length === 0 && carritoLocal && carritoLocal !== '[]') {
            console.log('Carrito vacío en servidor pero lleno en local, sincronizando...');
            await this.sincronizarConServidor();
          } else {
            this.items = result.data;
            this.guardarCarrito();
          }
          
          this.actualizarContador();
          return true;
        } else {
          console.warn('Respuesta del servidor no exitosa:', result.mensaje);
          return false;
        }
      } catch (networkError) {
        // Errores de red, CORS o timeout
        console.error('Error de red al cargar carrito:', networkError);
        
        // Usar el carrito local en caso de error de red
        console.log('Usando carrito local debido a error de red');
        this.cargarCarritoDesdeLocalStorage();
        
        return false;
      }
    } catch (error) {
      console.error('Error general en cargarDesdeServidor:', error);
      
      // Usar el carrito local en caso de error general
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
        return true; // Retornar true porque se guardó localmente
      }
      
      // Preparar los datos en el formato que espera el servidor
      const productoData = {
        producto_id: producto.id,
        cantidad: producto.cantidad,
        talla: producto.talla,
        color: producto.color
      };

      console.log('Enviando datos al servidor:', productoData);
      
      // Usar reintentos para la operación de agregar producto
      return await this.ejecutarConReintentos(
        async () => {
          // Si el usuario está autenticado, agregar al servidor
          const response = await fetch('/api/carrito/agregar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productoData),
            signal: AbortSignal.timeout(7000) // Timeout de 7 segundos
          });
          
          // En caso de error de red u otro error no controlado
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error en respuesta del servidor:', response.status, errorText);
            this.mostrarNotificacion(`Error al agregar producto: ${response.status}`, 'error');
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          
          if (result.success) {
            console.log('Producto agregado al carrito en servidor:', result.data);
            // Actualizar el carrito completo después de agregar
            await this.actualizarCarritoCompleto();
            this.animarAgregarProducto(producto);
            this.mostrarNotificacion('Producto agregado al carrito', 'success');
            return true;
          } else {
            const errorMsg = result.mensaje || 'Error al agregar producto';
            console.error('Error al agregar producto al carrito en servidor:', errorMsg);
            this.mostrarNotificacion(errorMsg, 'error');
            throw new Error(errorMsg);
          }
        },
        'agregar producto al servidor',
        2 // Máximo 2 intentos
      );
    } catch (error) {
      console.error('Error en agregarItemAlServidor:', error);
      this.mostrarNotificacion('Error al agregar producto al carrito', 'error');
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
      
      // Verificar si tenemos carrito_id (necesario para actualizar en el servidor)
      const carritoId = producto.carrito_id;
      if (!carritoId) {
        console.error('Este producto no tiene carrito_id, posiblemente no está sincronizado con el servidor');
        return false;
      }
      
      // Si el usuario está autenticado, actualizar en servidor
      const response = await fetch(`/api/carrito/actualizar/${carritoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cantidad
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('Cantidad actualizada en servidor:', result.data);
        this.mostrarNotificacion('Cantidad actualizada', 'success');
        return true;
      } else {
        console.error('Error al actualizar cantidad en servidor:', result.mensaje || 'Error desconocido');
        this.mostrarNotificacion(result.mensaje || 'Error al actualizar cantidad', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error en actualizarCantidadEnServidor:', error);
      this.mostrarNotificacion('Error al actualizar cantidad', 'error');
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
      
      // Aquí está el problema: necesitamos el carrito_id, no el producto_id
      const carritoId = producto.carrito_id;
      if (!carritoId) {
        console.error('Este producto no tiene carrito_id, posiblemente no está sincronizado con el servidor');
        return false;
      }
      
      // Si el usuario está autenticado, eliminar en servidor
      const response = await fetch(`/api/carrito/eliminar/${carritoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('Producto eliminado en servidor:', result.data);
        this.mostrarNotificacion('Producto eliminado del carrito', 'success');
        return true;
      } else {
        console.error('Error al eliminar producto en servidor:', result.mensaje || 'Error desconocido');
        this.mostrarNotificacion(result.mensaje || 'Error al eliminar producto', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error en eliminarProductoEnServidor:', error);
      this.mostrarNotificacion('Error al eliminar producto del carrito', 'error');
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
        this.mostrarNotificacion(result.mensaje || 'Error al vaciar carrito', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error en vaciarCarritoEnServidor:', error);
      this.mostrarNotificacion('Error al vaciar carrito', 'error');
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
      const exito = await this.agregarItemAlServidor(producto);
      
      // Mostrar notificación solo si la sincronización fue exitosa
      if (exito) {
        this.mostrarNotificacion('Producto agregado al carrito', 'success');
      }
    }
    
    console.log('Carrito actualizado:', this.items);
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
    const actualizadoEnServidor = await this.actualizarCantidadEnServidor(index, nuevaCantidad);
    
    // Si se actualizó en servidor, actualizar el carrito completo
    if (actualizadoEnServidor) {
      await this.actualizarCarritoCompleto();
    }
    
    if (this.onCambiarCantidad) {
      this.onCambiarCantidad();
    }
    
    // Renderizar de nuevo el carrito si estamos en la página de carrito
    if (window.location.pathname.includes('carrito.html')) {
      this.renderizarCarrito();
    }
  },
  
  async eliminarProducto(index) {
    if (index < 0 || index >= this.items.length) {
      console.error('Índice inválido para eliminar producto:', index);
      return;
    }
    
    // Guardar una copia del producto antes de eliminarlo para animación
    const productoEliminado = { ...this.items[index] };
    
    // Intentar eliminar en servidor primero
    const eliminadoEnServidor = await this.eliminarProductoEnServidor(index);
    
    // Eliminar localmente
    this.items.splice(index, 1);
    this.guardarCarrito();
    this.actualizarContador();
    
    // Si se eliminó en servidor, actualizar el carrito completo
    if (eliminadoEnServidor) {
      await this.actualizarCarritoCompleto();
    }
    
    // Animar el producto eliminado
    this.animarEliminarProducto(productoEliminado);
    
    if (this.onEliminarProducto) {
      this.onEliminarProducto();
    }
    
    // Renderizar de nuevo el carrito
    if (window.location.pathname.includes('carrito.html')) {
      this.renderizarCarrito();
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
    try {
      const carritoGuardado = localStorage.getItem('carrito');
      console.log('Cargando carrito desde localStorage:', carritoGuardado);
      
      if (carritoGuardado) {
        try {
          const itemsParsed = JSON.parse(carritoGuardado);
          
          // Validar que sea un array
          if (Array.isArray(itemsParsed)) {
            this.items = itemsParsed;
            console.log('Carrito cargado:', this.items);
          } else {
            console.warn('El carrito guardado no es un array, inicializando vacío');
            this.items = [];
            this.guardarCarrito(); // Sobrescribir el valor inválido
          }
        } catch (parseError) {
          console.error('Error al parsear carrito desde localStorage:', parseError);
          this.items = [];
          // Limpiar localStorage corrupto
          localStorage.removeItem('carrito');
          localStorage.setItem('carrito', '[]');
        }
      } else {
        console.log('No hay carrito guardado en localStorage');
        this.items = [];
        this.guardarCarrito(); // Inicializar con array vacío
      }
      
      // Verificar que todos los items tengan los campos necesarios
      this.items = this.items.filter(item => {
        return item && typeof item === 'object' && 
               item.id && item.nombre && 
               !isNaN(parseFloat(item.precio)) && 
               !isNaN(parseInt(item.cantidad));
      });
      
      this.actualizarContador();
    } catch (error) {
      console.error('Error general en cargarCarritoDesdeLocalStorage:', error);
      this.items = [];
      this.guardarCarrito();
      this.actualizarContador();
    }
  },
  
  async inicializar() {
    console.log('Inicializando carrito...');
    
    // Cargar carrito desde localStorage primero
    this.cargarCarritoDesdeLocalStorage();
    
    // Verificar y corregir posibles inconsistencias en el carrito
    this.verificarIntegridadCarrito();
    
    // Verificar si hay un usuario autenticado
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Intentar cargar desde el servidor
        const cargadoDesdeServidor = await this.cargarDesdeServidor();
        
        if (!cargadoDesdeServidor) {
          // Si falla la carga desde servidor, intentar sincronizar el carrito local
          // Solo sincronizar si hay productos en el carrito local
          if (this.items.length > 0) {
            console.log('Intentando sincronizar carrito local con servidor...');
            await this.sincronizarConServidor();
          } else {
            console.log('No hay productos en el carrito local para sincronizar');
          }
        }
      } catch (error) {
        console.error('Error al inicializar carrito:', error);
        this.mostrarNotificacion('Error al cargar el carrito', 'error');
      }
    } else {
      console.log('No hay sesión activa, usando carrito local');
    }
    
    // Renderizar el carrito si estamos en la página de carrito
    if (window.location.pathname.includes('carrito.html')) {
      console.log('Estamos en la página de carrito, renderizando...');
      this.renderizarCarrito();
    }
    
    // Actualizar contador
    this.actualizarContador();
    
    // Crear botón flotante si no existe y no estamos en la página de carrito
    if (!document.getElementById('carrito-flotante') && !window.location.pathname.includes('carrito.html')) {
      this.crearBotonFlotante();
    }
    
    console.log('Inicialización del carrito completada');
  },
  
  renderizarCarrito() {
    try {
      console.log('Renderizando carrito con items:', this.items);
      
      // Buscar el contenedor del carrito
      const contenedorCarrito = document.querySelector('.carrito-container');
      if (!contenedorCarrito) {
        console.error('No se encontró el contenedor del carrito');
        return;
      }

      // Limpiar el contenedor existente
      contenedorCarrito.innerHTML = '<h1 class="section-title">Carrito de Compras</h1>';

      // Crear la estructura del grid
      const cartGrid = document.createElement('div');
      cartGrid.className = 'cart-grid';
      cartGrid.style.display = 'grid'; // Forzar display grid
      cartGrid.style.opacity = '1'; // Forzar visibilidad
      cartGrid.style.visibility = 'visible';
      
      // Crear la sección de items
      const itemsSection = document.createElement('div');
      itemsSection.className = 'cart-items';
      itemsSection.style.display = 'block'; // Forzar display
      itemsSection.style.opacity = '1';
      itemsSection.style.visibility = 'visible';
      
      if (!this.items || !Array.isArray(this.items) || this.items.length === 0) {
        // Mostrar mensaje de carrito vacío
        itemsSection.innerHTML = `
          <div class="cart-empty">
            <i class="fas fa-shopping-cart"></i>
            <h3>Tu carrito está vacío</h3>
            <p>Parece que aún no has añadido productos a tu carrito</p>
            <a href="index.html" class="btn-volver-compras">
              <i class="fas fa-arrow-left"></i> Volver a la tienda
            </a>
          </div>
        `;
      } else {
        // Renderizar cada item
        this.items.forEach((item, index) => {
          // Validar que el ítem sea válido
          if (!item || typeof item !== 'object' || !item.id || !item.nombre) {
            console.warn('Ítem inválido en carrito, saltando:', item);
            return;
          }
          
          const itemElement = document.createElement('div');
          itemElement.className = 'cart-item';
          itemElement.style.display = 'flex'; // Forzar display flex
          itemElement.style.opacity = '1';
          itemElement.style.visibility = 'visible';
          
          // Procesar URL de imagen
          let imagenUrl = item.imagen || 'imagenes/productos/logo.png';
          if (imagenUrl.startsWith('/')) {
            imagenUrl = imagenUrl.substring(1);
          }
          
          // Asegurar que precio es un número
          const precio = parseFloat(item.precio) || 0;
          const cantidad = parseInt(item.cantidad) || 1;
          const subtotal = precio * cantidad;
          
          itemElement.innerHTML = `
            <div class="cart-item-image">
              <img src="${imagenUrl}" alt="${item.nombre}" class="cart-item-img" 
                   onerror="this.src='imagenes/productos/logo.png'">
            </div>
            <div class="cart-item-details">
              <h3 class="cart-item-name">${item.nombre}</h3>
              <div class="cart-item-atributos">
                <span class="cart-item-atributo">Talla: ${item.talla || 'N/A'}</span>
                <span class="cart-item-atributo">Color: ${item.color || 'N/A'}</span>
              </div>
              <p class="cart-item-price">$${subtotal.toLocaleString('es-CO')}</p>
              <p class="cart-item-unit-price">$${precio.toLocaleString('es-CO')} / unidad</p>
              <div class="cart-item-actions">
                <div class="quantity-control">
                  <button class="quantity-btn decrease-btn" data-index="${index}">
                    <i class="fas fa-minus"></i>
                  </button>
                  <input type="number" class="quantity-input" value="${cantidad}" min="1" max="10" readonly>
                  <button class="quantity-btn increase-btn" data-index="${index}">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
                <button class="remove-btn" data-index="${index}">
                  <i class="fas fa-trash-alt"></i> Eliminar
                </button>
              </div>
            </div>
          `;
          
          itemsSection.appendChild(itemElement);
        });
      }
      
      // Crear el resumen del carrito
      const summarySection = document.createElement('div');
      summarySection.className = 'cart-summary';
      
      const subtotal = this.obtenerTotal();
      const iva = subtotal * 0.19;
      const total = subtotal + iva;
      
      summarySection.innerHTML = `
        <h3>Resumen del pedido</h3>
        <div class="summary-line">
          <span>Subtotal:</span>
          <span id="subtotal">$${subtotal.toLocaleString('es-CO')}</span>
        </div>
        <div class="summary-line">
          <span>IVA (19%):</span>
          <span id="iva">$${iva.toLocaleString('es-CO')}</span>
        </div>
        <div class="summary-line total-line">
          <strong>Total:</strong>
          <strong id="total">$${total.toLocaleString('es-CO')}</strong>
        </div>
        <div class="coupon-section">
          <input type="text" id="cupon-codigo" placeholder="Código de cupón">
          <button id="btn-aplicar-cupon" class="btn-coupon">Aplicar</button>
        </div>
        <button id="btn-finalizar-compra" class="btn-checkout">
          <i class="fas fa-shopping-bag"></i> Finalizar compra
        </button>
      `;
      
      // Agregar las secciones al grid
      cartGrid.appendChild(itemsSection);
      cartGrid.appendChild(summarySection);
      
      // Agregar el grid al contenedor
      contenedorCarrito.appendChild(cartGrid);
      
      // Agregar event listeners
      this.agregarEventListeners();
      
      console.log('Renderización completada');
    } catch (error) {
      console.error('Error al renderizar carrito:', error);
    }
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
        this.eliminarProducto(index);
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
  
  // Utilidad para ejecutar operaciones con reintentos
  async ejecutarConReintentos(operacion, descripcion, maxIntentos = 3, retrasoBase = 1000) {
    for (let intento = 1; intento <= maxIntentos; intento++) {
      try {
        console.log(`${descripcion}: intento ${intento} de ${maxIntentos}`);
        return await operacion();
      } catch (error) {
        if (intento < maxIntentos) {
          const retraso = retrasoBase * Math.pow(2, intento - 1); // Retraso exponencial
          console.warn(`Error en ${descripcion}. Reintentando en ${retraso}ms...`, error);
          await new Promise(resolve => setTimeout(resolve, retraso));
        } else {
          console.error(`Error en ${descripcion} después de ${maxIntentos} intentos:`, error);
          throw error;
        }
      }
    }
  },
  
  async actualizarCarritoCompleto() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }
      
      // Usar reintentos para la operación de obtener carrito
      return await this.ejecutarConReintentos(
        async () => {
          const response = await fetch('/api/carrito', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            // Establecer un timeout para la petición
            signal: AbortSignal.timeout(5000)
          });
          
          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          
          if (result.success) {
            this.items = result.data;
            this.guardarCarrito();
            this.actualizarContador();
            
            // Si estamos en la página de carrito, volver a renderizar
            if (window.location.pathname.includes('carrito.html')) {
              this.renderizarCarrito();
            }
            
            return true;
          } else {
            throw new Error(result.mensaje || 'Error al actualizar carrito');
          }
        },
        'actualizar carrito completo',
        2 // Máximo 2 intentos para no bloquear la interfaz
      );
    } catch (error) {
      console.error('Error al actualizar carrito completo:', error);
      return false;
    }
  },
  
  actualizarCantidad(index, nuevaCantidad) {
    if (index < 0 || index >= this.items.length) {
      console.error('Índice inválido para actualizar cantidad:', index);
      return;
    }
    
    console.log(`Actualizando cantidad de producto en índice ${index} a ${nuevaCantidad}`);
    
    // Llamar a cambiarCantidad con esAbsoluta = true para establecer la cantidad exacta
    this.cambiarCantidad(index, nuevaCantidad, true);
  },
  
  obtenerTotal() {
    return this.items.reduce((total, item) => {
      return total + (parseFloat(item.precio) * item.cantidad);
    }, 0);
  },
  
  guardarCarrito() {
    try {
      localStorage.setItem('carrito', JSON.stringify(this.items));
    } catch (error) {
      console.error('Error al guardar carrito en localStorage:', error);
      // Intentar limpiar el carrito si hay un error al guardar
      try {
        localStorage.removeItem('carrito');
        localStorage.setItem('carrito', '[]');
      } catch (e) {
        console.error('Error al limpiar el carrito:', e);
      }
    }
  },
  
  contarItems() {
    try {
      return this.items.reduce((total, item) => {
        const cantidad = parseInt(item.cantidad) || 0;
        return total + cantidad;
      }, 0);
    } catch (error) {
      console.error('Error al contar items:', error);
      return 0;
    }
  },
  
  actualizarContador() {
    try {
      const contadores = document.querySelectorAll('.cart-count');
      const cantidad = this.contarItems();
      
      contadores.forEach(contador => {
        if (contador) {
          contador.textContent = cantidad;
          
          // Mostrar u ocultar contador según cantidad
          if (cantidad > 0) {
            contador.style.display = 'inline-block';
          } else {
            contador.style.display = 'none';
          }
        }
      });

      // Actualizar el contador flotante si existe
      const floatingCount = document.querySelector('.floating-count');
      if (floatingCount) {
        floatingCount.textContent = cantidad;
        floatingCount.style.display = cantidad > 0 ? 'flex' : 'none';
      }
    } catch (error) {
      console.error('Error al actualizar contador:', error);
    }
  },
  
  mostrarNotificacion(mensaje, tipo = 'info') {
    // Limpiar notificaciones existentes
    const notificacionesExistentes = document.querySelectorAll('.notificacion');
    notificacionesExistentes.forEach(notif => notif.remove());
    
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.textContent = mensaje;
    
    // Estilos para la notificación
    Object.assign(notificacion.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: tipo === 'error' ? '#f8d7da' : 
                     tipo === 'success' ? '#d4edda' : 'var(--primary-color)',
      color: tipo === 'error' ? '#721c24' : 
             tipo === 'success' ? '#155724' : 'white',
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
      }, 300);
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
  },
  
  animarAgregarProducto(producto) {
    const botonCarrito = document.querySelector('.boton-carrito');
    if (botonCarrito) {
      botonCarrito.classList.add('animar-agregar');
      setTimeout(() => {
        botonCarrito.classList.remove('animar-agregar');
      }, 1000);
    }
  },
  
  animarEliminarProducto(producto) {
    const item = document.querySelector(`[data-producto-id="${producto.id}"]`);
    if (item) {
      item.classList.add('animar-eliminar');
      setTimeout(() => {
        item.remove();
      }, 500);
    }
  },
  
  verificarIntegridadCarrito() {
    // Verificar y corregir inconsistencias en el carrito
    console.log('Verificando integridad del carrito...');
    
    // 1. Eliminar elementos inválidos (null, undefined)
    this.items = this.items.filter(item => {
      const esValido = item && typeof item === 'object' && item.id && item.nombre && 
                      !isNaN(parseFloat(item.precio)) && !isNaN(parseInt(item.cantidad));
      
      if (!esValido) {
        console.warn('Elemento inválido eliminado del carrito:', item);
      }
      
      return esValido;
    });
    
    // 2. Asegurar que cantidades sean números positivos
    this.items.forEach(item => {
      if (typeof item.cantidad !== 'number' || item.cantidad <= 0) {
        console.warn(`Corrigiendo cantidad inválida en ${item.nombre}: ${item.cantidad}`);
        item.cantidad = 1;
      }
      
      if (typeof item.precio !== 'number') {
        console.warn(`Corrigiendo precio inválido en ${item.nombre}: ${item.precio}`);
        item.precio = parseFloat(item.precio) || 0;
      }
    });
    
    // 3. Combinar elementos duplicados (mismo producto, talla y color)
    const itemsUnicos = [];
    const indices = {};
    
    this.items.forEach(item => {
      const clave = `${item.id}-${item.talla}-${item.color}`;
      
      if (indices[clave] !== undefined) {
        // Si ya existe, sumar la cantidad
        const indiceExistente = indices[clave];
        itemsUnicos[indiceExistente].cantidad += item.cantidad;
        console.log(`Combinando cantidades para ${item.nombre} (${item.talla}/${item.color})`);
      } else {
        // Si no existe, agregar y guardar índice
        indices[clave] = itemsUnicos.length;
        itemsUnicos.push({...item});
      }
    });
    
    if (this.items.length !== itemsUnicos.length) {
      console.log(`Carrito optimizado: ${this.items.length} elementos combinados en ${itemsUnicos.length}`);
      this.items = itemsUnicos;
    }
    
    // Guardar el carrito corregido
    this.guardarCarrito();
    
    return this.items.length;
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