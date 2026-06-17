"use client";

import { useState } from "react";
import { formatQuantity } from "@/lib/fractionConverter";
import IngredientImage from "@/components/IngredientImage";
import styles from "./IngredientList.module.css";

type Ingredient = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  imagePath?: string | null;
  imageUrl?: string | null;
};

type IngredientListProps = {
  ingredients: Ingredient[];
  onUpdate: (id: number, quantity: number, unit: string) => void;
  onDelete: (id: number) => void;
};

export default function IngredientList({
  ingredients,
  onUpdate,
  onDelete,
}: IngredientListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editUnit, setEditUnit] = useState("");

  function startEdit(ingr: Ingredient) {
    setEditingId(ingr.id);
    setEditQty(ingr.quantity.toString());
    setEditUnit(ingr.unit);
  }

  function saveEdit(id: number) {
    onUpdate(id, parseFloat(editQty) || 1, editUnit);
    setEditingId(null);
  }

  return (
    <div className={styles.container}>
      {ingredients.length === 0 ? (
        <p className={styles.empty}>No hay ingredientes. ¡Agrega algunos!</p>
      ) : (
        <div className={styles.list}>
          {ingredients.map((ingr) => (
            <div key={ingr.id} className={styles.item}>
              <div className={styles.identity}>
                <IngredientImage
                  name={ingr.name}
                  imageUrl={ingr.imageUrl}
                  className={styles.image}
                  placeholderClassName={styles.imagePlaceholder}
                />

                <div className={styles.name}>{ingr.name}</div>
              </div>

              {editingId === ingr.id ? (
                <div className={styles.editForm}>
                  <input
                    type="number"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                    step="0.1"
                    min="0"
                  />

                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="unidad">unidad</option>
                    <option value="docena">docena</option>
                  </select>

                  <button onClick={() => saveEdit(ingr.id)}>Guardar</button>

                  <button
                    className={styles.cancel}
                    onClick={() => setEditingId(null)}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className={styles.info}>
                  <span className={styles.qty}>
                    {formatQuantity(ingr.quantity, ingr.unit)}
                  </span>

                  <button
                    className={styles.edit}
                    onClick={() => startEdit(ingr)}
                  >
                    Editar
                  </button>

                  <button
                    className={styles.delete}
                    onClick={() => onDelete(ingr.id)}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}