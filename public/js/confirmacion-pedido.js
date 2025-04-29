document.addEventListener('DOMContentLoaded', async () => {
    // Obtener ID del pedido de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const pedidoId = urlParams.get('id');
    
    if (!pedidoId) {
      window.location.href = 'index.html';
      return;
    }
    
    // Verificar si el usuario está logueado
    if (!SessionManager.isLoggedIn()) {
      window.location.href = 'login.html';
      return;
    }
    
    try {
      // Cargar detalles del pedido
      const pedido = await SessionManager.fetchAPI(`/api/pedidos/${pedidoId}`);
      
      // Actualizar información del pedido en la página
      document.getElementById('numero-pedido').textContent = `PED-${pedidoId.padStart(8, '0')}`;
      
      const fechaPedido = new Date(pedido.fecha_pedido);
      document.getElementById('fecha-pedido').textContent = fechaPedido.toLocaleString('es-CO');
      
      document.getElementById('estado-pedido').textContent = obtenerNombreEstado(pedido.estado);
      document.getElementById('metodo-pago').textContent = obtenerNombreMetodoPago(pedido.metodo_pago);
      document.getElementById('direccion-envio').textContent = pedido.direccion_envio || 'No disponible';
      document.getElementById('total-pedido').textContent = `$${pedido.total.toLocaleString('es-CO')}`;
      
      // Cargar productos
      const productosContainer = document.getElementById('lista-productos');
      productosContainer.innerHTML = pedido.detalles.map(item => `
        <div class="producto-item">
          <img src="${item.imagen}" alt="${item.nombre}" class="producto-imagen">
          <div class="producto-info">
            <h4 class="producto-titulo">${item.nombre}</h4>
            <div class="producto-atributos">
              <span>Talla: ${item.talla}</span>
              <span>Color: ${item.color}</span>
            </div>
            <div class="producto-cantidad">Cantidad: ${item.cantidad}</div>
            <div class="producto-precio">$${item.precio_unitario.toLocaleString('es-CO')}</div>
          </div>
        </div>
      `).join('');
      
      // Cargar timeline de seguimiento
      const timelineContainer = document.getElementById('timeline-seguimiento');
      timelineContainer.innerHTML = pedido.seguimiento.map(item => `
        <div class="timeline-item">
          <div class="timeline-punto ${item.estado === pedido.estado ? 'activo' : ''}"></div>
          <div class="timeline-fecha">${new Date(item.fecha).toLocaleString('es-CO')}</div>
          <div class="timeline-titulo">${obtenerNombreEstado(item.estado)}</div>
          <div class="timeline-descripcion">${item.descripcion}</div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error al cargar detalles del pedido:', error);
    }
  });
  
  function obtenerNombreEstado(estado) {
    const estados = {
      'pendiente': 'Pendiente',
      'preparando': 'En preparación',
      'enviado': 'Enviado',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    
    return estados[estado] || estado;
  }
  
  function obtenerNombreMetodoPago(metodo) {
    const metodos = {
      'tarjeta': 'Tarjeta de crédito/débito',
      'pse': 'PSE - Débito bancario',
      'efectivo': 'Pago contra entrega'
    };
    
    return metodos[metodo] || metodo;
  }