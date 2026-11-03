import { useState } from 'react';
import { CHARACTERS } from '../../game/characters/characterCatalog';
import type { CharacterId } from '../../game/characters/characterTypes';
import { COSMETICS, type CosmeticKind } from '../../services/CosmeticCatalog';
import type { PlayerProfile } from '../../services/PlayerProfile';

export type ShopScreenProps = {
  profile: PlayerProfile;
  initialCharacterId: CharacterId;
  onBack(): void;
  onPurchase(cosmeticId: string): boolean;
  onEquip(characterId: CharacterId, cosmeticId: string): boolean;
  onUnequip(characterId: CharacterId, kind: CosmeticKind): void;
};

const KIND_LABELS: Readonly<Record<CosmeticKind, string>> = { trail: '달리기 효과', skin: '캐릭터 스킨', profile: '프로필 장식' };
const SHOP_CATEGORIES = ['trail'] as const;
const SHOP_TRAIL_IDS = new Set(['trail-cloud', 'trail-petal', 'trail-starlight', 'trail-golden-notes']);
const SHOP_ITEMS = COSMETICS.filter((item) => SHOP_TRAIL_IDS.has(item.id));

export function ShopScreen({ profile, initialCharacterId, onBack, onPurchase, onEquip, onUnequip }: ShopScreenProps): React.JSX.Element {
  const [characterId, setCharacterId] = useState(initialCharacterId);
  const [notice, setNotice] = useState('');
  const equipped = profile.equippedCosmeticIdsByCharacter[characterId] ?? [];

  return (
    <main className="progression-screen shop-screen">
      <section className="progression-panel shop-panel" aria-labelledby="shop-title">
        <button className="progression-back" type="button" onClick={onBack}>뒤로</button>
        <p className="eyebrow">RUNNER CLOSET</p>
        <h1 id="shop-title">코인 상점</h1>
        <p className="progression-intro">꾸미기를 구매하고 러너마다 다르게 장착하세요. 게임 성능에는 영향을 주지 않습니다.</p>
        <div className="shop-toolbar">
          <strong>보유 코인 <span>🪙 {profile.walletCoins.toLocaleString()}</span></strong>
          <label>장착할 러너
            <select value={characterId} onChange={(event) => setCharacterId(event.target.value as CharacterId)}>
              {CHARACTERS.map((character) => <option value={character.id} key={character.id}>{character.displayName}</option>)}
            </select>
          </label>
        </div>
        <div className="shop-loadout" aria-label="현재 러너 장착 아이템">
          <strong>{CHARACTERS.find((character) => character.id === characterId)?.displayName} 장착 중</strong>
          {SHOP_CATEGORIES.map((kind) => {
            const cosmeticId = equipped.find((id) => COSMETICS.find((item) => item.id === id)?.kind === kind);
            const cosmetic = COSMETICS.find((item) => item.id === cosmeticId);
            return <span key={kind}>{KIND_LABELS[kind]}: {cosmetic?.name ?? '기본'}</span>;
          })}
        </div>
        {notice && <p className="shop-notice" role="status">{notice}</p>}
        {SHOP_CATEGORIES.map((kind) => <section className="shop-category" key={kind} aria-labelledby={`shop-${kind}`}>
          <h2 id={`shop-${kind}`}>{KIND_LABELS[kind]}</h2>
          <div className="shop-items">
            {SHOP_ITEMS.filter((item) => item.kind === kind).map((item) => {
              const owned = profile.unlockedCosmeticIds.includes(item.id);
              const compatible = item.compatibleCharacterIds.includes(characterId);
              const isEquipped = equipped.includes(item.id);
              return <article className={`shop-item${item.placeholder ? ' is-placeholder' : ''}`} key={item.id}>
                <div className={`shop-item__preview shop-item__preview--${kind}`} style={{ '--cosmetic-color': item.color } as React.CSSProperties}>
                  {item.assetPath && <span aria-hidden="true">✧</span>}
                  {!item.assetPath && <span aria-hidden="true">{kind === 'trail' ? '〰' : kind === 'profile' ? '✦' : '◇'}</span>}
                </div>
                <div className="shop-item__copy"><strong>{item.name}</strong><p>{item.description}</p>
                  <small>{item.rarity === 'epic' ? '에픽' : item.rarity === 'rare' ? '레어' : '일반'}</small>
                </div>
                <div className="shop-item__actions">
                  {!owned && item.purchasable && <button type="button" disabled={profile.walletCoins < item.price}
                    onClick={() => setNotice(onPurchase(item.id) ? `${item.name} 구매 완료` : '코인이 부족하거나 구매할 수 없습니다.')}>🪙 {item.price} 구매</button>}
                  {!owned && !item.purchasable && <button type="button" disabled>{item.placeholder ? '에셋 준비 중' : '도전 보상'}</button>}
                  {owned && compatible && <button type="button" disabled={isEquipped}
                    onClick={() => setNotice(onEquip(characterId, item.id) ? `${item.name} 장착 완료` : '장착할 수 없습니다.')}>{isEquipped ? '장착 중' : '장착'}</button>}
                  {owned && !compatible && <button type="button" disabled>이 러너 전용</button>}
                  {owned && isEquipped && <button type="button" className="shop-item__remove"
                    onClick={() => { onUnequip(characterId, kind); setNotice(`${KIND_LABELS[kind]} 기본 장비로 변경`); }}>해제</button>}
                </div>
              </article>;
            })}
          </div>
        </section>)}
      </section>
    </main>
  );
}
