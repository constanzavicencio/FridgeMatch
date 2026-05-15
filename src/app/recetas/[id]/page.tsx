type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RecetaPage({ params }: Props) {
  const { id } = await params;

  return (
    <main>
      <h1>Receta {id}</h1>
    </main>
  );
}