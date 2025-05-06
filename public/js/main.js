document.addEventListener('DOMContentLoaded', function() {
    // Menú móvil
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const overlay = document.querySelector('.overlay');
    const body = document.body;

    if (menuToggle && mainNav && overlay) {
        // Función para abrir/cerrar menú
        function toggleMenu() {
            mainNav.classList.toggle('active');
            overlay.classList.toggle('active');
            body.classList.toggle('menu-open');
            
            // Cambiar el icono del botón
            const icon = menuToggle.querySelector('i');
            if (icon) {
                if (mainNav.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        }

        // Event listener para el botón de menú
        menuToggle.addEventListener('click', toggleMenu);
        
        // Event listener para cerrar menú cuando se hace clic en el overlay
        overlay.addEventListener('click', toggleMenu);
        
        // Event listener para cerrar menú cuando se hace clic en un enlace
        const navLinks = mainNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (mainNav.classList.contains('active')) {
                    toggleMenu();
                }
            });
        });
        
        // Cerrar menú al redimensionar la ventana a desktop
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && mainNav.classList.contains('active')) {
                toggleMenu();
            }
        });
    }

    // Newsletter
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input[type="email"]').value;
            // Aquí iría la lógica para enviar el email al servidor
            alert('¡Gracias por suscribirte! Te mantendremos informado de nuestras novedades.');
            newsletterForm.reset();
        });
    }

    // Actualizar contador del carrito
    function actualizarContadorCarrito() {
        const contador = document.querySelector('#cart-count');
        if (contador) {
            // Aquí obtendrías el número real de items del carrito
            const itemsEnCarrito = localStorage.getItem('cartItems') ? 
                JSON.parse(localStorage.getItem('cartItems')).length : 0;
            contador.textContent = itemsEnCarrito > 0 ? itemsEnCarrito : '0';
        }
    }

    // Llamar a la función al cargar la página
    actualizarContadorCarrito();
});

// Funciones para el manejo del sitio

