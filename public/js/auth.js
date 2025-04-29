// Función para verificar si el usuario está autenticado
function isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
}

// Función para obtener el token
function getToken() {
    return localStorage.getItem('token');
}

// Función para obtener los datos del usuario
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Función para verificar autenticación en páginas protegidas
function checkAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Función para agregar el token a las peticiones fetch
function addAuthHeader(headers = {}) {
    const token = getToken();
    if (token) {
        return {
            ...headers,
            'Authorization': `Bearer ${token}`
        };
    }
    return headers;
}

// Exportar funciones
window.Auth = {
    isAuthenticated,
    getToken,
    getUser,
    logout,
    checkAuth,
    addAuthHeader
}; 