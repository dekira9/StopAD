import type { Language } from '@/constants/i18n';

export type PanicAttackDayInfoLine = {
  type: 'body' | 'lead' | 'symptom';
  text: string;
};

const PANIC_ATTACK_DAY_INFO_RU: PanicAttackDayInfoLine[] = [
  {
    type: 'body',
    text: 'Внезапный приступ сильной тревоги и непреодолимого страха, который достигает пика за несколько минут и сопровождается резкими физическими симптомами.',
  },
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
    text: 'A sudden attack of intense anxiety and overwhelming fear that peaks within a few minutes and is accompanied by sharp physical symptoms.',
  },
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

const PANIC_ATTACK_DAY_INFO_ES: PanicAttackDayInfoLine[] = [
  {
    type: 'body',
    text: 'Un ataque súbito de ansiedad intensa y miedo abrumador que alcanza su pico en pocos minutos y va acompañado de síntomas físicos intensos.',
  },
  {
    type: 'body',
    text: 'A veces el episodio no se vive como miedo — primero reacciona el cuerpo: sensaciones físicas intensas que aparecen de repente, sin un motivo evidente.',
  },
  { type: 'lead', text: 'Posibles signos:' },
  { type: 'symptom', text: 'aumento brusco del pulso' },
  { type: 'symptom', text: 'espasmo repentino o sensación de «vacío» bajo el esternón y en la parte superior del abdomen' },
  { type: 'symptom', text: 'sensación de falta de aire' },
  { type: 'symptom', text: 'mareo o ligereza en la cabeza' },
  { type: 'symptom', text: 'temblor en el cuerpo' },
  { type: 'symptom', text: 'oleada repentina de calor o frío' },
  { type: 'symptom', text: 'opresión o sensaciones desagradables en el pecho' },
  { type: 'symptom', text: 'náuseas, ruidos o malestar en el estómago' },
  { type: 'symptom', text: 'pérdida repentina de fuerzas' },
  { type: 'symptom', text: 'entumecimiento u hormigueo en manos, labios o mejillas' },
  {
    type: 'body',
    text: 'Episodios así a menudo se confunden con problemas del corazón, estómago o presión — y solo más tarde se relacionan con la ansiedad. Cualquier síntoma nuevo, poco habitual o especialmente intenso conviene comentarlo con un médico para descartar otras enfermedades. Marque aquí cada vez durante el día que vuelvan a aparecer síntomas similares.',
  },
];

const PANIC_ATTACK_DAY_INFO_FR: PanicAttackDayInfoLine[] = [
  {
    type: 'body',
    text: 'Une attaque soudaine d\'anxiété intense et de peur écrasante qui atteint son pic en quelques minutes et s\'accompagne de symptômes physiques aigus.',
  },
  {
    type: 'body',
    text: 'Parfois l\'épisode n\'est pas ressenti comme de la peur — le corps réagit d\'abord : des sensations physiques vives qui surviennent soudainement, sans raison apparente.',
  },
  { type: 'lead', text: 'Signes possibles :' },
  { type: 'symptom', text: 'accélération soudaine du pouls' },
  { type: 'symptom', text: 'spasme soudain ou sensation de « vide » sous le sternum et dans le haut de l\'abdomen' },
  { type: 'symptom', text: 'sensation de manque d\'air' },
  { type: 'symptom', text: 'vertige ou légèreté dans la tête' },
  { type: 'symptom', text: 'tremblements dans le corps' },
  { type: 'symptom', text: 'vague soudaine de chaleur ou de froid' },
  { type: 'symptom', text: 'oppression ou sensations désagréables dans la poitrine' },
  { type: 'symptom', text: 'nausées, gargouillements ou inconfort gastrique' },
  { type: 'symptom', text: 'perte soudaine de forces' },
  { type: 'symptom', text: 'engourdissement ou picotements aux mains, lèvres ou joues' },
  {
    type: 'body',
    text: 'De tels épisodes sont souvent pris pour des problèmes cardiaques, gastriques ou de tension — et liés à l\'anxiété seulement plus tard. Tout symptôme nouveau, inhabituel ou particulièrement intense mérite d\'être discuté avec un médecin pour écarter d\'autres maladies. Notez ici chaque fois dans la journée où des symptômes similaires réapparaissent.',
  },
];

