/**
 * inventario-api.js
 * 
 * Esta clase maneja la comunicación con el inventario de productos,
 * implementando una capa de fallback que utiliza tanto los datos del API
 * como los datos estáticos de los archivos JS cuando el API no está disponible.
 */

class InventarioAPI {
    /**
     * Inicializa la API de inventario
     */
    constructor() {
        this.baseUrl = '/api';
        this.productosCargados = false;
    }

    /**
     * Obtiene el inventario para un producto específico
     * @param {number|string} productoId - ID del producto
     * @returns {Promise<Object>} - Objeto con el inventario formateado por color/talla
     */
    async obtenerInventario(productoId) {
        try {
            console.log(`Intentando obtener inventario para producto ID: ${productoId}`);
            
            // Intentar obtener inventario desde el API
            const response = await fetch(`${this.baseUrl}/productos/${productoId}/inventario`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            // Verificar si la respuesta es JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json') && response.ok) {
                const data = await response.json();
                console.log('Inventario obtenido del API:', data);
                return data.inventario;
            } else {
                console.warn('La respuesta no es JSON válido o status no es 200');
                return this._obtenerInventarioLocal(productoId);
            }
        } catch (error) {
            console.error('Error al obtener inventario desde API:', error);
            // Fallback a inventario local
            return this._obtenerInventarioLocal(productoId);
        }
    }
    
    /**
     * Obtiene el inventario de las estructuras de datos JavaScript locales
     * @private
     * @param {number|string} productoId - ID del producto
     * @returns {Object} - Objeto con el inventario formateado por color/talla
     */
    _obtenerInventarioLocal(productoId) {
        console.log('Obteniendo inventario local de producto ID:', productoId);
        
        // Esperar a que las colecciones de productos estén disponibles
        const waitForProducts = () => {
            return new Promise((resolve) => {
                const checkProducts = () => {
                    if (
                        typeof productosHombres !== 'undefined' &&
                        typeof productosMujeres !== 'undefined' &&
                        typeof productosNinos !== 'undefined'
                    ) {
                        resolve(true);
                    } else {
                        setTimeout(checkProducts, 100);
                    }
                };
                checkProducts();
            });
        };
        
        return waitForProducts().then(() => {
            // Convertir ID a los formatos posibles para comparación
            const idNumerico = parseInt(productoId);
            const idString = String(productoId);
            
            // Buscar en todas las categorías
            let producto = null;
            
            // Buscar en hombres
            producto = productosHombres.find(p => String(p.id) === idString || p.id === idNumerico);
            if (producto && producto.inventario) {
                console.log('Inventario encontrado en productos hombres:', producto.inventario);
                return producto.inventario;
            }
            
            // Buscar en mujeres
            producto = productosMujeres.find(p => String(p.id) === idString || p.id === idNumerico);
            if (producto && producto.inventario) {
                console.log('Inventario encontrado en productos mujeres:', producto.inventario);
                return producto.inventario;
            }
            
            // Buscar en niños
            producto = productosNinos.find(p => String(p.id) === idString || p.id === idNumerico);
            if (producto && producto.inventario) {
                console.log('Inventario encontrado en productos niños:', producto.inventario);
                return producto.inventario;
            }
            
            console.warn('No se encontró inventario local para producto ID:', productoId);
            return {}; // Retornar objeto vacío si no se encuentra
        });
    }
}

// Exportar una instancia global
window.InventarioAPI = new InventarioAPI(); 