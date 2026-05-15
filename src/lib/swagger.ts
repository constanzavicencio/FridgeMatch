export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "FridgeMatch API",
    description: "API para gestión de ingredientes y recetas",
    version: "1.0.0",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor de desarrollo",
    },
  ],
  tags: [
    { name: "Auth", description: "Autenticación de usuarios" },
    { name: "Ingredients", description: "Gestión de ingredientes" },
    { name: "Recipes", description: "Catálogo de recetas" },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registrar nuevo usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", example: "usuario123" },
                  password: { type: "string", example: "password123" },
                  role: { type: "string", enum: ["user", "admin"], example: "user" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Usuario registrado exitosamente" },
          400: { description: "campos requeridos faltantes" },
          409: { description: "Usuario ya existe" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesión",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", example: "usuario123" },
                  password: { type: "string", example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login exitoso, retorna token y datos de usuario" },
          401: { description: "Credenciales inválidas" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Obtener datos del usuario autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Datos del usuario" },
          401: { description: "Token inválido o faltante" },
        },
      },
    },
    "/api/ingredients": {
      get: {
        tags: ["Ingredients"],
        summary: "Obtener todos los ingredientes del usuario",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Lista de ingredientes" },
          401: { description: "No autenticado" },
        },
      },
      post: {
        tags: ["Ingredients"],
        summary: "Agregar nuevo ingrediente",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "quantity"],
                properties: {
                  name: { type: "string", example: "Tomate" },
                  quantity: { type: "number", example: 5 },
                  unit: { type: "string", example: "kg" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Ingrediente agregado" },
          400: { description: "Datos inválidos" },
          401: { description: "No autenticado" },
        },
      },
      put: {
        tags: ["Ingredients"],
        summary: "Actualizar ingrediente",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["id"],
                properties: {
                  id: { type: "number", example: 1234567890 },
                  name: { type: "string" },
                  quantity: { type: "number" },
                  unit: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Ingrediente actualizado" },
          404: { description: "Ingrediente no encontrado" },
          401: { description: "No autenticado" },
        },
      },
      delete: {
        tags: ["Ingredients"],
        summary: "Eliminar ingrediente",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["id"],
                properties: {
                  id: { type: "number", example: 1234567890 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Ingrediente eliminado" },
          404: { description: "Ingrediente no encontrado" },
          401: { description: "No autenticado" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "JWT token obtenido del login",
      },
    },
  },
};
