document.addEventListener('DOMContentLoaded', function() {
    console.log("======= DIAGNÓSTICO DETALLADO DE DETALLE-PRODUCTO =======");
    
    // Elementos del DOM
    const loadingContainer = document.getElementById('loading-container');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const detalleProducto = document.getElementById('detalle-producto');
    const productoImagen = document.getElementById('producto-imagen');
    const productoNombre = document.getElementById('producto-nombre');
    const productoPrecio = document.getElementById('producto-precio');
    const productoDescripcion = document.getElementById('producto-descripcion');
    const selectTalla = document.getElementById('talla');
    const selectColor = document.getElementById('color');
    const btnAgregarCarrito = document.getElementById('btn-agregar-carrito');
    const categoriaLink = document.getElementById('categoria-link');
    const productoBreadcrumb = document.getElementById('producto-breadcrumb');
    
    // Verificar elementos críticos
    console.log("1. Verificando elementos DOM críticos:");
    console.log("- detalleProducto:", detalleProducto ? "OK" : "NO ENCONTRADO");
    console.log("- productoImagen:", productoImagen ? "OK" : "NO ENCONTRADO");
    console.log("- productoNombre:", productoNombre ? "OK" : "NO ENCONTRADO");
    console.log("- productoPrecio:", productoPrecio ? "OK" : "NO ENCONTRADO");
    console.log("- selectTalla:", selectTalla ? "OK" : "NO ENCONTRADO");
    console.log("- selectColor:", selectColor ? "OK" : "NO ENCONTRADO");
    
    if (!detalleProducto || !productoImagen || !productoNombre || !productoPrecio) {
        console.error("ERROR CRÍTICO: Elementos DOM no encontrados");
        document.body.innerHTML += '<div style="color: red; padding: 20px; background: #ffeeee; position: fixed; top: 0; left: 0; right: 0; z-index: 9999;">ERROR: Elementos críticos del DOM no encontrados</div>';
        return;
    }
    
    // Obtener el ID del producto de la URL
    const params = new URLSearchParams(window.location.search);
    const productoId = params.get('id');
    console.log("2. Parámetros URL:");
    console.log("- URL completa:", window.location.href);
    console.log("- Parámetros:", window.location.search);
    console.log("- ID del producto:", productoId);
    
    // Actualizar el elemento de diagnóstico
    const productoIdDisplay = document.getElementById('producto-id-diagnostico');
    if (productoIdDisplay) {
        productoIdDisplay.textContent = productoId || 'No especificado';
    }
    
    if (!productoId) {
        mostrarError('No se ha especificado ningún producto en la URL.');
        document.body.innerHTML += '<div style="color: red; padding: 20px; background: #ffeeee; position: fixed; top: 0; left: 0; right: 0; z-index: 9999;">ERROR: No se especificó ID de producto en la URL</div>';
        return;
    }

    // Asegurarse de que los arrays de productos estén cargados
    function verificarArraysProductos() {
        console.log("3. Verificando disponibilidad de arrays de productos:");
        let arraysDisponibles = true;
        
        if (typeof productosHombres === 'undefined') {
            console.error("ERROR: Array productosHombres no disponible");
            arraysDisponibles = false;
        } else {
            console.log("- productosHombres: OK, " + productosHombres.length + " productos");
        }
        
        if (typeof productosMujeres === 'undefined') {
            console.error("ERROR: Array productosMujeres no disponible");
            arraysDisponibles = false;
        } else {
            console.log("- productosMujeres: OK, " + productosMujeres.length + " productos");
        }
        
        if (typeof productosNinos === 'undefined') {
            console.error("ERROR: Array productosNinos no disponible");
            arraysDisponibles = false;
        } else {
            console.log("- productosNinos: OK, " + productosNinos.length + " productos");
        }
        
        if (!arraysDisponibles) {
            document.body.innerHTML += '<div style="color: red; padding: 20px; background: #ffeeee; position: fixed; top: 0; left: 0; right: 0; z-index: 9999;">ERROR: Los arrays de productos no están disponibles. Reintentando...</div>';
        }
        
        return arraysDisponibles;
    }
    
    // Buscar producto en las diferentes categorías
    function buscarProducto() {
        console.log("4. Iniciando búsqueda de producto...");
        // Verificar que los arrays estén disponibles
        if (!verificarArraysProductos()) {
            console.log("Reintentando búsqueda en 1.5 segundos...");
            setTimeout(buscarProducto, 1500); // Aumentamos el tiempo para dar más margen
            return;
        }
        
        let producto = null;
        let categoria = '';
        
        // Convertir a número para comparación numérica
        const idNumerico = parseInt(productoId);
        // Mantener como string para comparación de strings
        const idString = String(productoId);
        
        console.log("Buscando producto. ID numérico:", idNumerico, "ID string:", idString);
        
        // Imprimir todos los productos disponibles para diagnóstico
        console.log("DIAGNÓSTICO - Todos los productos disponibles:");
        if (productosHombres) {
            console.log("Productos Hombres:");
            productosHombres.forEach(p => console.log(`ID: ${p.id} (${typeof p.id}) - Nombre: ${p.nombre}`));
        }
        if (productosMujeres) {
            console.log("Productos Mujeres:");
            productosMujeres.forEach(p => console.log(`ID: ${p.id} (${typeof p.id}) - Nombre: ${p.nombre}`));
        }
        if (productosNinos) {
            console.log("Productos Niños:");
            productosNinos.forEach(p => console.log(`ID: ${p.id} (${typeof p.id}) - Nombre: ${p.nombre}`));
        }
        
        // Primero buscar en productosHombres
        console.log("5. Buscando en productosHombres...");
        if (typeof productosHombres !== 'undefined' && productosHombres.length > 0) {
            for (let i = 0; i < productosHombres.length; i++) {
                // Dump para diagnóstico
                console.log(`Comparando: producto_id=${productosHombres[i].id} (${typeof productosHombres[i].id}) con ${idString} (string) y ${idNumerico} (number)`);
                
                if (String(productosHombres[i].id) === idString || 
                    productosHombres[i].id === idNumerico) {
                    producto = productosHombres[i];
                    categoria = 'hombres';
                    console.log("✓ Producto encontrado en hombres:", producto);
                    break;
                }
            }
        }
        
        // Luego en productosMujeres si no se encontró
        console.log("6. Buscando en productosMujeres...");
        if (!producto && typeof productosMujeres !== 'undefined' && productosMujeres.length > 0) {
            for (let i = 0; i < productosMujeres.length; i++) {
                // Dump para diagnóstico
                console.log(`Comparando: producto_id=${productosMujeres[i].id} (${typeof productosMujeres[i].id}) con ${idString} (string) y ${idNumerico} (number)`);
                
                if (String(productosMujeres[i].id) === idString || 
                    productosMujeres[i].id === idNumerico) {
                    producto = productosMujeres[i];
                    categoria = 'mujeres';
                    console.log("✓ Producto encontrado en mujeres:", producto);
                    break;
                }
            }
        }
        
        // Finalmente en productosNinos
        console.log("7. Buscando en productosNinos...");
        if (!producto && typeof productosNinos !== 'undefined' && productosNinos.length > 0) {
            for (let i = 0; i < productosNinos.length; i++) {
                // Dump para diagnóstico
                console.log(`Comparando: producto_id=${productosNinos[i].id} (${typeof productosNinos[i].id}) con ${idString} (string) y ${idNumerico} (number)`);
                
                if (String(productosNinos[i].id) === idString || 
                    productosNinos[i].id === idNumerico) {
                    producto = productosNinos[i];
                    categoria = 'ninos';
                    console.log("✓ Producto encontrado en niños:", producto);
                    break;
                }
            }
        }
        
        // Si aún no se encontró, crear un producto de prueba (solo para depuración)
        if (!producto) {
            console.warn("No se encontró producto real, creando producto de prueba para depuración");
            producto = {
                id: idNumerico,
                nombre: "Producto de prueba " + idNumerico,
                precio: 99900,
                descripcion: "Este es un producto de prueba para ayudar en la depuración.",
                imagen: "/imagenes/productos/placeholder.jpg",
                tallas: ["36", "37", "38", "39", "40"],
                colores: ["Negro", "Blanco", "Rojo"]
            };
            categoria = 'prueba';
        }
        
        // Mostrar producto o error
        if (producto) {
            console.log("8. ÉXITO: Producto encontrado:", producto);
            
            // Verificar la existencia de la imagen y normalizarla
            if (producto.imagen) {
                // Normalizar la ruta de la imagen
                if (!producto.imagen.startsWith('/')) {
                    producto.imagen = '/' + producto.imagen;
                }
                
                // Agregar una marca temporal para evitar caché
                producto.imagen = producto.imagen + '?v=' + new Date().getTime();
                
                console.log("Imagen del producto (después de normalizar):", producto.imagen);
            } else {
                console.warn("Producto sin imagen, usando imagen de respaldo");
                producto.imagen = "/imagenes/productos/placeholder.jpg";
            }
            
            mostrarProducto(producto, categoria);
        } else {
            console.error("✗ ERROR: No se encontró el producto con ID:", productoId);
            mostrarError('No se pudo encontrar el producto especificado (ID: ' + productoId + ')');
            document.body.innerHTML += `<div style="color: red; padding: 20px; background: #ffeeee; position: fixed; top: 0; left: 0; right: 0; z-index: 9999;">
                ERROR: No se encontró producto con ID: ${productoId}<br>
                <button onclick="window.location.href='/'">Volver al inicio</button>
            </div>`;
        }
    }
    
    // Mostrar el producto en la página
    function mostrarProducto(producto, categoria) {
        try {
            console.log("9. Mostrando producto:", producto);
            
            // Actualizar información de diagnóstico
            const estadoProducto = document.getElementById('estado-producto');
            if (estadoProducto) {
                estadoProducto.textContent = 'Producto encontrado, cargando detalles...';
                estadoProducto.style.color = '#007bff';
            }
            
            // Ocultar el contenedor de carga
            if (loadingContainer) {
                loadingContainer.style.display = 'none';
                console.log("Contenedor de carga ocultado");
            }
            
            // Forzar visibilidad del contenedor de detalle
            document.querySelectorAll('.detalle-producto').forEach(el => {
                el.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important;';
            });
            
            // Asegurar que detalleProducto sea visible
            if (detalleProducto) {
                // Restablecer cualquier estilo display que pueda estar causando problemas
                detalleProducto.style.visibility = 'visible';
                detalleProducto.style.opacity = '1';
                detalleProducto.style.display = 'flex';
                console.log("Contenedor de detalle de producto establecido como visible");
            } else {
                console.error("ERROR: detalleProducto es null");
                return;
            }
            
            // Actualizar información básica
            if (producto.imagen) {
                console.log("Cargando imagen:", producto.imagen);
                
                // Asegurar que la imagen tenga ruta absoluta
                let rutaImagen = producto.imagen;
                if (!rutaImagen.startsWith('/')) {
                    rutaImagen = '/' + rutaImagen;
                    console.log("Ruta normalizada:", rutaImagen);
                }
                
                const imagenStatus = document.getElementById('imagen-status');
                if (imagenStatus) {
                    imagenStatus.textContent = 'Cargando imagen...';
                    imagenStatus.style.color = '#007bff';
                }
                
                // Establecer tamaño predeterminado para la imagen
                productoImagen.style.minHeight = '300px';
                productoImagen.style.minWidth = '300px';
                productoImagen.style.backgroundColor = '#f4f4f4';
                
                // Asignar la imagen
                productoImagen.src = rutaImagen;
                console.log("Imagen asignada:", productoImagen.src);
            } else {
                console.warn("Producto sin imagen, usando imagen de respaldo");
                productoImagen.src = "/imagenes/productos/placeholder.jpg";
                
                const imagenStatus = document.getElementById('imagen-status');
                if (imagenStatus) {
                    imagenStatus.textContent = 'Imagen no disponible, usando respaldo';
                    imagenStatus.style.color = '#ff9800';
                }
            }
            
            productoImagen.alt = producto.nombre;
            productoNombre.textContent = producto.nombre;
            productoPrecio.textContent = producto.precio.toLocaleString('es-CO');
            productoDescripcion.textContent = producto.descripcion || '';
            
            // Mejorar manejo de errores de carga de imágenes
            productoImagen.onerror = function() {
                console.error("Error al cargar la imagen:", productoImagen.src);
                // Si la imagen no carga, usar el logo como respaldo
                productoImagen.src = "/imagenes/productos/placeholder.jpg";
                
                // Actualizar estado de la imagen
                const imagenStatus = document.getElementById('imagen-status');
                if (imagenStatus) {
                    imagenStatus.textContent = 'Error al cargar la imagen, usando imagen de respaldo';
                    imagenStatus.style.color = 'red';
                }
                
                // Actualizar estado general
                if (estadoProducto) {
                    estadoProducto.textContent = 'Producto cargado pero con errores en la imagen';
                    estadoProducto.style.color = '#ff9800';
                }
                
                // Notificar el error en la página
                const errorMsg = document.createElement('div');
                errorMsg.style.color = 'red';
                errorMsg.style.marginTop = '10px';
                errorMsg.textContent = 'Error al cargar la imagen. Usando imagen de respaldo.';
                productoImagen.parentNode.appendChild(errorMsg);
            };
            
            // Mostrar un mensaje cuando la imagen carga correctamente
            productoImagen.onload = function() {
                console.log("La imagen se cargó correctamente:", productoImagen.src);
                
                // Actualizar estado de la imagen
                const imagenStatus = document.getElementById('imagen-status');
                if (imagenStatus) {
                    imagenStatus.textContent = 'Imagen cargada correctamente';
                    imagenStatus.style.color = 'green';
                }
                
                // Actualizar estado general
                if (estadoProducto) {
                    estadoProducto.textContent = 'Producto cargado correctamente';
                    estadoProducto.style.color = 'green';
                }
            };
            
            // Limpiar y llenar opciones de talla
            selectTalla.innerHTML = '<option value="">Seleccionar talla</option>';
            if (producto.tallas && producto.tallas.length) {
                producto.tallas.forEach(talla => {
                    const option = document.createElement('option');
                    option.value = talla;
                    option.textContent = talla;
                    selectTalla.appendChild(option);
                });
            }
            
            // Limpiar y llenar opciones de color
            selectColor.innerHTML = '<option value="">Seleccionar color</option>';
            if (producto.colores && producto.colores.length) {
                producto.colores.forEach(color => {
                    const option = document.createElement('option');
                    option.value = color;
                    option.textContent = color;
                    selectColor.appendChild(option);
                });
            }
            
            // Actualizar breadcrumb
            let categoriaTexto = '';
            let categoriaURL = '';
            
            switch(categoria) {
                case 'hombres':
                    categoriaTexto = 'Hombres';
                    categoriaURL = '/hombres.html';
                    break;
                case 'mujeres':
                    categoriaTexto = 'Mujeres';
                    categoriaURL = '/mujeres.html';
                    break;
                case 'ninos':
                    categoriaTexto = 'Niños';
                    categoriaURL = '/ninos.html';
                    break;
                default:
                    categoriaTexto = 'Productos';
                    categoriaURL = '/';
            }
            
            categoriaLink.textContent = categoriaTexto;
            categoriaLink.href = categoriaURL;
            productoBreadcrumb.textContent = producto.nombre;
            
            // Configurar evento para agregar al carrito
            btnAgregarCarrito.onclick = function() {
                const talla = selectTalla.value;
                const color = selectColor.value;
                const cantidad = parseInt(document.getElementById('cantidad')?.value || '1');
                
                if (!talla || !color) {
                    alert('Por favor selecciona talla y color');
                    return;
                }
                
                // Verificar si el carrito está disponible
                if (typeof Carrito !== 'undefined') {
                    // Intentar agregar al carrito
                    try {
                        console.log("Agregando al carrito:", producto.nombre);
                        Carrito.agregarItem({
                            id: producto.id,
                            nombre: producto.nombre,
                            precio: producto.precio,
                            imagen: producto.imagen,
                            talla: talla,
                            color: color,
                            cantidad: cantidad
                        });
                        
                        // Mostrar notificación de éxito
                        const notificacion = document.createElement('div');
                        notificacion.className = 'notificacion';
                        notificacion.textContent = `${producto.nombre} añadido al carrito`;
                        document.body.appendChild(notificacion);
                        
                        setTimeout(() => {
                            notificacion.classList.add('fadeout');
                            setTimeout(() => notificacion.remove(), 500);
                        }, 2500);
                    } catch (error) {
                        console.error("Error al agregar al carrito:", error);
                        alert('Ocurrió un error al agregar el producto al carrito. Por favor intenta nuevamente.');
                    }
                } else {
                    console.error('El objeto Carrito no está definido');
                    alert('Error: No se pudo agregar al carrito porque el módulo del carrito no está disponible.');
                }
            };
            
            console.log("✓ Producto mostrado correctamente");
            
        } catch (error) {
            console.error("Error al mostrar el producto:", error);
            mostrarError('Ocurrió un error al mostrar el producto: ' + error.message);
            
            // Actualizar estado general
            const estadoProducto = document.getElementById('estado-producto');
            if (estadoProducto) {
                estadoProducto.textContent = 'Error al mostrar el producto: ' + error.message;
                estadoProducto.style.color = 'red';
            }
            
            document.body.innerHTML += '<div style="color: red; padding: 20px; background: #ffeeee; position: fixed; top: 0; left: 0; right: 0; z-index: 9999;">ERROR: ' + error.message + '</div>';
        }
    }
    
    // Función para mostrar mensajes de error
    function mostrarError(mensaje) {
        console.error("ERROR:", mensaje);
        if (loadingContainer) loadingContainer.style.display = 'none';
        if (detalleProducto) detalleProducto.style.display = 'none';
        if (errorMessage) errorMessage.textContent = mensaje;
        if (errorContainer) errorContainer.style.display = 'flex';
    }
    
    // Iniciar búsqueda del producto con un pequeño retraso para asegurar que los scripts se hayan cargado
    console.log("Iniciando búsqueda con retraso...");
    setTimeout(buscarProducto, 1200);  // Aumentamos el retraso para asegurar que todos los scripts se cargaron
    
    // Configurar eventos para los controles de cantidad
    const btnDisminuir = document.getElementById('disminuir-cantidad');
    const btnAumentar = document.getElementById('aumentar-cantidad');
    const inputCantidad = document.getElementById('cantidad');
    
    if (btnDisminuir && btnAumentar && inputCantidad) {
        btnDisminuir.addEventListener('click', function() {
            let valor = parseInt(inputCantidad.value) - 1;
            if (valor < 1) valor = 1;
            inputCantidad.value = valor;
        });
        
        btnAumentar.addEventListener('click', function() {
            let valor = parseInt(inputCantidad.value) + 1;
            if (valor > 10) valor = 10; // Limitar a 10 unidades
            inputCantidad.value = valor;
        });
    }
}); 