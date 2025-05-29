/**
 * CP-004: Prueba de diseño responsivo
 * 
 * Esta prueba verifica que el sitio web se visualice correctamente en dispositivos móviles
 * Fecha: 16/05/2025
 * Autor: Duvan Moreno
 */

describe('CP-004 - Prueba de Diseño Responsivo', () => {
  const viewports = [
    { name: 'iPhone X', width: 375, height: 812 },
    { name: 'Galaxy S21', width: 360, height: 800 },
    { name: 'iPad Pro', width: 1024, height: 1366 }
  ];

  viewports.forEach((viewport) => {
    context(`Pruebas en ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit('/');
        // Esperar a que la página cargue completamente
        cy.get('.header', { timeout: 10000 }).should('be.visible');
      });

      it('1. El diseño se adapta correctamente al tamaño de pantalla', () => {
        // Verificar que no hay scroll horizontal
        cy.window().then((win) => {
          const body = win.document.body;
          const html = win.document.documentElement;
          
          const height = Math.max(
            body.scrollHeight, body.offsetHeight,
            html.clientHeight, html.scrollHeight, html.offsetHeight
          );
          
          const width = Math.max(
            body.scrollWidth, body.offsetWidth,
            html.clientWidth, html.scrollWidth, html.offsetWidth
          );
          
          // Verificar que el ancho del contenido es igual o menor al viewport
          expect(width).to.be.at.most(viewport.width);
        });
      });

      it('2. Los elementos son legibles y accesibles en pantallas pequeñas', () => {
        // Verificar tamaño de fuente mínimo
        cy.get('p, a, button, input, label').each(($el) => {
          const fontSize = parseFloat(window.getComputedStyle($el[0]).fontSize);
          expect(fontSize).to.be.at.least(12); // Tamaño mínimo 12px
        });
        
        // Verificar que los botones son suficientemente grandes para tocar
        cy.get('button, .btn, [role="button"], a.nav-link').each(($el) => {
          const rect = $el[0].getBoundingClientRect();
          expect(Math.min(rect.width, rect.height)).to.be.at.least(32); // Mínimo 32px
        });
      });

      it('3. La navegación es funcional en modo táctil', () => {
        // Comprobar que el menú hamburguesa funciona correctamente si estamos en móvil
        if (viewport.width < 768) {
          cy.get('.navbar-toggler').should('be.visible');
          cy.get('.navbar-toggler').click();
          cy.get('.navbar-collapse').should('be.visible');
          
          // Verificar que los elementos del menú son clickeables
          cy.get('.navbar-nav .nav-link').first().click();
          // Verificar que la navegación funcionó
          cy.url().should('not.eq', '/');
        } else {
          // En pantallas grandes, el menú debe estar visible directamente
          cy.get('.navbar-nav').should('be.visible');
        }
      });

      it('4. El menú se colapsa en un menú hamburguesa en dispositivos móviles', () => {
        if (viewport.width < 768) {
          // En móvil, debe existir un botón hamburguesa y el menú principal debe estar colapsado
          cy.get('.navbar-toggler').should('be.visible');
          cy.get('.navbar-collapse').should('not.be.visible');
        } else {
          // En pantallas grandes, no debe existir botón hamburguesa
          cy.get('.navbar-toggler').should('not.exist');
          // El menú principal debe estar visible
          cy.get('.navbar-collapse').should('be.visible');
        }
      });

      it('5. Las imágenes se redimensionan adecuadamente', () => {
        // Comprobar que las imágenes no se desbordan de su contenedor
        cy.get('img').each(($img) => {
          const rect = $img[0].getBoundingClientRect();
          expect(rect.width).to.be.at.most(viewport.width);
        });
      });

      it('6. Los formularios son usables en pantallas pequeñas', () => {
        // Navegar a la página de registro
        cy.visit('/registro');
        cy.get('form').should('be.visible');
        
        // Verificar que los campos del formulario tienen un ancho adecuado
        cy.get('input, select, textarea').each(($input) => {
          const rect = $input[0].getBoundingClientRect();
          expect(rect.width).to.be.at.most(viewport.width - 30); // Con margen
        });
        
        // Comprobar que las etiquetas están correctamente alineadas
        cy.get('label').each(($label) => {
          const display = window.getComputedStyle($label[0]).display;
          // En móvil, las etiquetas deben estar en bloque, no inline
          if (viewport.width < 768) {
            expect(['block', 'flex']).to.include(display);
          }
        });
      });

      it('7. El proceso de pago es completamente funcional en móvil', () => {
        // Navegar a un producto
        cy.visit('/productos/1');
        
        // Añadir al carrito
        cy.get('.add-to-cart-btn').click();
        
        // Ir al carrito
        cy.visit('/carrito');
        
        // Comprobar que se puede proceder al checkout
        cy.get('.checkout-btn').should('be.visible');
        cy.get('.checkout-btn').click();
        
        // Verificar que llegamos a la página de checkout
        cy.url().should('include', '/checkout');
        
        // Verificar que el formulario de pago es usable
        if (viewport.width < 768) {
          cy.get('input[name="cardNumber"]').should('have.css', 'width')
            .then(width => {
              const numericWidth = parseFloat(width);
              expect(numericWidth).to.be.at.most(viewport.width - 30);
            });
        }
      });
    });
  });

  // Prueba orientación horizontal para dispositivos móviles
  context('Pruebas en orientación horizontal (iPhone)', () => {
    beforeEach(() => {
      cy.viewport(812, 375); // iPhone X en horizontal
      cy.visit('/');
    });

    it('El diseño se adapta correctamente en orientación horizontal', () => {
      // Verificar que los elementos principales están visibles
      cy.get('.header').should('be.visible');
      cy.get('.navbar').should('be.visible');
      cy.get('.content').should('be.visible');

      // No debe haber scroll horizontal
      cy.window().then((win) => {
        expect(win.document.body.scrollWidth).to.be.at.most(812);
      });
    });
  });
}); 