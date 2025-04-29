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
    // Buscar y eliminar elementos que coincidan con estas características
    const selectores = [
        // Elementos con estilos inline específicos
        'div[style*="position:fixed"][style*="top:0"]',
        'div[style*="position: fixed"][style*="top: 0"]',
        'div[style*="background-color:blue"]',
        'div[style*="background:blue"]',
        // Elementos relacionados con carritos externos
        'div[class*="carrito"]:not(.carrito-container):not(.carrito-item):not(.carrito-info):not(.carrito-cantidad):not(.carrito-total):not(#lista-productos-carrito)',
        'div[id*="carrito"]:not(#cart-container):not(#lista-productos-carrito)',
        'div[class*="cart"]:not(.cart-count):not(.cart-link):not(.cart-items):not(.cart-container):not(.cart-item):not(.cart-item-details):not(.cart-summary):not(.cart-actions):not(.cart-empty)',
        'div[id*="cart"]:not(#cart-modal):not(#cart-container):not(#lista-productos-carrito)',
        // Primer div hijo del body que no sea parte de nuestra estructura
        'body > div:first-child:not(.main-header):not(.modal):not(.container):not(.overlay)'
    ];

    // Obtener todos los elementos que coincidan con los selectores
    selectores.forEach(selector => {
        const elementos = document.querySelectorAll(selector);
        elementos.forEach(elemento => {
            // No eliminar nuestro contenedor de carrito
            if (elemento.id === 'lista-productos-carrito' || 
                elemento.classList.contains('cart-items') ||
                elemento.closest('#lista-productos-carrito')) {
                console.log('Elemento protegido, no se eliminará:', elemento);
                return;
            }
            
            // Verificar si es una barra azul o similar (por color o posición)
            const estilos = window.getComputedStyle(elemento);
            const esBarraNoDeseada = 
                (estilos.backgroundColor.includes('blue') || 
                 estilos.backgroundColor.includes('rgb(0, 0, 255)') ||
                 estilos.backgroundColor.includes('rgb(0, 0, 205)') ||
                 estilos.backgroundColor.includes('rgb(30, 144, 255)')) &&
                estilos.position === 'fixed' && 
                parseInt(estilos.top) < 20;

            if (esBarraNoDeseada || elemento.textContent.includes('Tu Carrito') || elemento.textContent.includes('tu carrito')) {
                console.log('Elemento eliminado:', elemento);
                elemento.remove();
            }
        });
    });

    // Comprobar si hay iframes externos y ocultarlos
    document.querySelectorAll('iframe').forEach(iframe => {
        if (!iframe.src.includes(window.location.hostname)) {
            iframe.style.display = 'none';
        }
    });
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