import type { Language } from '@/constants/i18n';

const IMPORTANT_INFO_RU = `Тревожное расстройство — это состояние, которое поддерживается сразу несколькими взаимосвязанными факторами. Изменения даже в одном из них постепенно помогают ослабить тревогу.

🧠 Особенности работы нервной системы
Нервная система человека с тревожным расстройством становится более чувствительной к сигналам опасности. Она может запускать реакцию тревоги даже тогда, когда реальной угрозы нет.
Примеры:
недостаток сна;
длительный стресс;
переутомление;
кофеин или другие стимуляторы;
пропуск назначенных лекарств;
восстановление после панической атаки, когда нервная система еще остается "настороженной".
Именно поэтому в дневнике важно отмечать: сон, прием лекарств, физическую активность и общее самочувствие.

💭 Мыслительные привычки
При тревожном расстройстве мозг начинает автоматически искать опасность и часто переоценивает вероятность плохого исхода.
Примеры:
«У меня колет в груди — наверное, это сердце».
«Если закружилась голова, я потеряю сознание».
«Если тревога появилась сегодня, значит завтра будет еще хуже».
«Я никогда не смогу жить нормально».
Эти мысли возникают автоматически и кажутся убедительными, хотя чаще всего не соответствуют действительности.
Поэтому полезно записывать события дня и свои переживания, чтобы позже увидеть ситуацию более объективно.

🚶 Поведение
Когда человек начинает избегать ситуаций, которые кажутся опасными, тревога временно уменьшается. Но именно это избегание закрепляет тревожное расстройство.
Примеры:
перестать ездить в метро;
отказаться от походов в магазин;
постоянно измерять давление или пульс;
носить с собой лекарства «на всякий случай» и чувствовать себя без них небезопасно;
избегать физических нагрузок из-за страха учащенного сердцебиения.
Такое поведение приносит кратковременное облегчение, но не позволяет мозгу убедиться, что ситуация безопасна.

❤️ Физиологические реакции организма
Тревога всегда сопровождается изменениями в теле. Они являются нормальной частью реакции организма на стресс, но могут восприниматься как признаки опасной болезни.
Примеры:
учащенное сердцебиение;
нехватка воздуха;
напряжение мышц;
дрожь;
потливость;
головокружение;
ощущение кома в горле;
дискомфорт в желудке;
покалывание в руках или лице.
Эти симптомы неприятны, но сами по себе обычно не представляют опасности.

И самое главное
Эти четыре фактора постоянно влияют друг на друга.
Например:
Вы плохо спали → нервная система стала более чувствительной → утром почувствовали учащенное сердцебиение → возникла мысль «со мной что-то не так» → решили отменить тренировку и остаться дома → тревога уменьшилась на несколько часов, но мозг «запомнил», что избегание помогает → в следующий раз тревога возникнет еще быстрее.
Именно поэтому дневник включает сразу несколько разделов: сон, лекарства, физическую активность, триггеры, события дня и уровень тревоги. Вместе они помогают увидеть не отдельные симптомы, а всю цепочку событий. Это делает состояние более понятным, а лечение — более осознанным и эффективным. Надо понять, что тревога — это не случайный хаос, а процесс, который можно постепенно научиться распознавать и менять.`;

const IMPORTANT_INFO_EN = `Anxiety disorder is maintained by several interconnected factors. Changing even one of them gradually helps reduce anxiety.

🧠 How the nervous system works
In anxiety disorder, the nervous system becomes more sensitive to danger signals. It may trigger anxiety even when there is no real threat.
Examples:
lack of sleep;
prolonged stress;
burnout;
caffeine or other stimulants;
missing prescribed medication;
recovery after a panic attack, when the nervous system is still on high alert.
That is why the diary tracks sleep, medication, physical activity, and overall well-being.

💭 Thinking habits
With anxiety disorder, the brain automatically looks for danger and often overestimates the likelihood of a bad outcome.
Examples:
"My chest hurts — it must be my heart."
"If I feel dizzy, I will faint."
"If I felt anxious today, tomorrow will be worse."
"I will never be able to live normally."
These thoughts arise automatically and feel convincing, even though they often do not match reality.
Writing down daily events and feelings helps you see situations more objectively later.

🚶 Behavior
When a person starts avoiding situations that feel dangerous, anxiety temporarily decreases. But this avoidance reinforces anxiety disorder.
Examples:
stopping subway travel;
avoiding grocery stores;
constantly checking blood pressure or pulse;
carrying medication "just in case" and feeling unsafe without it;
avoiding exercise because of fear of a racing heart.
This behavior brings short-term relief but does not let the brain learn that the situation is safe.

❤️ Physical reactions
Anxiety always comes with bodily changes. They are a normal part of the stress response but may feel like signs of a dangerous illness.
Examples:
racing heartbeat;
shortness of breath;
muscle tension;
trembling;
sweating;
dizziness;
lump in the throat;
stomach discomfort;
tingling in the hands or face.
These symptoms are unpleasant but are usually not dangerous on their own.

Most importantly
These four factors constantly influence one another.
For example:
You slept poorly → your nervous system became more sensitive → you noticed a racing heart in the morning → the thought appeared that "something is wrong with me" → you canceled exercise and stayed home → anxiety decreased for a few hours, but the brain "learned" that avoidance helps → next time anxiety appears even faster.
That is why the diary includes sleep, medication, physical activity, triggers, daily events, and anxiety level. Together they help you see not isolated symptoms but the whole chain of events. This makes your state easier to understand and treatment more conscious and effective. Anxiety is not random chaos — it is a process you can gradually learn to recognize and change.`;

const IMPORTANT_INFO_BY_LANGUAGE: Partial<Record<Language, string>> = {
  ru: IMPORTANT_INFO_RU,
  en: IMPORTANT_INFO_EN,
};

export function getImportantInfoText(language: Language): string {
  return IMPORTANT_INFO_BY_LANGUAGE[language] ?? IMPORTANT_INFO_EN;
}

export function isImportantInfoSectionTitle(paragraph: string): boolean {
  const trimmed = paragraph.trim();
  return (
    /^[🧠💭🚶❤️]/.test(trimmed) ||
    trimmed === 'И самое главное' ||
    trimmed === 'Most importantly'
  );
}
