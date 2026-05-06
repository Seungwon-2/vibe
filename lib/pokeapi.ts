import ky from 'ky';

export const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

export const pokeapi = ky.create({
  prefix: POKEAPI_BASE,
  timeout: 15000,
  retry: { limit: 1 },
});
