import Button from "@/components/Button";
import Card from "@/components/Card";
import Link from "next/link";

export default function SesionPage() {
  return (
    <main>
      <Card>
        <h1>Sesión inciada correctamente</h1>
        <p>Ya puedes continuar con el sitio usando tu cuenta.</p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
          <Link href="/recetas">
            <Button>Ir a recetas</Button>
          </Link>
          <Link href="/perfil">
            <Button>Ver perfil</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}