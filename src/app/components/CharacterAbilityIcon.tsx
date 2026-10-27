import type { CharacterPassiveDefinition } from '../../game/characters/characterAbilities';

export type CharacterAbilityIconProps = {
  icon: Exclude<CharacterPassiveDefinition['icon'], null>;
  accentColor: string;
  size?: number;
};

export function CharacterAbilityIcon({ icon, accentColor, size = 24 }: CharacterAbilityIconProps): React.JSX.Element {
  return (
    <svg className="character-ability-icon" data-icon={icon} width={size} height={size} viewBox="0 0 24 24"
      aria-hidden="true" focusable="false">
      {icon === 'cloud' && <>
        <path d="M4.1 17.8h14.2a3.7 3.7 0 0 0 .2-7.4 6.1 6.1 0 0 0-11.7-1.2A4.4 4.4 0 0 0 4.1 17.8Z"
          fill={accentColor} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </>}
      {icon === 'pink-flame' && <path d="M12 2.2c.7 3.2 4.9 4.8 4.9 9.5 0 3.7-2.2 6.4-5.5 6.4S5.8 16 5.8 12.9c0-2.2 1.2-4.1 3.1-5.8-.1 2.4.5 3.5 1.7 3.9.8-2.5 1-5.3 1.4-8.8Z"
        fill={accentColor} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />}
      {icon === 'sparkling-magnet' && <>
        <path d="M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4H6Z"
          fill="none" stroke={accentColor} strokeWidth="3.2" strokeLinejoin="round" />
        <path d="m19 3 .7 1.8 1.8.7-1.8.7L19 8l-.7-1.8-1.8-.7 1.8-.7L19 3ZM4 15l.5 1.2 1.3.5-1.3.5L4 18.5l-.5-1.3-1.3-.5 1.3-.5L4 15Z"
          fill={accentColor} />
      </>}
    </svg>
  );
}
