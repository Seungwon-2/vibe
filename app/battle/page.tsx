import { BattlePageContainer } from '@/components/battle/BattlePageContainer';

export const metadata = {
  title: '모의 대전 | 포켓몬 월드',
  description: '두 포켓몬의 능력치와 타입 상성을 기반으로 모의 배틀을 진행합니다.',
};

export default function BattlePage() {
  return <BattlePageContainer />;
}
