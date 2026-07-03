import type { Language } from '@/constants/i18n';

export type PanicAttackDayInfoLine = {
  type: 'body' | 'lead' | 'symptom';
  text: string;
};

const PANIC_ATTACK_DAY_INFO_RU: PanicAttackDayInfoLine[] = [
  {
    type: 'body',
    text: 'Иногда приступ не воспринимается как страх — на первом месте оказываются тело и его реакции: резкие физические ощущения, которые возникают внезапно и без видимого повода.',
  },
  { type: 'lead', text: 'Возможные признаки:' },
  { type: 'symptom', text: 'резкое учащение пульса' },
  { type: 'symptom', text: 'внезапный спазм или «пустоту» под ложечкой и в верхней части живота' },
  { type: 'symptom', text: 'ощущение, что воздуха не хватает' },
  { type: 'symptom', text: 'головокружение или лёгкость в голове' },
  { type: 'symptom', text: 'дрожь в теле' },
  { type: 'symptom', text: 'внезапный жар или холод' },
  { type: 'symptom', text: 'сдавленность или неприятные ощущения в груди' },
  { type: 'symptom', text: 'тошнота, урчание или дискомфорт в животе' },
  { type: 'symptom', text: 'внезапная обессиленность' },
  { type: 'symptom', text: 'онемение или покалывание в кистях, губах, щеках' },
  {
    type: 'body',
    text: 'Такие эпизоды нередко принимают за проблемы с сердцем, желудком или давлением — и только спустя время связывают их с тревогой. При этом любые новые, непривычные или особенно тяжёлые проявления стоит обсудить с врачом, чтобы отделить их от других заболеваний. Отмечайте здесь каждый случай за день, когда подобные симптомы возникали снова.',
  },
];

const PANIC_ATTACK_DAY_INFO_EN: PanicAttackDayInfoLine[] = [
  {
    type: 'body',
    text: 'Sometimes an episode is not experienced as fear — the body reacts first: sharp physical sensations that come on suddenly, without any clear trigger.',
  },
  { type: 'lead', text: 'Possible signs:' },
  { type: 'symptom', text: 'a sudden surge in pulse' },
  { type: 'symptom', text: 'a sudden cramp or "hollow" feeling under the breastbone and in the upper abdomen' },
  { type: 'symptom', text: 'a sense that you cannot get enough air' },
  { type: 'symptom', text: 'dizziness or lightness in the head' },
  { type: 'symptom', text: 'shaking throughout the body' },
  { type: 'symptom', text: 'a sudden wave of heat or cold' },
  { type: 'symptom', text: 'tightness or unpleasant sensations in the chest' },
  { type: 'symptom', text: 'nausea, rumbling, or discomfort in the stomach' },
  { type: 'symptom', text: 'sudden loss of strength' },
  { type: 'symptom', text: 'numbness or tingling in the hands, lips, or cheeks' },
  {
    type: 'body',
    text: 'Episodes like these are often mistaken for heart, stomach, or blood pressure problems — and linked to anxiety only much later. Any new, unfamiliar, or especially severe symptoms should still be discussed with a doctor to rule out other conditions. Use this counter to record each time during the day that similar symptoms appeared again.',
  },
];

const PANIC_ATTACK_DAY_INFO_BY_LANGUAGE: Partial<Record<Language, PanicAttackDayInfoLine[]>> = {
  ru: PANIC_ATTACK_DAY_INFO_RU,
  en: PANIC_ATTACK_DAY_INFO_EN,
};

export function getPanicAttackDayInfoLines(language: Language): PanicAttackDayInfoLine[] {
  return PANIC_ATTACK_DAY_INFO_BY_LANGUAGE[language] ?? PANIC_ATTACK_DAY_INFO_EN;
}
