This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


# Funcionalidades del producto

## Funcionalidad 1: Registro e ingreso de ingredientes de usuario
El sistema permitirá al usuario ingresar manualmente los ingredientes disponibles en su hogar mediante una interfaz simple e intuitiva.
Los ingredientes ingresados serán almacenados temporalmente para ser utilizados en la generación de recomendaciones. 


## Funcionalidad 2: Generación de recomendaciones de recetas
El sistema generará recomendaciones de recetas en base a los ingredientes ingresados por el usuario, utilizando fuentes externas y lógica de procesamiento que permita identificar coincidencias relevantes. 


## Funcionalidad 3: Identificación de ingredientes faltantes
Para cada receta recomendada, el sistema identificará los ingredientes que el usuario no posee, diferenciándolos de aquellos que sí están disponibles.


## Funcionalidad 4: Visualización de recetas recomendadas
El sistema presentará al usuario una lista de recetas recomendadas en una interfaz amigable, mostrando información relevante como:
nombre de la receta
ingredientes
dificultad
tiempo estimado de preparación

## Funcionalidad 5: Generación de sugerencias de compra
El sistema generará sugerencias de compra referenciales asociadas a los ingredientes faltantes, vinculados a productos disponibles en Jumbo. 


## Funcionalidad 6: Integración visual con la plataforma Jumbo
La funcionalidad será presentada como parte de la experiencia digital de Jumbo (jumbo.cl), manteniendo coherencia con su interfaz y evitando redirecciones externas directas. 
