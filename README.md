# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.6.

## Alcance y arquitectura

Este frontend cubre la gestión de productos, el registro de usuarios y la venta de productos.

La aplicación se organiza por funcionalidades (`features`) y responsabilidades compartidas (`core` para servicios, guards e interceptores; `shared` para modelos). Para el análisis del diseño actual, las decisiones sobre ventas y stock y la evolución recomendada del backend y frontend, consulta [docs/architecture.md](./docs/architecture.md).

Este repositorio contiene únicamente el frontend Angular. Los cambios al esquema, las entidades, las transacciones de stock y los endpoints del backend deben implementarse en el repositorio del servidor.

## URL de la API

Los servicios obtienen el prefijo de API desde `src/environments/environment.ts`; actualmente es `/api`, por lo que la aplicación no necesita URLs de backend repetidas ni un origen de desarrollo fijo. En `ng serve`, Angular CLI reenvía `/api` al backend configurado en `proxy.conf.json` (por defecto `http://127.0.0.1:8080`). Para usar otro backend local, cambia solo el `target` del proxy. En desarrollo el navegador usa el mismo origen del frontend, así que no requiere CORS. En producción, publica o enruta `/api` al backend bajo el mismo origen del frontend; si deben ser orígenes distintos, agrega el origen exacto del frontend a `APP_CORS_ALLOWED_ORIGINS` en el backend.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
