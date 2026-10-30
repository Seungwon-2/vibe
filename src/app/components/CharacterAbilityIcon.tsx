import type { CharacterPassiveDefinition } from '../../game/characters/characterAbilities';
import rinIconUrl from '../../../assets/character/abilities/icons/rin-cloud-tailwind.png?url';
import hiyoriIconUrl from '../../../assets/character/abilities/icons/hiyori-blossom-ward.png?url';
import maryIconUrl from '../../../assets/character/abilities/icons/mary-music-magnet.png?url';
import toaIconUrl from '../../../assets/character/abilities/icons/toa-ghost-glide.png?url';
import rangIconUrl from '../../../assets/character/abilities/icons/rang-tiger-spring.png?url';

export type CharacterAbilityIconProps = {
  icon: Exclude<CharacterPassiveDefinition['icon'], null>;
  accentColor: string;
  size?: number;
};

export function CharacterAbilityIcon({ icon, accentColor, size = 24 }: CharacterAbilityIconProps): React.JSX.Element {
  const icons = {
    'rin-cloud-tailwind': rinIconUrl,
    'hiyori-blossom-ward': hiyoriIconUrl,
    'mary-music-magnet': maryIconUrl,
    'toa-ghost-glide': toaIconUrl,
    'rang-tiger-spring': rangIconUrl,
  } as const;
  return (
    <img className="character-ability-icon" data-icon={icon} src={icons[icon]} width={size} height={size}
      style={{ '--ability-accent': accentColor } as React.CSSProperties}
      alt="" aria-hidden="true" />
  );
}
