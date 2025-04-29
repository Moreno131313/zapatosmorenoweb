/**
 * Módulo de autenticación y login
 * @module login
 * @description Maneja la funcionalidad de inicio de sesión del usuario
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando formulario de login...');
  
  const loginForm = document.getElementById('formulario-login');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  
  /**
   * Función auxiliar para mostrar mensajes en la consola y en la página
   * @function log
   * @param {string} message - Mensaje a mostrar
   * @param {string} [type='info'] - Tipo de mensaje (info, error, warn)
   */
  function log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
    
    // Para debug, mostrar también en la página
    if (type === 'error' || type === 'warn') {
      const debugArea = document.querySelector('.debug-area') || (() => {
        const div = document.createElement('div');
        div.className = 'debug-area';
        div.style.position = 'fixed';
        div.style.bottom = '0';
        div.style.right = '0';
        div.style.maxWidth = '400px';
        div.style.maxHeight = '200px';
        div.style.overflow = 'auto';
        div.style.background = 'rgba(0,0,0,0.8)';
        div.style.color = 'white';
        div.style.padding = '10px';
        div.style.fontSize = '12px';
        div.style.fontFamily = 'monospace';
        div.style.zIndex = '9999';
        document.body.appendChild(div);
        return div;
      })();
      
      const msgDiv = document.createElement('div');
      msgDiv.textContent = `[${type.toUpperCase()}] ${message}`;
      msgDiv.style.color = type === 'error' ? '#ff6b6b' : '#feca57';
      debugArea.appendChild(msgDiv);
      
      // Limitar a 10 mensajes
      if (debugArea.children.length > 10) {
        debugArea.removeChild(debugArea.children[0]);
      }
    }
  }
  
  // Comprobación inicial del servidor
  log('Verificando conexión con el servidor...');
  fetch('/api/status')
    .then(response => {
      log(`Estado del servidor: ${response.status} ${response.statusText}`);
      return response.json();
    })
    .then(data => {
      log(`API status: ${JSON.stringify(data)}`);
    })
    .catch(error => {
      log(`Error al verificar el estado del servidor: ${error.message}`, 'error');
      
      // Mostrar advertencia visible
      const formHeader = document.querySelector('.form-header');
      if (formHeader) {
        const serverWarning = document.createElement('div');
        serverWarning.className = 'server-warning';
        serverWarning.innerHTML = `
          <i class="fas fa-exclamation-triangle"></i>
          <div>
            <strong>Problema de conexión con el servidor</strong>
            <div><small>Verifica que el servidor esté ejecutándose en puerto 3000</small></div>
          </div>
        `;
        serverWarning.style.color = '#ff6b6b';
        serverWarning.style.backgroundColor = '#ffe8e8';
        serverWarning.style.border = '1px solid #ff6b6b';
        serverWarning.style.borderRadius = '4px';
        serverWarning.style.padding = '10px';
        serverWarning.style.marginBottom = '15px';
        serverWarning.style.display = 'flex';
        serverWarning.style.alignItems = 'center';
        serverWarning.style.gap = '10px';
        formHeader.insertAdjacentElement('afterend', serverWarning);
      }
    });
  
  // Autocompletar el correo electrónico si viene de registro
  const ultimoEmail = localStorage.getItem('ultimo_email_registro');
  if (ultimoEmail && emailInput) {
    log(`Autocompletando email: ${ultimoEmail}`);
    emailInput.value = ultimoEmail;
    // Enfocar el campo de contraseña automáticamente
    if (passwordInput) {
      setTimeout(() => {
        passwordInput.focus();
      }, 100);
    }
  }
  
  /**
   * Muestra un mensaje de error en el formulario
   * @function mostrarError
   * @param {string} mensaje - Mensaje de error a mostrar
   */
  function mostrarError(mensaje) {
    // Remover mensajes de error anteriores
    const errorExistente = document.querySelector('.error-mensaje');
    if (errorExistente) {
      errorExistente.remove();
    }
    
    // Crear mensaje de error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-mensaje';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;
    
    // Insertarlo al inicio del formulario
    loginForm.prepend(errorDiv);
    
    // Log del error
    log(mensaje.replace(/<[^>]*>/g, ''), 'error');
  }
  
  if (loginForm) {
    log('Formulario de login encontrado, agregando evento submit');
    
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      log('Formulario enviado');
      
      // Remover mensajes de error anteriores
      const errorExistente = document.querySelector('.error-mensaje');
      if (errorExistente) {
        errorExistente.remove();
      }
      
      // Obtener los valores de los campos
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      
      // Validaciones básicas
      if (!email) {
        mostrarError('Por favor ingresa tu correo electrónico');
        emailInput.focus();
        return;
      }
      
      if (!password) {
        mostrarError('Por favor ingresa tu contraseña');
        passwordInput.focus();
        return;
      }
      
      // Mostrar indicador de carga
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const btnOriginalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
      
      try {
        log(`Intentando login para: ${email}`);
        
        // Determinar base URL
        const baseUrl = '';
        const apiUrl = `${baseUrl}/api/auth/login`;
        log(`URL de API: ${apiUrl}`);
        
        // Realizar solicitud
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        log(`Respuesta recibida: ${response.status} ${response.statusText}`);
        
        let data;
        try {
          const responseText = await response.text();
          log(`Respuesta texto: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
          
          try {
            data = JSON.parse(responseText);
            log(`Respuesta parseada: ${JSON.stringify(data).substring(0, 100)}...`);
          } catch (jsonError) {
            log(`Error al parsear JSON: ${jsonError.message}`, 'error');
            throw new Error(`No se pudo procesar la respuesta del servidor: ${jsonError.message}`);
          }
        } catch (textError) {
          log(`Error al obtener texto de respuesta: ${textError.message}`, 'error');
          throw new Error('No se pudo leer la respuesta del servidor');
        }
        
        if (!response.ok) {
          // Restaurar botón
          submitBtn.disabled = false;
          submitBtn.innerHTML = btnOriginalText;
          
          // Mostrar mensaje de error
          mostrarError(data.mensaje || 'Error al iniciar sesión');
          return;
        }
        
        // Login exitoso
        log('Login exitoso, guardando datos de sesión');
        
        // Asegurarse de que el token y los datos del usuario se guarden correctamente
        if (data.token) {
          console.log('Token recibido:', data.token.substring(0, 10) + '...');
          localStorage.setItem('token', data.token);
          
          // Guardar datos del usuario
          if (data.usuario) {
            console.log('Datos de usuario recibidos:', data.usuario);
            localStorage.setItem('user', JSON.stringify(data.usuario));
          }
          
          console.log('Datos guardados en localStorage');
          
          // Mostrar mensaje de éxito y redirigir
          const successDiv = document.createElement('div');
          successDiv.className = 'alert alert-success';
          successDiv.textContent = '¡Inicio de sesión exitoso! Redirigiendo...';
          loginForm.prepend(successDiv);
          
          // Redirigir a la página de inicio en lugar de perfil
          setTimeout(() => {
            window.location.href = '/index.html';
          }, 1000);
        } else {
          console.error('No se recibió token del servidor');
          alert('Error en el inicio de sesión: No se recibió token');
        }
      } catch (error) {
        log(`Error en login: ${error.message}`, 'error');
        mostrarError(error.message || 'Error al iniciar sesión');
        
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = btnOriginalText;
      }
    });
  } else {
    log('No se encontró el formulario de login', 'error');
  }
  
  // Manejar mostrar/ocultar contraseña
  const togglePassword = document.querySelector('.toggle-password');
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePassword.querySelector('i').classList.toggle('fa-eye');
      togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
    });
  }
});