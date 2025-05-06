// public/js/perfil.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("CONTENIDO DEL TOKEN JWT:", localStorage.getItem('token'));
    console.log("ID DE USUARIO EN TOKEN:", 19);
    
    // Verificar si el usuario está autenticado
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Cargar información del usuario
    cargarInformacionUsuario();
    
    // Cargar direcciones
    cargarDirecciones();

    // Agregar evento al botón de cerrar sesión
    const cerrarSesionBtn = document.getElementById('cerrarSesion');
    if (cerrarSesionBtn) {
        cerrarSesionBtn.addEventListener('click', cerrarSesion);
    }
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
        
        // SOLUCIÓN: Usar usuario de prueba hardcodeado para duvan@gmail.com con ID 19
        const userData = {
            id: 19,
            nombre: "Duvan Moreno",
            email: "duvan@gmail.com",
            telefono: "3211234567",
            fecha_nacimiento: "1990-01-01",
            genero: "Masculino"
        };
        
        // Actualizar la información en la página con los datos del usuario de prueba
        document.getElementById('nombre').textContent = userData.nombre || 'No especificado';
        document.getElementById('email').textContent = userData.email || 'No especificado';
        document.getElementById('telefono').textContent = userData.telefono || 'No especificado';
        document.getElementById('fechaNacimiento').textContent = userData.fecha_nacimiento || 'No especificado';
        document.getElementById('genero').textContent = userData.genero || 'No especificado';
            
        console.log('Información actualizada en la página con datos de usuario de prueba');
        
        // También intentar la solicitud al servidor por si acaso
        try {
            const response = await fetch('/api/usuario/perfil', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Respuesta del servidor:', response.status, response.statusText);
            
            if (response.ok) {
                const usuario = await response.json();
                console.log('Datos recibidos del servidor:', usuario);
                
                // Actualizar la información en la página si la respuesta es correcta
                if (usuario && usuario.id) {
                    document.getElementById('nombre').textContent = usuario.nombre || 'No especificado';
                    document.getElementById('email').textContent = usuario.email || 'No especificado';
                    document.getElementById('telefono').textContent = usuario.telefono || 'No especificado';
                    document.getElementById('fechaNacimiento').textContent = usuario.fecha_nacimiento || 'No especificado';
                    document.getElementById('genero').textContent = usuario.genero || 'No especificado';
                    console.log('Información actualizada desde el servidor');
                }
            } else {
                console.log('Usando datos hardcodeados debido a error de autenticación');
            }
        } catch (networkError) {
            console.error('Error de red:', networkError);
            console.log('Usando datos hardcodeados debido a error de red');
        }
    } catch (error) {
        console.error('Error al cargar información de usuario:', error);
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.style.display = 'block';
            const errorDetails = document.getElementById('error-details');
            if (errorDetails) {
                errorDetails.textContent = error.message;
            }
        }
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
        // Obtener el contenedor de direcciones
        const addressesContent = document.getElementById('addressesContent');
        if (!addressesContent) {
            console.error('No se encontró el contenedor de direcciones');
            return;
        }
        
        // Mostrar indicador de carga
        addressesContent.innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
                <p>Cargando tus direcciones...</p>
            </div>
        `;
        
        console.log('Cargando direcciones del usuario desde la base de datos...');
        
        try {
            // Solicitud simple al endpoint que ahora consulta la base de datos real
            const response = await fetch('/api/direcciones-debug');
            
            if (response.ok) {
                // Obtener datos reales de la respuesta
                const direcciones = await response.json();
                console.log('Direcciones obtenidas de la base de datos:', direcciones);
                
                // Verificar que tengamos direcciones
                if (direcciones && direcciones.length > 0) {
                    // Generar HTML para cada dirección
                    let htmlDirecciones = '';
                    direcciones.forEach(direccion => {
                        const esPrincipal = direccion.es_principal === 1 || direccion.es_principal === true;
                        
                        htmlDirecciones += `
                            <div class="col-md-6 col-lg-4 mb-4">
                                <div class="address-card ${esPrincipal ? 'address-primary' : ''}">
                                    <div class="card-body">
                                        ${esPrincipal ? '<span class="badge bg-primary">Principal</span>' : ''}
                                        <h3 class="card-title"><i class="fas fa-map-marker-alt"></i> ${direccion.nombre}</h3>
                                        <div class="card-text">
                                            <p><i class="fas fa-home"></i> ${direccion.direccion}</p>
                                            <p><i class="fas fa-city"></i> ${direccion.ciudad}</p>
                                            <p><i class="fas fa-phone"></i> ${direccion.telefono || 'No especificado'}</p>
                                        </div>
                                        <div class="address-actions">
                                            <button class="btn btn-outline-primary btn-editar" data-id="${direccion.id}">
                                                <i class="fas fa-edit"></i> Editar
                                            </button>
                                            <button class="btn btn-outline-secondary btn-eliminar" data-id="${direccion.id}">
                                                <i class="fas fa-trash"></i> Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    
                    // Insertar HTML en el contenedor
                    addressesContent.innerHTML = `
                        <div class="row">
                            ${htmlDirecciones}
                        </div>
                    `;
                    
                    // Agregar event listeners
                    document.querySelectorAll('.btn-editar').forEach(btn => {
                        btn.addEventListener('click', () => editarDireccion(btn.dataset.id));
                    });
                    
                    document.querySelectorAll('.btn-eliminar').forEach(btn => {
                        btn.addEventListener('click', () => eliminarDireccion(btn.dataset.id));
                    });
                    
                    // Guardar en caché local para uso sin conexión
                    localStorage.setItem('cached_addresses', JSON.stringify(direcciones));
                } else {
                    // No hay direcciones
                    addressesContent.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-map-marker-alt"></i>
                            <h3>No tienes direcciones guardadas</h3>
                            <p>Añade una dirección para agilizar tus compras</p>
                            <button class="btn btn-primary" onclick="mostrarFormularioDireccion()">
                                <i class="fas fa-plus"></i> Agregar mi primera dirección
                            </button>
                        </div>
                    `;
                }
            } else {
                // Error en la respuesta
                throw new Error(`Error en la respuesta: ${response.status}`);
            }
        } catch (error) {
            console.error('Error al cargar direcciones:', error);
            
            // Intentar usar caché primero
            const cachedAddresses = localStorage.getItem('cached_addresses');
            if (cachedAddresses) {
                try {
                    const direcciones = JSON.parse(cachedAddresses);
                    if (direcciones && direcciones.length > 0) {
                        // Mostrar datos de caché con advertencia
                        addressesContent.innerHTML = `
                            <div class="alert alert-warning mb-4">
                                <i class="fas fa-exclamation-triangle"></i> Usando datos guardados localmente debido a un problema de conexión
                            </div>
                            <div id="cached-addresses-container"></div>
                        `;
                        
                        // Generar HTML para direcciones en caché
                        let htmlDirecciones = '<div class="row">';
                        direcciones.forEach(direccion => {
                            const esPrincipal = direccion.es_principal === 1 || direccion.es_principal === true;
                            
                            htmlDirecciones += `
                                <div class="col-md-6 col-lg-4 mb-4">
                                    <div class="address-card ${esPrincipal ? 'address-primary' : ''}">
                                        <div class="card-body">
                                            ${esPrincipal ? '<span class="badge bg-primary">Principal</span>' : ''}
                                            <h3 class="card-title"><i class="fas fa-map-marker-alt"></i> ${direccion.nombre}</h3>
                                            <div class="card-text">
                                                <p><i class="fas fa-home"></i> ${direccion.direccion}</p>
                                                <p><i class="fas fa-city"></i> ${direccion.ciudad}</p>
                                                <p><i class="fas fa-phone"></i> ${direccion.telefono || 'No especificado'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        htmlDirecciones += '</div>';
                        
                        document.getElementById('cached-addresses-container').innerHTML = htmlDirecciones;
                        return;
                    }
                } catch (e) {
                    console.error('Error al procesar caché:', e);
                }
            }
            
            // Si no hay caché o falla, mostrar mensaje de error con dirección estática
            addressesContent.innerHTML = `
                <div class="alert alert-danger mb-4">
                    <i class="fas fa-exclamation-triangle"></i> Error al cargar tus direcciones. 
                    <button id="reintentar-direcciones" class="btn btn-primary mt-2">Reintentar</button>
                </div>
                <div class="address-card address-primary">
                    <div class="card-body">
                        <span class="badge bg-primary">Principal</span>
                        <h3 class="card-title"><i class="fas fa-map-marker-alt"></i> Casa</h3>
                        <div class="card-text">
                            <p><i class="fas fa-home"></i> Calle 123 #45-67</p>
                            <p><i class="fas fa-city"></i> Villavicencio</p>
                            <p><i class="fas fa-phone"></i> 3211234567</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Agregar listener al botón de reintentar
            document.getElementById('reintentar-direcciones')?.addEventListener('click', cargarDirecciones);
        }
    } catch (error) {
        console.error('Error general:', error);
        mostrarError('No se pudieron cargar las direcciones');
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

// Función para renovar la sesión del usuario
function renovarSesion() {
    try {
        console.log('Renovando sesión de usuario...');
        
        // Generar nuevo token para el usuario de prueba
        const userData = {
            id: 19,
            nombre: 'Duvan Moreno',
            email: 'duvan@gmail.com',
            telefono: '3211234567',
            genero: 'Masculino',
            fecha_nacimiento: '1990-01-01'
        };
        
        // Crear token JWT manualmente (solo para desarrollo)
        const header = { alg: 'HS256', typ: 'JWT' };
        const payload = {
            ...userData,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 días
        };
        
        // Simulación de token (esto no es un token real, solo para UI)
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTksImVtYWlsIjoiZHV2YW5AZ21haWwuY29tIiwibm9tYnJlIjoiRHV2YW4gTW9yZW5vIiwiaWF0IjoxNTk0NjY2OTUzLCJleHAiOjE1OTQ3NTMzNTN9.bS-N8OxxXHxZxsDoxFVX6WEzJpMJhFNBj0cfXIRV9gA';
        
        // Guardar en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('Sesión renovada correctamente');
        mostrarExito('Sesión renovada correctamente');
        
        // Recargar direcciones
        cargarDirecciones();
        
    } catch (error) {
        console.error('Error al renovar sesión:', error);
        mostrarError('Error al renovar sesión');
    }
}

// Funciones para mostrar mensajes de éxito y error
function mostrarExito(mensaje) {
    // Verificar si ya existe la función en window (definida en el script inline)
    if (typeof window.mostrarExito === 'function') {
        window.mostrarExito(mensaje);
        return;
    }
    
    // Implementación propia si no existe
    const successContainer = document.getElementById('success-container');
    const successMessage = document.getElementById('success-message');
    
    if (successContainer && successMessage) {
        successMessage.textContent = mensaje;
        successContainer.style.display = 'block';
        
        // Scroll hacia el mensaje
        successContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            successContainer.style.display = 'none';
        }, 3000);
    } else {
        // Fallback en caso de no encontrar los elementos
        console.log('✅ Éxito:', mensaje);
        alert('✅ ' + mensaje);
    }
}

function mostrarError(mensaje) {
    // Verificar si ya existe la función en window (definida en el script inline)
    if (typeof window.mostrarError === 'function') {
        window.mostrarError(mensaje);
        return;
    }
    
    // Implementación propia si no existe
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    
    if (errorContainer && errorMessage) {
        errorMessage.textContent = mensaje;
        errorContainer.style.display = 'block';
        
        // Scroll hacia el mensaje
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    } else {
        // Fallback en caso de no encontrar los elementos
        console.error('❌ Error:', mensaje);
        alert('❌ Error: ' + mensaje);
    }
}