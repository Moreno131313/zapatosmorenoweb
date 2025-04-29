document.addEventListener('DOMContentLoaded', () => {
  // Verificar si el usuario está logueado
  if (!SessionManager.isLoggedIn()) {
    localStorage.setItem('redirect_after_login', 'pago.html');
    window.location.href = 'login.html';
    return;
  }
  
  // Cargar resumen del carrito
  cargarResumenCarrito();
  
  // Cargar direcciones del usuario
  cargarDirecciones();
  
  // Event listeners para métodos de pago
  const radioMetodosPago = document.querySelectorAll('input[name="metodo-pago"]');
  radioMetodosPago.forEach(radio => {
    radio.addEventListener('change', mostrarFormularioPago);
  });
  
  // Event listener para botón de confirmación
  const btnConfirmar = document.getElementById('btn-confirmar-pagar');
  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', procesarPago);
  }
});

function cargarResumenCarrito() {
  const resumenContainer = document.getElementById('resumen-productos');
  const subtotalElement = document.getElementById('resumen-subtotal');
  const ivaElement = document.getElementById('resumen-iva');
  const totalElement = document.getElementById('resumen-total');
  const descuentoContainer = document.querySelector('.descuento-aplicado');
  const descuentoElement = document.getElementById('resumen-descuento');
  
  // Cargar items del carrito
  const items = JSON.parse(localStorage.getItem('carrito')) || [];
  
  if (items.length === 0) {
    window.location.href = 'carrito.html';
    return;
  }
  
  resumenContainer.innerHTML = items.map(item => `
    <div class="producto-resumen">
      <div>
        <p><strong>${item.nombre}</strong> x ${item.cantidad}</p>
        <div class="producto-atributos">
          <span>Talla: ${item.talla}</span>
          <span>Color: ${item.color}</span>
        </div>
      </div>
      <p>$${(item.precio * item.cantidad).toLocaleString('es-CO')}</p>
    </div>
  `).join('');
  
  // Calcular totales
  const subtotal = items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  
  // Verificar si hay cupón aplicado
  const cuponAplicado = JSON.parse(localStorage.getItem('cupon_aplicado'));
  
  let descuento = 0;
  if (cuponAplicado) {
    descuento = cuponAplicado.descuento;
    descuentoContainer.style.display = 'flex';
    descuentoElement.textContent = `$${descuento.toLocaleString('es-CO')}`;
  }
  
  const subtotalConDescuento = subtotal - descuento;
  const iva = subtotalConDescuento * 0.19;
  const total = subtotalConDescuento + iva;
  
  subtotalElement.textContent = `$${subtotal.toLocaleString('es-CO')}`;
  ivaElement.textContent = `$${iva.toLocaleString('es-CO')}`;
  totalElement.textContent = `$${total.toLocaleString('es-CO')}`;
}

async function cargarDirecciones() {
  try {
    const direcciones = await SessionManager.fetchAPI('/api/direcciones');
    
    // Si no hay direcciones, mostrar mensaje
    if (direcciones.length === 0) {
      // Crear campo para agregar dirección
      const direccionField = document.createElement('div');
      direccionField.className = 'campo-form';
      direccionField.innerHTML = `
        <label for="direccion">Dirección de envío*</label>
        <input type="text" id="direccion" name="direccion" required>
      `;
      
      // Agregar después del campo de nombre
      const nombreField = document.getElementById('nombre');
      nombreField.parentNode.insertAdjacentElement('afterend', direccionField);
      
      return;
    }
    
    // Crear select para elegir dirección
    const direccionField = document.createElement('div');
    direccionField.className = 'campo-form';
    direccionField.innerHTML = `
      <label for="direccion-id">Selecciona una dirección de envío*</label>
      <select id="direccion-id" name="direccion-id" required>
        ${direcciones.map(dir => `
          <option value="${dir.id}" ${dir.es_principal ? 'selected' : ''}>
            ${dir.nombre}: ${dir.direccion}, ${dir.ciudad}
          </option>
        `).join('')}
      </select>
      <p><a href="perfil.html#direcciones">Administrar direcciones</a></p>
    `;
    
    // Reemplazar campo de dirección
    const direccionInput = document.getElementById('direccion');
    if (direccionInput) {
      direccionInput.parentNode.replaceWith(direccionField);
    }
  } catch (error) {
    console.error('Error al cargar direcciones:', error);
  }
}

function mostrarFormularioPago() {
  const metodoPago = document.querySelector('input[name="metodo-pago"]:checked').value;
  
  // Ocultar todos los formularios
  document.querySelectorAll('.formulario-pago').forEach(form => {
    form.style.display = 'none';
  });
  
  // Mostrar el formulario correspondiente
  document.getElementById(`form-${metodoPago}`).style.display = 'block';
}

