# Diagrama de Componentes - Zapatos Moreno

## Visión General de la Arquitectura

```mermaid
graph TB
    subgraph Frontend
        UI[Interface de Usuario]
        Components[Componentes React]
        State[Gestión de Estado]
    end

    subgraph Backend
        API[API REST]
        Auth[Autenticación]
        Business[Lógica de Negocio]
    end

    subgraph Database
        MySQL[(MySQL DB)]
        SQLite[(SQLite Cache)]
    end

    UI --> Components
    Components --> State
    State --> API
    API --> Auth
    API --> Business
    Business --> MySQL
    Business --> SQLite
```

## Componentes del Frontend

```mermaid
graph LR
    subgraph Frontend Components
        Header[Header Component]
        ProductList[Product List]
        ProductDetail[Product Detail]
        Cart[Shopping Cart]
        Checkout[Checkout Process]
        UserProfile[User Profile]
    end

    Header --> ProductList
    ProductList --> ProductDetail
    ProductDetail --> Cart
    Cart --> Checkout
    Header --> UserProfile
```

## Componentes del Backend

```mermaid
graph TB
    subgraph API Layer
        Routes[API Routes]
        Controllers[Controllers]
        Middleware[Middleware]
    end

    subgraph Business Layer
        Services[Services]
        Models[Models]
        Utils[Utilities]
    end

    subgraph Data Layer
        Repositories[Repositories]
        DBConnectors[DB Connectors]
        Cache[Cache Layer]
    end

    Routes --> Controllers
    Controllers --> Middleware
    Middleware --> Services
    Services --> Models
    Services --> Utils
    Models --> Repositories
    Repositories --> DBConnectors
    Repositories --> Cache
```

## Componentes de Seguridad

```mermaid
graph LR
    subgraph Security Components
        JWT[JWT Auth]
        Validation[Data Validation]
        Encryption[Password Encryption]
        CORS[CORS Protection]
    end

    JWT --> Validation
    Validation --> Encryption
    JWT --> CORS
```

## Integración de Componentes

```mermaid
graph TB
    subgraph External Services
        Payment[Payment Gateway]
        Email[Email Service]
        Storage[File Storage]
    end

    subgraph Internal Components
        Auth[Authentication]
        Products[Products Module]
        Cart[Cart Module]
        Users[Users Module]
    end

    Auth --> Products
    Products --> Cart
    Cart --> Payment
    Users --> Email
    Products --> Storage
```

## Dependencias entre Componentes

```mermaid
graph TB
    subgraph Dependencies
        Express[Express.js]
        Sequelize[Sequelize ORM]
        JWT[jsonwebtoken]
        Bcrypt[bcrypt]
        Validator[express-validator]
    end

    Express --> Sequelize
    Express --> JWT
    JWT --> Bcrypt
    Express --> Validator
``` 