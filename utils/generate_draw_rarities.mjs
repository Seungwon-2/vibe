import { writeFile } from 'node:fs/promises';

const TOTAL_POKEMON = 1025;
const OUTPUT_PATH = new URL('../const/pokemonDrawRarities.json', import.meta.url);

const rarities = {
  common: [],
  rare: [],
  epic: [],
  legendary: [],
  mythical: [],
};

for (let pokemonId = 1; pokemonId <= TOTAL_POKEMON; pokemonId += 1) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch pokemon-species/${pokemonId}: ${response.status}`);
  }

  const data = await response.json();
  const rarity = data.is_mythical
    ? 'mythical'
    : data.is_legendary
      ? 'legendary'
      : data.capture_rate <= 44
        ? 'epic'
        : data.capture_rate <= 119
          ? 'rare'
          : 'common';

  rarities[rarity].push(pokemonId);
}

await writeFile(OUTPUT_PATH, `${JSON.stringify(rarities, null, 2)}\n`, 'utf8');
console.log('written const/pokemonDrawRarities.json');