import { queryOptions } from '@tanstack/react-query';

import { pokeapi } from '@/lib/pokeapi';
import { MoveDetail } from '@/scheme/battle';

/** 기술 상세 쿼리 (한글명, 위력, 타입 등) */
export function buildMoveDetailQuery(name: string) {
  return queryOptions({
    queryKey: ['/move', name],
    queryFn: async () => {
      const data = await pokeapi.get(`move/${name}`).json<unknown>();
      return MoveDetail.parse(data);
    },
    staleTime: Infinity,
    enabled: !!name,
  });
}
