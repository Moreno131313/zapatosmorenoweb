// public/js/registro.js
document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const formulario = document.getElementById('form-registro');
    const mensajeExito = document.querySelector('.mensaje-exito');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    const btnRegistro = document.getElementById('btn-registro');
    const strengthMeter = document.querySelector('.strength-meter');
    const strengthText = document.querySelector('.strength-text');
    
    // Inicialización de elementos interactivos
    initPasswordToggle();
    initPasswordStrengthMeter();
    
    // Validación de formulario
    if (formulario) {
        formulario.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Resetear mensajes de error
            const mensajesError = document.querySelectorAll('.error-message');
            mensajesError.forEach(error => error.classList.remove('visible'));
            
            // Validar campos
            let hayErrores = false;
            
            // Nombre completo
            const nombreInput = document.getElementById('nombre-completo');
            if (!nombreInput.value.trim()) {
                mostrarError('nombre-error', 'Por favor, ingresa tu nombre completo');
                hayErrores = true;
            } else if (nombreInput.value.trim().length < 3) {
                mostrarError('nombre-error', 'El nombre debe tener al menos 3 caracteres');
                hayErrores = true;
            } else if (!nombreInput.value.includes(' ')) {
                mostrarError('nombre-error', 'Por favor ingresa tu nombre completo (nombre y apellido)');
                hayErrores = true;
            }
            
            // Email
            const emailInput = document.getElementById('email');
            if (!emailInput.value.trim()) {
                mostrarError('email-error', 'Por favor, ingresa tu correo electrónico');
                hayErrores = true;
            } else if (!validarEmail(emailInput.value)) {
                mostrarError('email-error', 'Por favor, ingresa un correo electrónico válido');
                hayErrores = true;
            }
            
            // Contraseña
            if (!passwordInput.value) {
                mostrarError('password-error', 'Por favor, ingresa una contraseña');
                hayErrores = true;
            } else if (passwordInput.value.length < 8) {
                mostrarError('password-error', 'La contraseña debe tener al menos 8 caracteres');
                hayErrores = true;
            } else {
                const fortaleza = calcularFortalezaPassword(passwordInput.value);
                if (fortaleza < 40) {
                    mostrarError('password-error', 'Tu contraseña es demasiado débil. Intenta incluir mayúsculas, números y símbolos.');
                    hayErrores = true;
                }
            }
            
            // Confirmar contraseña
            if (!confirmPasswordInput.value) {
                mostrarError('confirm-password-error', 'Por favor, confirma tu contraseña');
                hayErrores = true;
            } else if (passwordInput.value !== confirmPasswordInput.value) {
                mostrarError('confirm-password-error', 'Las contraseñas no coinciden');
                hayErrores = true;
            }
            
            // Aceptar términos
            const terminosCheck = document.getElementById('terminos');
            if (!terminosCheck.checked) {
                mostrarError('terminos-error', 'Debes aceptar los términos y condiciones');
                hayErrores = true;
            }
            
            // Si no hay errores, proceder con el registro
            if (!hayErrores) {
                // Mostrar estado de carga y animar formulario
                btnRegistro.classList.add('loading');
                btnRegistro.disabled = true;
                animarFormularioEnvio();
                
                // Preparar datos de usuario con nombres de campo correctos
                const nombreCompleto = document.getElementById('nombre-completo').value;
                const userData = {
                    nombre: nombreCompleto, // Usar "nombre" en lugar de "nombre-completo"
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value,
                    telefono: document.getElementById('telefono').value || null,
                };
                
                console.log('Preparando datos de usuario para registro:', userData);
                
                // Enviar datos al servidor
                const resultado = await registrarUsuario(userData);
                
                if (resultado.success) {
                    // Mostrar mensaje de éxito
                    console.log('Registro exitoso, redirigiendo...');
                    
                    // Ocultar formulario y mostrar mensaje de éxito
                    formulario.style.opacity = '0';
                    formulario.style.transform = 'translateY(20px)';
                    formulario.style.pointerEvents = 'none';
                    
                    setTimeout(() => {
                        formulario.style.display = 'none';
                        
                        // Mostrar mensaje de éxito
                        if (mensajeExito) {
                            mensajeExito.classList.add('visible');
                            // Contenido del mensaje
                            const mensajeContenido = mensajeExito.querySelector('.mensaje-contenido');
                            if (mensajeContenido) {
                                mensajeContenido.textContent = resultado.mensaje;
                            }
                        }
                        
                        // Actualizar contador de carrito si existe
                        const cartCountElements = document.querySelectorAll('.cart-count');
                        if (cartCountElements) {
                            cartCountElements.forEach(el => {
                                el.textContent = '0';
                            });
                        }
                        
                        // Redirigir después de 3 segundos
                        setTimeout(() => {
                            window.location.href = 'login.html'; // Redirigir a login en lugar de index
                        }, 3000);
                    }, 300);
                } else {
                    // Mostrar mensaje de error
                    btnRegistro.classList.remove('loading');
                    btnRegistro.disabled = false;
                    
                    // Crear mensaje de error visible
                    const errorGeneral = document.createElement('div');
                    errorGeneral.className = 'error-message general-error visible';
                    errorGeneral.textContent = resultado.mensaje;
                    
                    // Insertar mensaje de error antes del botón
                    btnRegistro.parentNode.insertBefore(errorGeneral, btnRegistro);
                    
                    // Quitar mensaje después de 5 segundos
                    setTimeout(() => {
                        errorGeneral.classList.remove('visible');
                        setTimeout(() => {
                            errorGeneral.remove();
                        }, 300);
                    }, 5000);
                }
            } else {
                // Animar el scroll hacia el primer error
                const primerError = document.querySelector('.error-message.visible');
                if (primerError) {
                    setTimeout(() => {
                        primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                }
            }
        });
    }
    
    // Función para mostrar mensaje de error
    function mostrarError(id, mensaje) {
        const errorElement = document.getElementById(id);
        if (errorElement) {
            errorElement.textContent = mensaje;
            errorElement.classList.add('visible');
            
            // Añadir clase de error al input relacionado
            const inputId = id.replace('-error', '');
            const inputElement = document.getElementById(inputId);
            if (inputElement) {
                inputElement.classList.add('error');
                
                // Quitar clase de error cuando el usuario comience a escribir
                inputElement.addEventListener('input', function() {
                    this.classList.remove('error');
                    errorElement.classList.remove('visible');
                }, { once: true });
                
                // Añadir efecto de shake
                inputElement.classList.add('shake');
                setTimeout(() => {
                    inputElement.classList.remove('shake');
                }, 500);
            }
        }
    }
    
    // Función para validar email
    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    // Inicializar toggle de contraseña
    function initPasswordToggle() {
        togglePasswordBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const input = this.previousElementSibling;
                if (input.type === 'password') {
                    input.type = 'text';
                    this.innerHTML = '<i class="fas fa-eye-slash"></i>';
                } else {
                    input.type = 'password';
                    this.innerHTML = '<i class="fas fa-eye"></i>';
                }
            });
        });
    }
    
    // Inicializar medidor de fortaleza de contraseña
    function initPasswordStrengthMeter() {
        if (passwordInput && strengthMeter && strengthText) {
            passwordInput.addEventListener('input', function() {
                const valor = this.value;
                const fortaleza = calcularFortalezaPassword(valor);
                
                // Resetear clases
                strengthMeter.classList.remove('weak', 'medium', 'strong');
                strengthText.classList.remove('weak', 'medium', 'strong');
                
                if (valor.length === 0) {
                    strengthText.textContent = '';
                } else if (fortaleza < 40) {
                    strengthMeter.classList.add('weak');
                    strengthText.classList.add('weak');
                    strengthText.textContent = 'Débil';
                } else if (fortaleza < 80) {
                    strengthMeter.classList.add('medium');
                    strengthText.classList.add('medium');
                    strengthText.textContent = 'Media';
                } else {
                    strengthMeter.classList.add('strong');
                    strengthText.classList.add('strong');
                    strengthText.textContent = 'Fuerte';
                }
            });
        } else {
            console.log('Elementos del medidor de fortaleza no encontrados en el DOM');
        }
    }
    
    // Función para calcular la fortaleza de la contraseña
    function calcularFortalezaPassword(password) {
        let fortaleza = 0;
        
        // Sin fortaleza
        if (password.length === 0) {
            return fortaleza;
        }
        
        // Longitud
        fortaleza += password.length * 4;
        
        // Minúsculas
        const lowercaseMatch = password.match(/[a-z]/g);
        if (lowercaseMatch) {
            fortaleza += (password.length - lowercaseMatch.length) * 2;
        }
        
        // Mayúsculas
        const uppercaseMatch = password.match(/[A-Z]/g);
        if (uppercaseMatch) {
            fortaleza += uppercaseMatch.length * 5;
        }
        
        // Números
        const numberMatch = password.match(/[0-9]/g);
        if (numberMatch) {
            fortaleza += numberMatch.length * 4;
        }
        
        // Símbolos
        const symbolMatch = password.match(/[^a-zA-Z0-9]/g);
        if (symbolMatch) {
            fortaleza += symbolMatch.length * 6;
        }
        
        // Bonus por mezcla
        if (lowercaseMatch && uppercaseMatch) {
            fortaleza += 10;
        }
        if ((lowercaseMatch || uppercaseMatch) && numberMatch) {
            fortaleza += 15;
        }
        if ((lowercaseMatch || uppercaseMatch || numberMatch) && symbolMatch) {
            fortaleza += 20;
        }
        
        // Limitar a 100
        return Math.min(100, fortaleza);
    }
    
    // Añadir efectos visuales cuando el formulario se envía con éxito
    function animarFormularioEnvio() {
        // Añadir transición al formulario
        formulario.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        // Animar los iconos de beneficios
        const iconCircles = document.querySelectorAll('.icon-circle');
        iconCircles.forEach((circle, index) => {
            setTimeout(() => {
                circle.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    circle.style.transform = 'scale(1)';
                }, 200);
            }, index * 100);
        });
    }
    
    // Añadir estilos CSS adicionales para animaciones
    function addAnimationStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                20%, 60% { transform: translateX(-5px); }
                40%, 80% { transform: translateX(5px); }
            }
            .shake {
                animation: shake 0.5s ease;
            }
            .icon-circle {
                transition: transform 0.2s ease;
            }
            #form-registro {
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
        `;
        document.head.appendChild(styleElement);
    }
    
    // Inicializar estilos de animación
    addAnimationStyles();
    
    // Agregar efecto de revelación al entrar a la página
    function agregarEfectoEntrada() {
        const formGroups = document.querySelectorAll('.form-group');
        formGroups.forEach((group, index) => {
            group.style.opacity = '0';
            group.style.transform = 'translateY(20px)';
            group.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            group.style.transitionDelay = `${index * 0.1}s`;
            
            setTimeout(() => {
                group.style.opacity = '1';
                group.style.transform = 'translateY(0)';
            }, 100);
        });
    }
    
    // Aplicar efecto de entrada
    agregarEfectoEntrada();
    
    // Función para registrar al usuario
    async function registrarUsuario(userData) {
        try {
            console.log('Enviando datos de registro:', userData);
            
            // Mostrar información de depuración
            mostrarDebug('Enviando datos de registro', userData);
            
            // Asegurarse de que los nombres de campo coincidan con lo esperado en el backend
            // El backend espera "nombre" pero el formulario envía "nombre-completo"
            const datosParaEnviar = {
                nombre: userData.nombre,
                email: userData.email,
                password: userData.password,
                telefono: userData.telefono || null
            };
            
            if (userData.fecha_nacimiento) {
                datosParaEnviar.fecha_nacimiento = userData.fecha_nacimiento;
            }
            
            if (userData.genero) {
                datosParaEnviar.genero = userData.genero;
            }
            
            console.log('Datos formateados para enviar:', datosParaEnviar);
            mostrarDebug('Datos formateados para enviar', datosParaEnviar);
            
            // Enviar datos al endpoint de la API
            mostrarDebug('Enviando solicitud a', '/api/auth/registro');
            const response = await fetch('/api/auth/registro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosParaEnviar)
            });
            
            const data = await response.json();
            console.log('Respuesta del servidor:', data);
            mostrarDebug('Respuesta del servidor', data);
            
            if (!response.ok) {
                mostrarDebug('Error en la respuesta', {
                    status: response.status,
                    statusText: response.statusText,
                    data: data
                });
                
                // Mostrar mensaje de error general en el formulario
                const errorGeneralElement = document.getElementById('error-general');
                if (errorGeneralElement) {
                    errorGeneralElement.textContent = data.mensaje || 'Error al registrar usuario';
                    errorGeneralElement.classList.add('visible');
                }
                
                throw new Error(data.mensaje || 'Error al registrar usuario');
            }
            
            // Almacenar datos básicos en localStorage para facilitar el login
            localStorage.setItem('ultimo_email_registro', userData.email);
            
            mostrarDebug('Registro exitoso', {
                mensaje: data.mensaje,
                userId: data.userId,
                email: data.email
            });
            
            return { success: true, mensaje: data.mensaje || 'Usuario registrado correctamente' };
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            mostrarDebug('Error en el proceso de registro', {
                message: error.message,
                stack: error.stack
            });
            return { success: false, mensaje: error.message };
        }
    }
    
    // Función para mostrar información de depuración
    function mostrarDebug(titulo, datos) {
        const debugContent = document.getElementById('debug-content');
        if (!debugContent) return;
        
        const seccion = document.createElement('div');
        seccion.style.marginBottom = '10px';
        seccion.style.borderBottom = '1px solid #ddd';
        seccion.style.paddingBottom = '10px';
        
        const tituloEl = document.createElement('h4');
        tituloEl.style.marginBottom = '5px';
        tituloEl.style.color = '#333';
        tituloEl.textContent = titulo;
        
        const contenido = document.createElement('pre');
        contenido.style.background = '#f0f0f0';
        contenido.style.padding = '5px';
        contenido.style.maxHeight = '150px';
        contenido.style.overflow = 'auto';
        contenido.style.fontSize = '12px';
        
        let textoContenido;
        try {
            if (typeof datos === 'object') {
                textoContenido = JSON.stringify(datos, null, 2);
            } else {
                textoContenido = String(datos);
            }
        } catch (e) {
            textoContenido = 'Error al convertir datos a texto: ' + e.message;
        }
        
        contenido.textContent = textoContenido;
        
        seccion.appendChild(tituloEl);
        seccion.appendChild(contenido);
        
        debugContent.appendChild(seccion);
    }
});