// public/js/perfil.js
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si el usuario está autenticado
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Cargar información del usuario
    cargarInformacionUsuario();

    // Agregar evento al botón de cerrar sesión
    document.getElementById('cerrarSesion').addEventListener('click', cerrarSesion);
});

async function cargarInformacionUsuario() {
    try {
        console.log('Cargando información del usuario...');
        const token = localStorage.getItem('token');
        console.log('Token disponible:', token ? 'Sí' : 'No');
        
        if (!token) {
            console.error('No hay token disponible');
            alert('No hay sesión activa. Serás redirigido al login.');
            window.location.href = '/login.html';
            return;
        }
        
        // Verificar formato del token
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            console.error('Token con formato inválido:', token);
            localStorage.removeItem('token');
            alert('La sesión no es válida. Por favor, inicia sesión nuevamente.');
            window.location.href = '/login.html';
            return;
        }
        
        console.log('Enviando solicitud al servidor...');
        console.log('URL:', '/api/usuario/perfil');
        console.log('Headers:', {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.substring(0, 15)}...` // Solo mostrar parte del token por seguridad
        });
        
        try {
            const response = await fetch('/api/usuario/perfil', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Respuesta del servidor:', response.status, response.statusText);
            
            if (!response.ok) {
                const text = await response.text();
                console.error('Error de respuesta:', response.status);
                console.error('Contenido de la respuesta:', text);
                
                throw new Error(`Error al cargar la información: ${response.statusText}`);
            }

            const usuario = await response.json();
            console.log('Datos recibidos:', usuario);
            
            // Actualizar la información en la página
            document.getElementById('nombre').textContent = usuario.nombre || 'No especificado';
            document.getElementById('email').textContent = usuario.email || 'No especificado';
            document.getElementById('telefono').textContent = usuario.telefono || 'No especificado';
            document.getElementById('fechaNacimiento').textContent = usuario.fecha_nacimiento || 'No especificado';
            document.getElementById('genero').textContent = usuario.genero || 'No especificado';
            
            console.log('Información actualizada en la página');
        } catch (networkError) {
            console.error('Error de red:', networkError);
            
            // Intentar usar datos del localStorage como fallback
            console.log('Intentando usar datos del localStorage como fallback...');
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (userData && userData.email) {
                document.getElementById('nombre').textContent = userData.nombre || 'No especificado';
                document.getElementById('email').textContent = userData.email || 'No especificado';
                document.getElementById('telefono').textContent = userData.telefono || 'No especificado';
                document.getElementById('fechaNacimiento').textContent = userData.fecha_nacimiento || 'No especificado';
                document.getElementById('genero').textContent = userData.genero || 'No especificado';
                console.log('Se usaron datos del localStorage');
            } else {
                throw new Error('No se pudieron cargar los datos del usuario');
            }
        }
    } catch (error) {
        console.error('Error al cargar información de usuario:', error);
        document.getElementById('error-container').style.display = 'block';
        document.getElementById('error-details').textContent = error.message;
    }
}

function cerrarSesion() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

async function cargarPedidos() {
  try {
    const pedidosContainer = document.getElementById('pedidos-container');
    if (!pedidosContainer) return;
    
    const pedidos = await SessionManager.fetchAPI('/api/pedidos');
    
    if (!pedidos || pedidos.length === 0) {
      pedidosContainer.innerHTML = `
        <div class="pedidos-vacios">
          <i class="fas fa-box-open"></i>
          <h3>No tienes pedidos</h3>
          <p>¡Realiza tu primera compra!</p>
          <a href="index.html" class="btn-primario">Ir a comprar</a>
        </div>
      `;
      return;
    }
    
    pedidosContainer.innerHTML = pedidos.map(pedido => {
      // Formatear fecha
      const fecha = new Date(pedido.fecha_pedido);
      
      return `
        <div class="pedido-item">
          <div class="pedido-header">
            <div class="pedido-info">
              <h3>Pedido #PED-${pedido.id.toString().padStart(8, '0')}</h3>
              <span class="pedido-fecha">${fecha.toLocaleString('es-CO')}</span>
            </div>
            <div class="pedido-estado">
              <span class="estado ${pedido.estado}">${obtenerNombreEstado(pedido.estado)}</span>
            </div>
          </div>
          
          <div class="pedido-productos">
            ${pedido.productos.map(producto => `
              <div class="pedido-producto">
                <img src="${producto.imagen}" alt="${producto.nombre}">
                <div class="producto-info">
                  <h4>${producto.nombre}</h4>
                  <p>Talla: ${producto.talla} | Cantidad: ${producto.cantidad}</p>
                  <span class="producto-precio">$${parseFloat(producto.precio_unitario).toLocaleString('es-CO')}</span>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="pedido-summary">
            <div class="pedido-total">
              <span>Total:</span>
              <span class="total-precio">$${parseFloat(pedido.total).toLocaleString('es-CO')}</span>
            </div>
            <div class="pedido-actions">
              <a href="confirmacion-pedido.html?id=${pedido.id}" class="btn-detalles-pedido">
                <i class="fas fa-eye"></i> Ver detalles
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error al cargar pedidos:', error);
  }
}

async function cargarDirecciones() {
  try {
    const direccionesContainer = document.getElementById('direcciones-container');
    if (!direccionesContainer) return;
    
    const direcciones = await SessionManager.fetchAPI('/api/direcciones');
    
    if (!direcciones || direcciones.length === 0) {
      direccionesContainer.innerHTML = `
        <div class="sin-direcciones">
          <i class="fas fa-map-marker-alt"></i>
          <h3>No tienes direcciones guardadas</h3>
          <p>Añade una dirección para agilizar tus compras</p>
        </div>
      `;
    } else {
      direccionesContainer.innerHTML = direcciones.map(direccion => `
        <div class="direccion-item">
          <div class="direccion-header">
            <h3>${direccion.nombre}</h3>
            ${direccion.es_principal ? '<span class="direccion-principal">Principal</span>' : ''}
          </div>
          <div class="direccion-detalles">
            <p><strong>Dirección:</strong> ${direccion.direccion}</p>
            <p><strong>Ciudad:</strong> ${direccion.ciudad}</p>
            <p><strong>Teléfono:</strong> ${direccion.telefono}</p>
          </div>
          <div class="direccion-actions">
            <button class="btn-editar" data-id="${direccion.id}">
              <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn-eliminar" data-id="${direccion.id}">
              <i class="fas fa-trash"></i> Eliminar
            </button>
          </div>
        </div>
      `).join('');
      
      // Agregar event listeners para botones de editar y eliminar
      document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => editarDireccion(btn.dataset.id));
      });
      
      document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', () => eliminarDireccion(btn.dataset.id));
      });
    }
    
    // Agregar event listener para botón de agregar dirección
    const btnAgregarDireccion = document.getElementById('agregar-direccion');
    if (btnAgregarDireccion) {
      btnAgregarDireccion.addEventListener('click', mostrarFormularioDireccion);
    }
  } catch (error) {
    console.error('Error al cargar direcciones:', error);
  }
}

function cambiarSeccion(event) {
  event.preventDefault();
  
  // Quitar clase active de todos los elementos del menú
  document.querySelectorAll('.perfil-menu li').forEach(item => {
    item.classList.remove('active');
  });
  
  // Agregar clase active al elemento clickeado
  this.classList.add('active');
  
  // Obtener sección a mostrar
  const seccion = this.dataset.section;
  
  mostrarSeccion(seccion);
}

function mostrarSeccion(seccion) {
  // Ocultar todas las secciones
  document.querySelectorAll('.perfil-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Mostrar la sección seleccionada
  const seccionActiva = document.getElementById(seccion);
  if (seccionActiva) {
    seccionActiva.classList.add('active');
  }
  
  // Actualizar URL con el hash
  window.location.hash = seccion;
  
  // Actualizar menú
  document.querySelectorAll('.perfil-menu li').forEach(item => {
    if (item.dataset.section === seccion) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

async function actualizarDatosPersonales(event) {
  event.preventDefault();
  
  const nombre = document.getElementById('nombre').value;
  const telefono = document.getElementById('telefono').value;
  const fechaNacimiento = document.getElementById('fecha_nacimiento').value;
  const genero = document.getElementById('genero').value;
  
  try {
    await SessionManager.fetchAPI('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({
        nombre,
        telefono,
        fecha_nacimiento: fechaNacimiento,
        genero
      })
    });
    
    // Mostrar mensaje de éxito
    const mensaje = document.createElement('div');
    mensaje.className = 'mensaje-exito';
    mensaje.innerHTML = '<i class="fas fa-check-circle"></i> Datos actualizados correctamente';
    
    const formActions = document.querySelector('.form-actions');
    formActions.parentNode.insertBefore(mensaje, formActions);
    
    // Ocultar mensaje después de 3 segundos
    setTimeout(() => {
      mensaje.remove();
    }, 3000);
    
    // Actualizar datos en la UI
    document.getElementById('nombre').textContent = nombre;
    document.getElementById('telefono').textContent = telefono || 'No especificado';
    document.getElementById('fechaNacimiento').textContent = fechaNacimiento || 'No especificada';
    document.getElementById('genero').textContent = genero || 'No especificado';
    
  } catch (error) {
    console.error('Error al actualizar datos personales:', error);
    
    // Mostrar mensaje de error
    const mensaje = document.createElement('div');
    mensaje.className = 'mensaje-error';
    mensaje.innerHTML = '<i class="fas fa-times-circle"></i> Error al actualizar datos';
    
    const formActions = document.querySelector('.form-actions');
    formActions.parentNode.insertBefore(mensaje, formActions);
    
    // Ocultar mensaje después de 3 segundos
    setTimeout(() => {
      mensaje.remove();
    }, 3000);
  }
}

async function cambiarPassword(event) {
  event.preventDefault();
  
  const passwordActual = document.getElementById('password_actual').value;
  const passwordNuevo = document.getElementById('password_nuevo').value;
  const passwordConfirmacion = document.getElementById('password_confirmacion').value;
  
  // Validar que las contraseñas coincidan
  if (passwordNuevo !== passwordConfirmacion) {
    mostrarMensaje(
      'mensaje-error',
      '<i class="fas fa-times-circle"></i> Las contraseñas no coinciden',
      document.querySelector('#form-cambiar-password .form-actions')
    );
    return;
  }
  
  try {
    await SessionManager.fetchAPI('/api/auth/cambiar-password', {
      method: 'POST',
      body: JSON.stringify({
        password_actual: passwordActual,
        password_nuevo: passwordNuevo
      })
    });
    
    // Mostrar mensaje de éxito
    mostrarMensaje(
      'mensaje-exito',
      '<i class="fas fa-check-circle"></i> Contraseña actualizada correctamente',
      document.querySelector('#form-cambiar-password .form-actions')
    );
    
    // Limpiar formulario
    document.getElementById('password_actual').value = '';
    document.getElementById('password_nuevo').value = '';
    document.getElementById('password_confirmacion').value = '';
    
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    
    // Mostrar mensaje de error
    mostrarMensaje(
      'mensaje-error',
      '<i class="fas fa-times-circle"></i> Error al cambiar contraseña. Verifica tu contraseña actual.',
      document.querySelector('#form-cambiar-password .form-actions')
    );
  }
}

function mostrarFormularioDireccion() {
  // Crear modal para agregar dirección
  const modal = document.createElement('div');
  modal.className = 'modal-direccion';
  modal.innerHTML = `
    <div class="modal-contenido">
      <button class="cerrar-modal">&times;</button>
      <h3>Agregar Nueva Dirección</h3>
      
      <form id="form-direccion" class="form-direccion">
        <div class="form-group">
          <label for="dir-nombre">Nombre para esta dirección</label>
          <input type="text" id="dir-nombre" name="nombre" placeholder="Ej: Casa, Trabajo, etc." required>
        </div>
        
        <div class="form-group">
          <label for="dir-direccion">Dirección</label>
          <input type="text" id="dir-direccion" name="direccion" placeholder="Dirección completa" required>
        </div>
        
        <div class="form-group">
          <label for="dir-ciudad">Ciudad</label>
          <input type="text" id="dir-ciudad" name="ciudad" placeholder="Ciudad" required>
        </div>
        
        <div class="form-group">
          <label for="dir-codigo-postal">Código Postal</label>
          <input type="text" id="dir-codigo-postal" name="codigo_postal" placeholder="Código postal (opcional)">
        </div>
        
        <div class="form-group">
          <label for="dir-telefono">Teléfono de contacto</label>
          <input type="tel" id="dir-telefono" name="telefono" placeholder="Teléfono de contacto" required>
        </div>
        
        <div class="form-check">
          <input type="checkbox" id="dir-principal" name="es_principal">
          <label for="dir-principal">Establecer como dirección principal</label>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn-guardar">
            <i class="fas fa-save"></i> Guardar Dirección
          </button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Agregar event listener para cerrar el modal
  const cerrarModal = modal.querySelector('.cerrar-modal');
  cerrarModal.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Agregar event listener para el formulario
  const formDireccion = document.getElementById('form-direccion');
  formDireccion.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const direccion = {
      nombre: document.getElementById('dir-nombre').value,
      direccion: document.getElementById('dir-direccion').value,
      ciudad: document.getElementById('dir-ciudad').value,
      codigo_postal: document.getElementById('dir-codigo-postal').value,
      telefono: document.getElementById('dir-telefono').value,
      es_principal: document.getElementById('dir-principal').checked
    };
    
    try {
      await SessionManager.fetchAPI('/api/direcciones', {
        method: 'POST',
        body: JSON.stringify(direccion)
      });
      
      // Cerrar modal
      document.body.removeChild(modal);
      
      // Recargar direcciones
      cargarDirecciones();
      
    } catch (error) {
      console.error('Error al guardar dirección:', error);
      alert('Error al guardar la dirección');
    }
  });
}

async function editarDireccion(id) {
  try {
    // Obtener datos de la dirección
    const direccion = await SessionManager.fetchAPI(`/api/direcciones/${id}`);
    
    // Crear modal similar a mostrarFormularioDireccion pero con los datos cargados
    const modal = document.createElement('div');
    modal.className = 'modal-direccion';
    modal.innerHTML = `
      <div class="modal-contenido">
        <button class="cerrar-modal">&times;</button>
        <h3>Editar Dirección</h3>
        
        <form id="form-editar-direccion" class="form-direccion">
          <div class="form-group">
            <label for="edit-dir-nombre">Nombre para esta dirección</label>
            <input type="text" id="edit-dir-nombre" name="nombre" value="${direccion.nombre}" required>
          </div>
          
          <div class="form-group">
            <label for="edit-dir-direccion">Dirección</label>
            <input type="text" id="edit-dir-direccion" name="direccion" value="${direccion.direccion}" required>
          </div>
          
          <div class="form-group">
            <label for="edit-dir-ciudad">Ciudad</label>
            <input type="text" id="edit-dir-ciudad" name="ciudad" value="${direccion.ciudad}" required>
          </div>
          
          <div class="form-group">
            <label for="edit-dir-codigo-postal">Código Postal</label>
            <input type="text" id="edit-dir-codigo-postal" name="codigo_postal" value="${direccion.codigo_postal || ''}">
          </div>
          
          <div class="form-group">
            <label for="edit-dir-telefono">Teléfono de contacto</label>
            <input type="tel" id="edit-dir-telefono" name="telefono" value="${direccion.telefono}" required>
          </div>
          
          <div class="form-check">
            <input type="checkbox" id="edit-dir-principal" name="es_principal" ${direccion.es_principal ? 'checked' : ''}>
            <label for="edit-dir-principal">Establecer como dirección principal</label>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-guardar">
              <i class="fas fa-save"></i> Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Agregar event listener para cerrar el modal
    const cerrarModal = modal.querySelector('.cerrar-modal');
    cerrarModal.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Agregar event listener para el formulario
    const formDireccion = document.getElementById('form-editar-direccion');
    formDireccion.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const direccionActualizada = {
        nombre: document.getElementById('edit-dir-nombre').value,
        direccion: document.getElementById('edit-dir-direccion').value,
        ciudad: document.getElementById('edit-dir-ciudad').value,
        codigo_postal: document.getElementById('edit-dir-codigo-postal').value,
        telefono: document.getElementById('edit-dir-telefono').value,
        es_principal: document.getElementById('edit-dir-principal').checked
      };
      
      try {
        await SessionManager.fetchAPI(`/api/direcciones/${id}`, {
          method: 'PUT',
          body: JSON.stringify(direccionActualizada)
        });
        
        // Cerrar modal
        document.body.removeChild(modal);
        
        // Recargar direcciones
        cargarDirecciones();
        
      } catch (error) {
        console.error('Error al actualizar dirección:', error);
        alert('Error al actualizar la dirección');
      }
    });

    // public/js/perfil.js (continuación)
  } catch (error) {
    console.error('Error al obtener dirección:', error);
    alert('Error al obtener la información de la dirección');
  }
}

async function eliminarDireccion(id) {
  if (confirm('¿Estás seguro de eliminar esta dirección?')) {
    try {
      await SessionManager.fetchAPI(`/api/direcciones/${id}`, {
        method: 'DELETE'
      });
      
      // Recargar direcciones
      cargarDirecciones();
      
    } catch (error) {
      console.error('Error al eliminar dirección:', error);
      alert('Error al eliminar la dirección');
    }
  }
}

function mostrarMensaje(tipo, contenido, elementoAnterior) {
  const mensaje = document.createElement('div');
  mensaje.className = tipo;
  mensaje.innerHTML = contenido;
  
  elementoAnterior.parentNode.insertBefore(mensaje, elementoAnterior);
  
  // Ocultar mensaje después de 3 segundos
  setTimeout(() => {
    mensaje.remove();
  }, 3000);
}

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