# good-money-panel

Panel web de Good Money (clientes y backoffice). Angular 21 + Angular Material.
Consume la API de [good-money-api](../good-money-api/README.md).

## Desarrollo local

```bash
npm ci
npm start          # ng serve en http://localhost:4200
```

En desarrollo el panel usa `src/environments/environment.ts`, que apunta al API
local (`http://localhost:5090`). Ese archivo nunca debe apuntar a producción.

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Compilación de producción en `dist/goodmoney/browser/` |
| `npm run watch` | Compilación de desarrollo continua |
| `npm test` | Pruebas unitarias |

## Despliegue

En AWS: S3 privado servido por CloudFront (infraestructura en
`good-money-api/infra/aws`). Con GitHub Actions:

| Rama | Qué pasa |
|---|---|
| `develop` | Solo CI: compila y audita dependencias |
| `staging` | Despliegue automático al ambiente de pruebas |
| `main` | Despliegue a producción, tras aprobación manual en GitHub |

El despliegue escribe la URL de la API del ambiente (variable `API_URL`) en
`environment.prod.ts`, compila, sube a S3 (los archivos con hash con caché de
un año; `index.html` sin caché), invalida `index.html` en CloudFront y
comprueba que el panel responda 200. Las variables de cada ambiente de GitHub
están descritas en `good-money-api/infra/aws/README.md`.