const PANIC_ATTACK_DAY_INFO_DE: PanicAttackDayInfoLine[] = [
  {
    type: 'body',
    text: 'Ein plötzlicher Anfall starker Angst und überwältigender Furcht, der innerhalb weniger Minuten seinen Höhepunkt erreicht und von heftigen körperlichen Symptomen begleitet wird.',
  },
  {
    type: 'body',
    text: 'Manchmal wird ein Anfall nicht als Angst erlebt — zuerst reagiert der Körper: heftige körperliche Empfindungen, die plötzlich und ohne erkennbaren Anlass auftreten.',
  },
  { type: 'lead', text: 'Mögliche Anzeichen:' },
  { type: 'symptom', text: 'plötzliche Pulssteigerung' },
  { type: 'symptom', text: 'plötzlicher Krampf oder „Leere“-Gefühl unter dem Brustbein und im oberen Bauch' },
  { type: 'symptom', text: 'Gefühl, nicht genug Luft zu bekommen' },
  { type: 'symptom', text: 'Schwindel oder Leichtigkeit im Kopf' },
  { type: 'symptom', text: 'Zittern im Körper' },
  { type: 'symptom', text: 'plötzliche Hitze- oder Kältewelle' },
  { type: 'symptom', text: 'Engegefühl oder unangenehme Empfindungen in der Brust' },
  { type: 'symptom', text: 'Übelkeit, Magengeräusche oder Magenbeschwerden' },
  { type: 'symptom', text: 'plötzliche Schwäche' },
  { type: 'symptom', text: 'Taubheit oder Kribbeln in Händen, Lippen oder Wangen' },
  {
    type: 'body',
    text: 'Solche Episoden werden oft mit Herz-, Magen- oder Blutdruckproblemen verwechselt — und erst später mit Angst in Verbindung gebracht. Neue, ungewohnte oder besonders starke Symptome sollten dennoch mit einem Arzt besprochen werden, um andere Erkrankungen auszuschließen. Tragen Sie hier jeden Tag ein, wenn ähnliche Symptome erneut auftreten.',
  },
];

const PANIC_ATTACK_DAY_INFO_ZH: PanicAttackDayInfoLine[] = [
  {
    type: 'body',
    text: '突然出现的强烈焦虑与无法抗拒的恐惧发作，在数分钟内达到高峰，并伴有剧烈的身体症状。',
  },
  {
    type: 'body',
    text: '有时发作并不被感受为恐惧——首先是身体反应：突然出现的强烈身体感觉，没有明显诱因。',
  },
  { type: 'lead', text: '可能的迹象：' },
  { type: 'symptom', text: '脉搏突然加快' },
  { type: 'symptom', text: '胸骨下方和上腹部突然痉挛或「空」的感觉' },
  { type: 'symptom', text: '感觉喘不过气' },
  { type: 'symptom', text: '头晕或头部发轻' },
  { type: 'symptom', text: '全身颤抖' },
  { type: 'symptom', text: '突然发热或发冷' },
  { type: 'symptom', text: '胸部压迫感或不适' },
  { type: 'symptom', text: '恶心、肠鸣或胃部不适' },
  { type: 'symptom', text: '突然无力' },
  { type: 'symptom', text: '手、唇或脸颊麻木或刺痛' },
  {
    type: 'body',
    text: '这类发作常被误认为是心脏、胃部或血压问题——往往很久以后才与焦虑联系起来。任何新的、不习惯的或特别严重的表现仍应咨询医生，以排除其他疾病。在此记录当天每次类似症状再次出现的次数。',
  },
];

