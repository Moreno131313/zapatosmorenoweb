// Función para manejar el menú móvil
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando menú móvil...');
    
    // Buscar o crear el botón de menú móvil
    let menuBtn = document.querySelector('.mobile-menu-btn');
    
    if (!menuBtn) {
        console.log('Creando botón de menú móvil...');
        // Si no existe, lo creamos e insertamos
        const headerContainer = document.querySelector('.header-container');
        if (headerContainer) {
            menuBtn = document.createElement('button');
            menuBtn.className = 'mobile-menu-btn';
            menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            menuBtn.setAttribute('aria-label', 'Abrir menú');
            
            // Insertar al inicio del header container
            headerContainer.prepend(menuBtn);
            console.log('Botón de menú móvil creado e insertado.');
        } else {
            console.log('No se encontró el contenedor del header.');
        }
    } else {
        console.log('Botón de menú móvil ya existe.');
    }
    
    // Si tenemos el botón, añadimos el evento click
    if (menuBtn) {
        console.log('Configurando eventos para el botón de menú móvil...');
        menuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const navLinks = document.querySelector('.nav-links');
            if (navLinks) {
                navLinks.classList.toggle('active');
                console.log('Estado del menú:', navLinks.classList.contains('active') ? 'abierto' : 'cerrado');
                
                // Cambiar el ícono según el estado
                const icon = this.querySelector('i');
                if (icon) {
                    if (navLinks.classList.contains('active')) {
                        icon.className = 'fas fa-times';
                        this.setAttribute('aria-label', 'Cerrar menú');
                    } else {
                        icon.className = 'fas fa-bars';
                        this.setAttribute('aria-label', 'Abrir menú');
                    }
                }
                
                // Mostrar/ocultar overlay
                toggleOverlay();
            } else {
                console.log('No se encontró el menú de navegación.');
            }
        });
    }
    
    // Cerrar el menú al hacer click en un enlace
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const mobileNav = document.querySelector('.nav-links.active');
            if (mobileNav) {
                mobileNav.classList.remove('active');
                console.log('Menú cerrado al hacer click en enlace');
                
                // Actualizar el ícono del botón
                const menuBtn = document.querySelector('.mobile-menu-btn');
                if (menuBtn) {
                    const icon = menuBtn.querySelector('i');
                    if (icon) {
                        icon.className = 'fas fa-bars';
                        menuBtn.setAttribute('aria-label', 'Abrir menú');
                    }
                }
                
                // Ocultar overlay
                toggleOverlay();
            }
        });
    });
    
    // Cerrar el menú al hacer click fuera de él
    document.addEventListener('click', function(event) {
        const navLinks = document.querySelector('.nav-links.active');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        
        if (navLinks && menuBtn && !navLinks.contains(event.target) && !menuBtn.contains(event.target)) {
            navLinks.classList.remove('active');
            
            // Actualizar el ícono del botón
            const icon = menuBtn.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-bars';
                menuBtn.setAttribute('aria-label', 'Abrir menú');
            }
        }
    });
    
    // Añadir overlay para dispositivos móviles
    let overlay = document.querySelector('.mobile-menu-overlay');
    if (!overlay) {
        const body = document.body;
        overlay = document.createElement('div');
        overlay.className = 'mobile-menu-overlay';
        overlay.style.display = 'none';
        body.appendChild(overlay);
        console.log('Overlay para menú móvil creado');
    }
    
    // Mostrar/ocultar overlay con el menú
    function toggleOverlay() {
        const navLinks = document.querySelector('.nav-links');
        if (navLinks && navLinks.classList.contains('active')) {
            overlay.style.display = 'block';
        } else {
            overlay.style.display = 'none';
        }
    }
    
    // Cerrar menú al hacer click en el overlay
    overlay.addEventListener('click', function() {
        const navLinks = document.querySelector('.nav-links.active');
        if (navLinks) {
            navLinks.classList.remove('active');
            this.style.display = 'none';
            console.log('Menú cerrado al hacer click en overlay');
            
            // Actualizar el ícono del botón
            const menuBtn = document.querySelector('.mobile-menu-btn');
            if (menuBtn) {
                const icon = menuBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-bars';
                    menuBtn.setAttribute('aria-label', 'Abrir menú');
                }
            }
        }
    });
    
    console.log('Inicialización del menú móvil completada');
}); 