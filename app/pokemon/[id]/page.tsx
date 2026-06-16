import { PokemonDetailContainer } from '@/components/pokemon/PokemonDetailContainer';

export default async function PokemonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PokemonDetailContainer identifier={id} />;
}
