// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Comando para verificar que un producto cumple con todos los criterios de filtro
Cypress.Commands.add('verificarProductoCumpleCriterios', (producto, criterios) => {
  // Verificar categoría
  if (criterios.categoria) {
    cy.wrap(producto).should('have.attr', 'data-categoria', criterios.categoria);
  }
  
  // Verificar precio
  if (criterios.precio) {
    const precioProd = parseInt(producto.getAttribute('data-precio'));
    expect(precioProd).to.be.at.most(parseInt(criterios.precio));
  }
  
  // Verificar color
  if (criterios.color) {
    cy.wrap(producto).should('have.attr', 'data-color').and('include', criterios.color);
  }
  
  // Verificar talla
  if (criterios.talla) {
    cy.wrap(producto).find('[data-testid="tallas-disponibles"]').should('contain', criterios.talla);
  }
});

// Comando para aplicar múltiples filtros
Cypress.Commands.add('aplicarFiltros', (filtros) => {
  // Aplicar filtro de categoría
  if (filtros.categoria) {
    cy.get(`a[href*="genero=${filtros.categoria}"]`).click();
    cy.url().should('include', `genero=${filtros.categoria}`);
  }
  
  // Aplicar filtro de precio
  if (filtros.precio) {
    cy.get('[data-testid="filtro-precio"]').click();
    cy.get('[data-testid="rango-precio"]').invoke('val', filtros.precio).trigger('change');
    cy.get('[data-testid="aplicar-precio"]').click();
  }
  
  // Aplicar filtro de color
  if (filtros.color) {
    cy.get('[data-testid="filtro-color"]').click();
    cy.contains(filtros.color).click();
  }
  
  // Aplicar filtro de talla
  if (filtros.talla) {
    cy.get('[data-testid="filtro-talla"]').click();
    cy.contains(filtros.talla).click();
  }
  
  // Esperar a que los resultados se actualicen
  cy.get('[data-testid="resultados-busqueda"]').should('be.visible');
});

// Comando para capturar evidencias
Cypress.Commands.add('capturarEvidencias', (descripcion) => {
  // Tomar screenshot
  cy.screenshot(descripcion);
  
  // Capturar logs
  cy.log(`Evidencia: ${descripcion}`);
  
  // Guardar metadatos
  cy.task('logEvidencia', {
    descripcion,
    fecha: new Date().toISOString(),
    url: cy.url()
  });
});