// Función para eliminar barras externas no deseadas
function eliminarBarrasExternas() {
    console.log("Ejecutando eliminación de barras no deseadas");
    
    // MÉTODO 1: Eliminación directa con querySelector
    // Específicamente eliminar elementos con "Tu Carrito"
    document.querySelectorAll('body > *').forEach(el => {
        try {
            if (el && el.textContent && 
                (el.textContent.includes('Tu Carrito') || el.textContent.includes('tu carrito'))) {
                
                // Excluir nuestros propios elementos legítimos
                if (el.id !== 'cart-modal' && 
                    !el.classList.contains('main-header') && 
                    !el.classList.contains('cart-items')) {
                    
                    console.log('ELIMINANDO BARRA DE CARRITO:', el);
                    el.parentNode.removeChild(el);
                }
            }
            
            // Eliminar la X
            if (el && el.textContent && 
                (el.textContent.trim() === '×' || el.textContent.trim() === 'x')) {
                console.log('ELIMINANDO X:', el);
                el.parentNode.removeChild(el);
            }
        } catch (e) {
            console.error("Error al procesar elemento:", e);
        }
    });
    
    // MÉTODO 2: Ocultamiento con estilos
    // Agregar estilos para ocultar elementos no deseados
    if (!document.getElementById('carrito-blocker-style')) {
        const style = document.createElement('style');
        style.id = 'carrito-blocker-style';
        style.innerHTML = `
            body > div:not(.overlay):not(.main-header):not(#cart-modal):not(.modal):not(.categories):not(.cart-grid) {
                display: none !important;
                visibility: hidden !important;
            }
            body > span:first-child {
                display: none !important;
            }
            body > main, body > footer, body > header, .modal, .cart-grid, #cart-modal {
                display: block !important;
                visibility: visible !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // MÉTODO 3: Eliminar elementos específicos por configuración
    const selectores = [
        // Elementos con estilos inline específicos
        'div[style*="position:fixed"][style*="top:0"]',
        'div[style*="position: fixed"][style*="top: 0"]',
        'div[style*="background-color:blue"]',
        'div[style*="background:blue"]',
        // Elementos relacionados con carritos externos
        'div[class*="carrito"]:not(.carrito-container):not(.cart-items)',
        'div[id*="carrito"]:not(#cart-container)',
        'div[class*="cart"]:not(.cart-count):not(.cart-link):not(.cart-items):not(.cart-grid)',
        'div[id*="cart"]:not(#cart-modal)',
        // Específico para la X y Tu Carrito
        'body > div:first-child:not(.main-header):not(.modal):not(.overlay)',
        'body > span:first-child'
    ];

    // Procesar todos los selectores
    selectores.forEach(selector => {
        try {
            document.querySelectorAll(selector).forEach(elemento => {
                // Verificar si es un elemento legítimo de nuestra aplicación
                if (elemento.id === 'cart-modal' || 
                    elemento.classList.contains('main-header') ||
                    elemento.classList.contains('overlay') ||
                    elemento.closest('#cart-modal')) {
                    return; // No eliminar elementos legítimos
                }
                
                // Verificar si tiene texto "Tu Carrito" o es solo una X
                if (elemento.textContent && 
                    (elemento.textContent.includes('Tu Carrito') || 
                     elemento.textContent.includes('tu carrito') ||
                     elemento.textContent.trim() === '×' || 
                     elemento.textContent.trim() === 'x')) {
                    
                    console.log('BARRA DE CARRITO ELIMINADA POR SELECTOR:', selector);
                    elemento.parentNode.removeChild(elemento);
                }
                
                // Verificar por características visuales (barra azul)
                const estilos = window.getComputedStyle(elemento);
                if (estilos.position === 'fixed' && 
                    parseInt(estilos.top) < 50 && 
                    estilos.zIndex > 1000) {
                    
                    console.log('BARRA FLOTANTE ELIMINADA:', elemento);
                    elemento.parentNode.removeChild(elemento);
                }
            });
        } catch (e) {
            console.error("Error al procesar selector:", selector, e);
        }
    });
    
    // Verificar recursivamente elementos sospechosos
    try {
        const limpiarRecursivamente = (elemento) => {
            if (!elemento) return;
            
            // Verificar si el elemento tiene texto Tu Carrito o X
            if (elemento.textContent && 
                (elemento.textContent.includes('Tu Carrito') || 
                 elemento.textContent.trim() === '×')) {
                
                if (elemento.id !== 'cart-modal' && 
                    !elemento.classList.contains('cart-items') &&
                    elemento !== document.body) {
                    
                    console.log('ELIMINANDO ELEMENTO RECURSIVO:', elemento);
                    if (elemento.parentNode) {
                        elemento.parentNode.removeChild(elemento);
                    }
                    return;
                }
            }
            
            // Procesar hijos
            if (elemento.children && elemento.children.length > 0) {
                Array.from(elemento.children).forEach(hijo => {
                    limpiarRecursivamente(hijo);
                });
            }
        };
        
        // Aplicar limpieza recursiva desde el body
        limpiarRecursivamente(document.body);
    } catch (e) {
        console.error("Error en limpieza recursiva:", e);
    }
}

// Inicializar menú móvil
function inicializarMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }
}

// Función para inicializar todo el sitio
function inicializarSitio() {
    // Eliminar barras externas
    eliminarBarrasExternas();
    
    // Inicializar el menú móvil
    inicializarMenu();
    
    // Otras inicializaciones que se necesiten
}

// Ejecutar la función de inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarSitio);

// Ejecutar también cuando la ventana esté completamente cargada
window.addEventListener('load', eliminarBarrasExternas);

// Y para mayor seguridad, volver a ejecutar después de un breve retraso
setTimeout(eliminarBarrasExternas, 1000); 