async function procesarPago() {
  try {
    const erroresContainer = document.getElementById('errores-pago');
    erroresContainer.style.display = 'none';
    erroresContainer.textContent = '';
    
    // Validar formulario
    const nombre = document.getElementById('nombre').value;
    const direccionId = document.getElementById('direccion-id')?.value;
    const direccion = document.getElementById('direccion')?.value;
    const ciudad = document.getElementById('ciudad')?.value;
    const telefono = document.getElementById('telefono').value;
    
    const metodoPago = document.querySelector('input[name="metodo-pago"]:checked').value;
    
    if (!nombre || (!direccionId && !direccion) || (!direccionId && !ciudad) || !telefono) {
      mostrarError('Por favor completa todos los campos obligatorios');
      return;
    }
    
    // Validar formulario de pago específico
    if (metodoPago === 'tarjeta') {
      const numeroTarjeta = document.getElementById('numero-tarjeta').value;
      const nombreTarjeta = document.getElementById('nombre-tarjeta').value;
      const fechaVencimiento = document.getElementById('fecha-vencimiento').value;
      const cvv = document.getElementById('cvv').value;
      
      if (!numeroTarjeta || !nombreTarjeta || !fechaVencimiento || !cvv) {
        mostrarError('Por favor completa todos los datos de la tarjeta');
        return;
      }
    } else if (metodoPago === 'pse') {
      const banco = document.getElementById('banco').value;
      const tipoCuenta = document.getElementById('tipo-cuenta').value;
      
      if (!banco || !tipoCuenta) {
        mostrarError('Por favor selecciona el banco y tipo de cuenta');
        return;
      }
    }
    
    // Mostrar pantalla de carga
    mostrarPantallaCarga();
    
    // Obtener items del carrito
    const items = JSON.parse(localStorage.getItem('carrito')) || [];
    const cuponAplicado = JSON.parse(localStorage.getItem('cupon_aplicado'));
    
    let subtotal = items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    let descuento = cuponAplicado ? cuponAplicado.descuento : 0;
    let subtotalConDescuento = subtotal - descuento;
    let iva = subtotalConDescuento * 0.19;
    let total = subtotalConDescuento + iva;
    
    // Preparar datos del pedido
    const datosPedido = {
      direccion_envio_id: direccionId,
      metodo_pago: metodoPago,
      total: total,
      items: items.map(item => ({
        producto_id: item.id,
        talla: item.talla,
        color: item.color,
        cantidad: item.cantidad,
        precio: item.precio,
        subtotal: item.precio * item.cantidad
      }))
    };
    
    // Si es dirección nueva, guardarla primero
    if (!direccionId && direccion) {
      try {
        const nuevaDireccion = await SessionManager.fetchAPI('/api/direcciones', {
          method: 'POST',
          body: JSON.stringify({
            nombre: 'Principal',
            direccion: direccion,
            ciudad: ciudad,
            codigo_postal: document.getElementById('codigo-postal')?.value || '',
            telefono: telefono,
            es_principal: true
          })
        });
        
        datosPedido.direccion_envio_id = nuevaDireccion.direccion_id;
      } catch (error) {
        console.error('Error al guardar dirección:', error);
        ocultarPantallaCarga();
        mostrarError('Error al guardar la dirección de envío');
        return;
      }
    }
    
    // Crear pedido
    const respuestaPedido = await SessionManager.fetchAPI('/api/pedidos', {
      method: 'POST',
      body: JSON.stringify(datosPedido)
    });
    
    // Simular procesamiento de pago (en un sistema real, aquí iría la integración con pasarela de pagos)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Limpiar carrito
    localStorage.removeItem('carrito');
    localStorage.removeItem('cupon_aplicado');
    
    // Redirigir a página de confirmación
    window.location.href = `confirmacion-pedido.html?id=${respuestaPedido.pedido_id}`;
  } catch (error) {
    console.error('Error al procesar el pago:', error);
    ocultarPantallaCarga();
    mostrarError('Error al procesar el pago. Por favor intenta nuevamente.');
  }
}

function mostrarError(mensaje) {
  const erroresContainer = document.getElementById('errores-pago');
  erroresContainer.textContent = mensaje;
  erroresContainer.style.display = 'block';
  
  // Scroll al inicio para mostrar el error
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function mostrarPantallaCarga() {
  const pantallaDiv = document.createElement('div');
  pantallaDiv.className = 'pantalla-carga';
  pantallaDiv.innerHTML = `
    <div class="carga-contenido">
      <div class="spinner"></div>
      <h3>Procesando tu pedido</h3>
      <p>Por favor espera mientras confirmamos tu pago...</p>
    </div>
  `;
  
  document.body.appendChild(pantallaDiv);
}

function ocultarPantallaCarga() {
  const pantallaDiv = document.querySelector('.pantalla-carga');
  if (pantallaDiv) {
    pantallaDiv.remove();
  }
}