import { Suspense } from 'react';

import { PokemonListContainer } from '@/components/pokemon/PokemonListContainer';

export default function HomePage() {
  return (
    <Suspense>
      <PokemonListContainer />
    </Suspense>
  );
}
