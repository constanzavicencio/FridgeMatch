export type Recipe = {
  id: number;
  name: string;
  description: string;
  difficulty: "fácil" | "medio" | "difícil";
  time: number; // en minutos
  servings: number;
  ingredients: { name: string; quantity: number; unit: string }[];
  instructions: string[];
  image?: string;
};

export const recipes: Recipe[] = [
  {
    id: 1,
    name: "Ensalada Fresca",
    description: "Una ensalada ligera y nutritiva con frutas y verduras frescas",
    difficulty: "fácil",
    time: 15,
    servings: 2,
    ingredients: [
      { name: "Lechuga", quantity: 1, unit: "unidad" },
      { name: "Tomate", quantity: 2, unit: "unidad" },
      { name: "Pepino", quantity: 1, unit: "unidad" },
      { name: "Cebolla", quantity: 0.5, unit: "unidad" },
      { name: "Aceite de oliva", quantity: 3, unit: "cucharadas" },
      { name: "Vinagre", quantity: 1, unit: "cucharada" },
    ],
    instructions: [
      "Lava las verduras cuidadosamente",
      "Pica la lechuga en trozos pequeños",
      "Corta el tomate, pepino y cebolla en dados",
      "Mezcla todas las verduras en un bol",
      "Prepara el aderezo con aceite y vinagre",
      "Sirve y disfruta",
    ],
  },
  {
    id: 2,
    name: "Pasta Primavera",
    description: "Pasta con verduras frescas de temporada",
    difficulty: "fácil",
    time: 20,
    servings: 4,
    ingredients: [
      { name: "Pasta", quantity: 400, unit: "g" },
      { name: "Brócoli", quantity: 1, unit: "unidad" },
      { name: "Zanahorias", quantity: 2, unit: "unidad" },
      { name: "Tomate cherry", quantity: 200, unit: "g" },
      { name: "Ajo", quantity: 3, unit: "dientes" },
      { name: "Aceite de oliva", quantity: 4, unit: "cucharadas" },
      { name: "Sal y pimienta", quantity: 1, unit: "al gusto" },
    ],
    instructions: [
      "Cocina la pasta en agua con sal según las instrucciones del paquete",
      "Corta las verduras en trozos pequeños",
      "Sofríe el ajo en aceite de oliva",
      "Agrega las verduras y cocina 5-7 minutos",
      "Escurre la pasta y mezcla con las verduras",
      "Sazona con sal y pimienta al gusto",
    ],
  },
  {
    id: 3,
    name: "Sopa de Verduras",
    description: "Una sopa casera reconfortante llena de nutrientes",
    difficulty: "medio",
    time: 30,
    servings: 4,
    ingredients: [
      { name: "Papas", quantity: 3, unit: "unidad" },
      { name: "Zanahorias", quantity: 2, unit: "unidad" },
      { name: "Cebolla", quantity: 1, unit: "unidad" },
      { name: "Ajo", quantity: 2, unit: "dientes" },
      { name: "Caldo de verduras", quantity: 1, unit: "L" },
      { name: "Sal y pimienta", quantity: 1, unit: "al gusto" },
      { name: "Aceite de oliva", quantity: 2, unit: "cucharadas" },
    ],
    instructions: [
      "Calienta el aceite en una olla grande",
      "Sofríe la cebolla y el ajo hasta que estén dorados",
      "Agrega las papas y zanahorias picadas",
      "Vierte el caldo de verduras",
      "Cocina a fuego medio por 20 minutos hasta que las verduras estén tiernas",
      "Sazona con sal y pimienta",
      "Sirve caliente",
    ],
  },
  {
    id: 4,
    name: "Arroz con Verduras",
    description: "Arroz salteado con verduras coloridas y sabrosas",
    difficulty: "medio",
    time: 25,
    servings: 4,
    ingredients: [
      { name: "Arroz", quantity: 2, unit: "tazas" },
      { name: "Agua", quantity: 4, unit: "tazas" },
      { name: "Pero paprika", quantity: 1, unit: "unidad" },
      { name: "Zanahoria", quantity: 1, unit: "unidad" },
      { name: "Cebolla", quantity: 1, unit: "unidad" },
      { name: "Chícharos", quantity: 1, unit: "taza" },
      { name: "Aceite vegetal", quantity: 3, unit: "cucharadas" },
      { name: "Sal", quantity: 1, unit: "al gusto" },
    ],
    instructions: [
      "Calienta el aceite en una paella o sartén grande",
      "Sofríe la cebolla y otros vegetales",
      "Agrega el arroz y revuelve para tostar",
      "Vierte el agua caliente y sazona",
      "Cocina a fuego medio-bajo por 15 minutos",
      "Deja reposar 5 minutos antes de servir",
    ],
  },
  {
    id: 5,
    name: "Omelette de Queso",
    description: "A desayuno o almuerzo perfecto, esponjoso y delicioso",
    difficulty: "fácil",
    time: 10,
    servings: 1,
    ingredients: [
      { name: "Huevos", quantity: 3, unit: "unidad" },
      { name: "Queso", quantity: 100, unit: "g" },
      { name: "Mantequilla", quantity: 1, unit: "cucharada" },
      { name: "Sal", quantity: 1, unit: "pizca" },
      { name: "Pimienta", quantity: 1, unit: "pizca" },
      { name: "Perejil", quantity: 1, unit: "cucharada" },
    ],
    instructions: [
      "Bate los huevos en un bol con sal, pimienta y perejil",
      "Calienta la mantequilla en una sartén a fuego medio",
      "Vierte los huevos batidos",
      "Cuando estén a media cocción, agrega el queso rallado",
      "Dobla el omelette por la mitad",
      "Sirve caliente",
    ],
  },
];