const PANIC_ATTACK_DAY_INFO_PT: PanicAttackDayInfoLine[] = [
  {
    type: 'body',
    text: 'Um ataque súbito de ansiedade intensa e medo avassalador que atinge o pico em poucos minutos e é acompanhado de sintomas físicos intensos.',
  },
  {
    type: 'body',
    text: 'Às vezes o episódio não é vivido como medo — primeiro reage o corpo: sensações físicas intensas que surgem de repente, sem motivo aparente.',
  },
  { type: 'lead', text: 'Possíveis sinais:' },
  { type: 'symptom', text: 'aumento súbito do pulso' },
  { type: 'symptom', text: 'espasmo repentino ou sensação de «vazio» abaixo do esterno e na parte superior do abdômen' },
  { type: 'symptom', text: 'sensação de falta de ar' },
  { type: 'symptom', text: 'tontura ou leveza na cabeça' },
  { type: 'symptom', text: 'tremor no corpo' },
  { type: 'symptom', text: 'onda repentina de calor ou frio' },
  { type: 'symptom', text: 'aperto ou sensações desagradáveis no peito' },
  { type: 'symptom', text: 'náusea, barulhos ou desconforto no estômago' },
  { type: 'symptom', text: 'perda súbita de forças' },
  { type: 'symptom', text: 'dormência ou formigamento nas mãos, lábios ou bochechas' },
  {
    type: 'body',
    text: 'Episódios assim são frequentemente confundidos com problemas cardíacos, estomacais ou de pressão — e só mais tarde associados à ansiedade. Qualquer sintoma novo, incomum ou especialmente intenso deve ser discutido com um médico para descartar outras doenças. Registre aqui cada vez no dia em que sintomas semelhantes voltarem a aparecer.',
  },
];

const PANIC_ATTACK_DAY_INFO_IT: PanicAttackDayInfoLine[] = [
  {
    type: 'body',
    text: 'Un attacco improvviso di ansia intensa e paura schiacciante che raggiunge il picco in pochi minuti e si accompagna a sintomi fisici acuti.',
  },
  {
    type: 'body',
    text: 'A volte l\'episodio non è vissuto come paura — reagisce prima il corpo: sensazioni fisiche intense che compaiono all\'improvviso, senza un motivo evidente.',
  },
  { type: 'lead', text: 'Possibili segni:' },
  { type: 'symptom', text: 'improvviso aumento del polso' },
  { type: 'symptom', text: 'spasmo improvviso o sensazione di «vuoto» sotto lo sterno e nella parte alta dell\'addome' },
  { type: 'symptom', text: 'sensazione di mancanza d\'aria' },
  { type: 'symptom', text: 'capogiro o leggerezza in testa' },
  { type: 'symptom', text: 'tremore nel corpo' },
  { type: 'symptom', text: 'ondata improvvisa di caldo o freddo' },
  { type: 'symptom', text: 'oppressione o sensazioni sgradevoli al petto' },
  { type: 'symptom', text: 'nausea, brontolii o disagio allo stomaco' },
  { type: 'symptom', text: 'improvvisa perdita di forze' },
  { type: 'symptom', text: 'intorpidimento o formicolio a mani, labbra o guance' },
  {
    type: 'body',
    text: 'Episodi così sono spesso scambiati per problemi cardiaci, gastrici o di pressione — e collegati all\'ansia solo molto dopo. Qualsiasi sintomo nuovo, insolito o particolarmente intenso va comunque discusso con un medico per escludere altre malattie. Segna qui ogni volta durante la giornata in cui sintomi simili ricompaiono.',
  },
];

