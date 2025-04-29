/**
 * Funcionalidad del menú móvil
 * Maneja la apertura y cierre del menú móvil y los eventos relacionados
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.overlay');
    const body = document.body;
    
    // Contador del carrito móvil
    const mobileCartCount = document.getElementById('mobile-cart-count');
    const cartCount = document.getElementById('cart-count');
    
    // Actualizar contador del carrito móvil
    function sincronizarContadorCarrito() {
        if (mobileCartCount && cartCount) {
            mobileCartCount.textContent = cartCount.textContent;
        }
    }
    
    // Observador para mantener sincronizado el contador del carrito
    if (cartCount) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'characterData' || mutation.type === 'childList') {
                    sincronizarContadorCarrito();
                }
            });
        });
        
        observer.observe(cartCount, {
            characterData: true,
            childList: true,
            subtree: true
        });
    }
    
    // Función para abrir el menú
    function abrirMenu() {
        mobileMenu.classList.add('active');
        overlay.classList.add('active');
        body.classList.add('menu-open');
        sincronizarContadorCarrito();
    }
    
    // Función para cerrar el menú
    function cerrarMenu() {
        mobileMenu.classList.remove('active');
        overlay.classList.remove('active');
        body.classList.remove('menu-open');
    }
    
    // Evento para abrir/cerrar el menú al hacer clic en el botón
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            if (mobileMenu.classList.contains('active')) {
                cerrarMenu();
            } else {
                abrirMenu();
            }
        });
    }
    
    // Cerrar menú al hacer clic en el overlay
    if (overlay) {
        overlay.addEventListener('click', cerrarMenu);
    }
    
    // Cerrar menú al hacer clic en los enlaces
    const mobileMenuLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
    mobileMenuLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            cerrarMenu();
        });
    });
    
    // Cerrar menú al redimensionar la ventana a desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && mobileMenu.classList.contains('active')) {
            cerrarMenu();
        }
    });
    
    // Inicializar sincronización del contador
    sincronizarContadorCarrito();
}); 