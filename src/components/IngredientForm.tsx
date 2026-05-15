"use client";

import { useState } from "react";
import styles from "./IngredientForm.module.css";

type IngredientFormProps = {
  onAdd: (name: string, quantity: number, unit: string) => void;
  isLoading?: boolean;
};

export default function IngredientForm({ onAdd, isLoading }: IngredientFormProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("kg");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, parseFloat(quantity) || 1, unit);
    setName("");
    setQuantity("1");
    setUnit("kg");
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input
        type="text"
        placeholder="Ingredient (e.g., Tomate)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={styles.input}
      />
      <input
        type="number"
        placeholder="Cantidad"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        min="0"
        step="0.1"
        className={styles.input}
      />
      <select value={unit} onChange={(e) => setUnit(e.target.value)} className={styles.input}>
        <option value="kg">kg</option>
        <option value="g">g</option>
        <option value="L">L</option>
        <option value="ml">ml</option>
        <option value="unidad">unidad</option>
        <option value="docena">docena</option>
      </select>
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Agregando..." : "Agregar"}
      </button>
    </form>
  );
}
