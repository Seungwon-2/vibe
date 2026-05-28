import { PokemonDrawContainer } from '@/components/draw/PokemonDrawContainer';

export const metadata = {
  title: '포켓몬 뽑기 | 포켓몬 월드',
  description: '레버를 당겨 4자리 룰렛을 돌리고 랜덤 포켓몬을 뽑아보세요.',
};

export default function PokemonDrawPage() {
  return <PokemonDrawContainer />;
}