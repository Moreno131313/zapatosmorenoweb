// public/js/session-manager.js
const SessionManager = {
  token: localStorage.getItem('token'),
  usuario: JSON.parse(localStorage.getItem('usuario')) || null,
  
  isLoggedIn() {
    return !!this.token;
  },
  
  setSession(token, usuario) {
    this.token = token;
    this.usuario = usuario;
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    this.actualizarUI();
  },
  
  clearSession() {
    this.token = null;
    this.usuario = null;
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.actualizarUI();
  },
  
  actualizarUI() {
    // Actualizar elementos de la UI según si el usuario está logueado o no
    const userLinks = document.querySelectorAll('.header-icons a[title="Iniciar Sesión"], .header-icons a[title="Mi cuenta"]');
    
    userLinks.forEach(link => {
      if (this.isLoggedIn()) {
        link.innerHTML = '<i class="fas fa-user-check"></i>';
        link.title = 'Mi cuenta';
        link.href = 'perfil.html';
      } else {
        link.innerHTML = '<i class="fas fa-user"></i>';
        link.title = 'Iniciar Sesión';
        link.href = 'login.html';
      }
    });
  },
  
  async fetchAPI(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (this.token) {
      defaultOptions.headers.Authorization = `Bearer ${this.token}`;
    }
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (response.status === 401) {
      // Token expirado o inválido
      this.clearSession();
      window.location.href = 'login.html';
      return null;
    }
    
    return response.json();
  }
};

// Inicializar la UI cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  SessionManager.actualizarUI();
});