const PANIC_ATTACK_DAY_INFO_JA: PanicAttackDayInfoLine[] = [
  {
    type: 'body',
    text: '強い不安と抗いがたい恐怖の突然の発作で、数分のうちにピークに達し、急激な身体症状を伴います。',
  },
  {
    type: 'body',
    text: '発作が恐怖として感じられないこともあります——まず反応するのは身体です。明確なきっかけなく、突然現れる鋭い身体的感覚。',
  },
  { type: 'lead', text: '考えられる兆候：' },
  { type: 'symptom', text: '脈拍の突然の上昇' },
  { type: 'symptom', text: '胸骨の下や上腹部に突然のけいれんや「空っぽ」感' },
  { type: 'symptom', text: '息が足りない感覚' },
  { type: 'symptom', text: 'めまいや頭の軽さ' },
  { type: 'symptom', text: '全身の震え' },
  { type: 'symptom', text: '突然の熱気や寒気' },
  { type: 'symptom', text: '胸の圧迫感や不快な感覚' },
  { type: 'symptom', text: '吐き気、腹鳴、胃の不快感' },
  { type: 'symptom', text: '突然の脱力' },
  { type: 'symptom', text: '手、唇、頬のしびれやピリピリ感' },
  {
    type: 'body',
    text: 'こうしたエピソードは、心臓・胃・血圧の問題と誤解されることが多く、不安との関連付けはずっと後になってから行われることもあります。新しい、慣れない、または特に強い症状は、他の疾患を除外するために医師に相談してください。ここで、その日に同様の症状が再び現れた回数を記録してください。',
  },
];

const PANIC_ATTACK_DAY_INFO_KO: PanicAttackDayInfoLine[] = [
  {
    type: 'body',
    text: '강한 불안과 억누를 수 없는 공포의 갑작스러운 발작으로, 몇 분 안에 정점에 이르며 급격한 신체 증상을 동반합니다.',
  },
  {
    type: 'body',
    text: '때로는 발작이 두려움으로 느껴지지 않습니다 — 먼저 반응하는 것은 몸입니다. 분명한 계기 없이 갑자기 나타나는 날카로운 신체 감각.',
  },
  { type: 'lead', text: '가능한 징후:' },
  { type: 'symptom', text: '맥박의 갑작스러운 상승' },
  { type: 'symptom', text: '흉골 아래와 상복부에 갑작스러운 경련이나 「텅 빈」 느낌' },
  { type: 'symptom', text: '숨이 부족한 느낌' },
  { type: 'symptom', text: '어지러움이나 머리가 가벼운 느낌' },
  { type: 'symptom', text: '온몸의 떨림' },
  { type: 'symptom', text: '갑작스러운 열기나 한기' },
  { type: 'symptom', text: '가슴의 답답함이나 불쾌한 감각' },
  { type: 'symptom', text: '메스꺼움, 복명음, 위 불편' },
  { type: 'symptom', text: '갑작스러운 기력 저하' },
  { type: 'symptom', text: '손, 입술, 볼의 저림이나 찌릿함' },
  {
    type: 'body',
    text: '이런 에피소드는 심장, 위, 혈압 문제로 오인되는 경우가 많으며, 불안과 연결짓는 것은 훨씬 나중에 이루어지기도 합니다. 새롭거나 낯선, 특히 심한 증상은 다른 질환을 배제하기 위해 의사와 상담해야 합니다. 하루 동안 비슷한 증상이 다시 나타날 때마다 여기에 기록하세요.',
  },
];

const PANIC_ATTACK_DAY_INFO_BY_LANGUAGE: Record<Language, PanicAttackDayInfoLine[]> = {
  ru: PANIC_ATTACK_DAY_INFO_RU,
  en: PANIC_ATTACK_DAY_INFO_EN,
  es: PANIC_ATTACK_DAY_INFO_ES,
  fr: PANIC_ATTACK_DAY_INFO_FR,
  de: PANIC_ATTACK_DAY_INFO_DE,
  zh: PANIC_ATTACK_DAY_INFO_ZH,
  pt: PANIC_ATTACK_DAY_INFO_PT,
  it: PANIC_ATTACK_DAY_INFO_IT,
  ja: PANIC_ATTACK_DAY_INFO_JA,
  ko: PANIC_ATTACK_DAY_INFO_KO,
};

export function getPanicAttackDayInfoLines(language: Language): PanicAttackDayInfoLine[] {
  return PANIC_ATTACK_DAY_INFO_BY_LANGUAGE[language];
}
