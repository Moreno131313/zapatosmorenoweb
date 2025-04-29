// Variables globales
let productos = [];
let productoEditando = null;

// Elementos del DOM
const modal = document.querySelector('.modal');
const form = document.getElementById('producto-form');
const tablaProductos = document.getElementById('productos-tabla');
const filtroCategoria = document.getElementById('filtro-categoria');
const filtroTipo = document.getElementById('filtro-tipo');
const filtroDisponibilidad = document.getElementById('filtro-disponibilidad');
const busquedaInput = document.getElementById('busqueda');
const imagenPreview = document.getElementById('imagen-preview');

// Event Listeners
document.addEventListener('DOMContentLoaded', inicializarPagina);
document.querySelector('.close').addEventListener('click', cerrarModal);
document.getElementById('agregar-producto').addEventListener('click', () => abrirModal());
form.addEventListener('submit', manejarSubmitProducto);
busquedaInput.addEventListener('input', filtrarProductos);
filtroCategoria.addEventListener('change', filtrarProductos);
filtroTipo.addEventListener('change', filtrarProductos);
filtroDisponibilidad.addEventListener('change', filtrarProductos);

// Funciones principales
function inicializarPagina() {
    cargarProductos();
    actualizarTabla();
}

async function cargarProductos() {
    try {
        // TODO: Reemplazar con llamada a API real
        productos = [
            {
                id: 1,
                nombre: "Zapato Formal Negro",
                descripcion: "Zapato formal de cuero negro",
                precio: 89.99,
                categoria: "hombres",
                tipo: "formal",
                imagen: "/imagenes/productos/hombres/formal-negro.jpg",
                tallas: ["40", "41", "42", "43"],
                colores: ["negro"],
                stock: 15,
                activo: true
            },
            // Más productos...
        ];
        actualizarTabla();
    } catch (error) {
        console.error('Error al cargar productos:', error);
        mostrarNotificacion('Error al cargar productos', 'error');
    }
}

function actualizarTabla(productosAMostrar = productos) {
    const tbody = tablaProductos.querySelector('tbody');
    tbody.innerHTML = '';

    productosAMostrar.forEach(producto => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${producto.id}</td>
            <td><img src="${producto.imagen}" alt="${producto.nombre}"></td>
            <td>${producto.nombre}</td>
            <td>${producto.categoria}</td>
            <td>$${producto.precio.toFixed(2)}</td>
            <td>${producto.stock}</td>
            <td><span class="status-badge ${producto.activo ? 'status-active' : 'status-inactive'}">
                ${producto.activo ? 'Disponible' : 'No disponible'}
            </span></td>
            <td class="actions-cell">
                <button class="btn-icon btn-edit" onclick="editarProducto(${producto.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="eliminarProducto(${producto.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarProductos() {
    const busqueda = busquedaInput.value.toLowerCase();
    const categoria = filtroCategoria.value;
    const tipo = filtroTipo.value;
    const disponibilidad = filtroDisponibilidad.value;

    const productosFiltrados = productos.filter(producto => {
        const cumpleBusqueda = producto.nombre.toLowerCase().includes(busqueda) ||
                              producto.descripcion.toLowerCase().includes(busqueda);
        const cumpleCategoria = categoria === 'todos' || producto.categoria === categoria;
        const cumpleTipo = tipo === 'todos' || producto.tipo === tipo;
        const cumpleDisponibilidad = disponibilidad === 'todos' || 
                                   (disponibilidad === 'disponible' && producto.activo) ||
                                   (disponibilidad === 'no-disponible' && !producto.activo);

        return cumpleBusqueda && cumpleCategoria && cumpleTipo && cumpleDisponibilidad;
    });

    actualizarTabla(productosFiltrados);
}

function abrirModal(producto = null) {
    productoEditando = producto;
    if (producto) {
        // Modo edición
        form.nombre.value = producto.nombre;
        form.descripcion.value = producto.descripcion;
        form.precio.value = producto.precio;
        form.categoria.value = producto.categoria;
        form.tipo.value = producto.tipo;
        form.stock.value = producto.stock;
        form.activo.checked = producto.activo;
        
        // Actualizar tallas y colores
        actualizarTallasSeleccionadas(producto.tallas);
        actualizarColoresSeleccionados(producto.colores);
        
        // Mostrar imagen actual
        if (producto.imagen) {
            imagenPreview.innerHTML = `<img src="${producto.imagen}" alt="Vista previa">`;
        }
    } else {
        // Modo nuevo producto
        form.reset();
        imagenPreview.innerHTML = '';
    }
    modal.style.display = 'block';
}

function cerrarModal() {
    modal.style.display = 'none';
    form.reset();
    productoEditando = null;
    imagenPreview.innerHTML = '';
}

async function manejarSubmitProducto(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const productoData = {
        nombre: formData.get('nombre'),
        descripcion: formData.get('descripcion'),
        precio: parseFloat(formData.get('precio')),
        categoria: formData.get('categoria'),
        tipo: formData.get('tipo'),
        stock: parseInt(formData.get('stock')),
        activo: formData.get('activo') === 'on',
        tallas: obtenerTallasSeleccionadas(),
        colores: obtenerColoresSeleccionados(),
        imagen: await procesarImagen(formData.get('imagen'))
    };

    try {
        if (productoEditando) {
            await actualizarProducto(productoEditando.id, productoData);
        } else {
            await crearProducto(productoData);
        }
        cerrarModal();
        cargarProductos();
        mostrarNotificacion('Producto guardado exitosamente', 'success');
    } catch (error) {
        console.error('Error al guardar producto:', error);
        mostrarNotificacion('Error al guardar producto', 'error');
    }
}

// Funciones auxiliares
function obtenerTallasSeleccionadas() {
    return Array.from(document.querySelectorAll('input[name="tallas"]:checked'))
                .map(input => input.value);
}

function obtenerColoresSeleccionados() {
    return Array.from(document.querySelectorAll('input[name="colores"]:checked'))
                .map(input => input.value);
}

function actualizarTallasSeleccionadas(tallas) {
    document.querySelectorAll('input[name="tallas"]').forEach(input => {
        input.checked = tallas.includes(input.value);
    });
}

function actualizarColoresSeleccionados(colores) {
    document.querySelectorAll('input[name="colores"]').forEach(input => {
        input.checked = colores.includes(input.value);
    });
}

async function procesarImagen(archivo) {
    if (!archivo || archivo.size === 0) return null;
    
    // TODO: Implementar carga de imagen a servidor
    return URL.createObjectURL(archivo);
}

async function crearProducto(productoData) {
    // TODO: Implementar llamada a API para crear producto
    productoData.id = productos.length + 1;
    productos.push(productoData);
}

async function actualizarProducto(id, productoData) {
    // TODO: Implementar llamada a API para actualizar producto
    const index = productos.findIndex(p => p.id === id);
    if (index !== -1) {
        productos[index] = { ...productos[index], ...productoData };
    }
}

async function eliminarProducto(id) {
    if (!confirm('¿Está seguro de que desea eliminar este producto?')) return;

    try {
        // TODO: Implementar llamada a API para eliminar producto
        productos = productos.filter(p => p.id !== id);
        actualizarTabla();
        mostrarNotificacion('Producto eliminado exitosamente', 'success');
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        mostrarNotificacion('Error al eliminar producto', 'error');
    }
}

function mostrarNotificacion(mensaje, tipo) {
    // TODO: Implementar sistema de notificaciones
    alert(mensaje);
} 