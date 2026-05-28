import { MyPageContainer } from '@/components/mypage/MyPageContainer';

export const metadata = {
  title: '마이페이지 | 포켓몬 월드',
  description: '나만의 트레이너 카드와 파티를 꾸미고 PNG 이미지로 저장해 보세요.',
};

export default function MyPage() {
  return <MyPageContainer />;
}