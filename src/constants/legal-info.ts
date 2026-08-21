import type { Language } from '@/constants/i18n';
import { APP_NAME } from '@/constants/brand';

/** Update this when you have a real support address for store listings. */
export const SUPPORT_EMAIL = 'hi.anxiety.support@gmail.com';

const MEDICAL_DISCLAIMER: Record<Language, string> = {
  en: `Medical disclaimer

${APP_NAME} is a personal self-observation diary. It is not a medical device and does not provide diagnosis, treatment, or emergency help.

The app does not replace consultation with a doctor, therapist, or other qualified professional. If you feel unwell or are in crisis, seek professional help immediately.`,

  ru: `Медицинский дисклеймер

${APP_NAME} — личный дневник самонаблюдения. Это не медицинское изделие и не замена диагностики, лечения или экстренной помощи.

Приложение не заменяет консультацию врача, терапевта или другого специалиста. Если вам плохо или вы в кризисе, сразу обратитесь за профессиональной помощью.`,

  es: `Aviso médico

${APP_NAME} es un diario personal de autoobservación. No es un dispositivo médico y no diagnostica, trata ni presta ayuda de emergencia.

La app no sustituye la consulta con un médico, terapeuta u otro profesional cualificado. Si se siente mal o está en crisis, busque ayuda profesional de inmediato.`,

  fr: `Avertissement médical

${APP_NAME} est un journal personnel d’auto-observation. Ce n’est pas un dispositif médical et il ne propose ni diagnostic, ni traitement, ni aide d’urgence.

L’application ne remplace pas une consultation avec un médecin, un thérapeute ou un autre professionnel qualifié. En cas de malaise ou de crise, demandez immédiatement une aide professionnelle.`,

  de: `Medizinischer Hinweis

${APP_NAME} ist ein persönliches Beobachtungstagebuch. Es ist kein Medizinprodukt und stellt keine Diagnose, Behandlung oder Notfallhilfe bereit.

Die App ersetzt keinen Arzt, Therapeuten oder anderen Fachmann. Wenn Sie sich schlecht fühlen oder in einer Krise sind, suchen Sie sofort professionelle Hilfe.`,

  zh: `医疗免责声明

${APP_NAME} 是个人自我观察日记。它不是医疗器械，不提供诊断、治疗或紧急救助。

本应用不能替代医生、治疗师或其他专业人士的建议。如感到不适或处于危机中，请立即寻求专业帮助。`,

  pt: `Aviso médico

${APP_NAME} é um diário pessoal de auto-observação. Não é um dispositivo médico e não oferece diagnóstico, tratamento ou ajuda de emergência.

O app não substitui consulta com médico, terapeuta ou outro profissional qualificado. Se estiver mal ou em crise, procure ajuda profissional imediatamente.`,

  it: `Avvertenza medica

${APP_NAME} è un diario personale di auto-osservazione. Non è un dispositivo medico e non fornisce diagnosi, trattamento o aiuto di emergenza.

L’app non sostituisce il consulto di un medico, terapeuta o altro professionista qualificato. Se ti senti male o sei in crisi, cerca subito aiuto professionale.`,

  ja: `医療に関する免責事項

${APP_NAME} は個人のセルフ観察日記です。医療機器ではなく、診断・治療・緊急支援は行いません。

本アプリは医師・セラピスト等の専門家の相談に代わるものではありません。体調不良や危機の際は、すぐに専門家の助けを求めてください。`,

  ko: `의료 면책 고지

${APP_NAME}는 개인 자기관찰 일기입니다. 의료기기가 아니며 진단, 치료, 응급 지원을 제공하지 않습니다.

앱은 의사, 치료사 또는 기타 전문가 상담을 대체하지 않습니다. 몸이 좋지 않거나 위기 상황이면 즉시 전문가의 도움을 받으세요.`,
};

const PRIVACY_POLICY: Record<Language, string> = {
  en: `Privacy Policy

Last updated: August 2026

${APP_NAME} is designed to keep your diary private on your device.

What we store
Diary entries (medications, sleep, triggers, activity, notes, and related settings) are saved locally on your phone or tablet. The app does not create an account and does not send your diary to our servers.

Notifications
If you enable reminders, the operating system may schedule local notifications on your device. Notification content is generated on the device and is not uploaded by the app.

Sharing
If you export a weekly PDF or use the system share sheet, the file leaves the app only when you choose to share or save it yourself.

Permissions
The app may ask for notification permission (reminders) and may use audio for optional calming sounds. These features work on device.

Data deletion
Uninstalling the app deletes local diary data stored by the app on that device (subject to your device backup settings).

Contact
Questions about privacy: ${SUPPORT_EMAIL}`,

  ru: `Политика конфиденциальности

Обновлено: август 2026

${APP_NAME} хранит дневник приватно на вашем устройстве.

Что сохраняется
Записи дневника (лекарства, сон, триггеры, активность, заметки и связанные настройки) хранятся локально на телефоне или планшете. Приложение не создаёт аккаунт и не отправляет дневник на наши серверы.

Уведомления
Если включены напоминания, система может планировать локальные уведомления на устройстве. Текст уведомлений формируется на устройстве и приложением не загружается.

Обмен файлами
Если вы экспортируете PDF недели или используете системный «Поделиться», файл покидает приложение только когда вы сами решаете им поделиться или сохранить.

Разрешения
Приложение может запросить разрешение на уведомления (напоминания) и использовать звук для опциональных успокаивающих эффектов. Эти функции работают на устройстве.

Удаление данных
Удаление приложения удаляет локальные данные дневника на этом устройстве (с учётом настроек резервного копирования устройства).

Контакт
Вопросы о конфиденциальности: ${SUPPORT_EMAIL}`,

  es: `Política de privacidad

Actualizado: agosto de 2026

${APP_NAME} guarda su diario de forma privada en el dispositivo.

Qué se almacena
Las entradas (medicamentos, sueño, disparadores, actividad, notas y ajustes) se guardan localmente. La app no crea cuenta ni envía el diario a nuestros servidores.

Notificaciones
Si activa recordatorios, el sistema puede programar notificaciones locales. El contenido se genera en el dispositivo.

Compartir
Si exporta un PDF semanal o usa «Compartir», el archivo sale de la app solo cuando usted lo decide.

Permisos
Puede solicitar permiso de notificaciones y usar audio para sonidos opcionales.

Eliminación
Desinstalar la app elimina los datos locales de esa instalación (según la copia de seguridad del dispositivo).

Contacto
Privacidad: ${SUPPORT_EMAIL}`,

  fr: `Politique de confidentialité

Mise à jour : août 2026

${APP_NAME} conserve votre journal en privé sur l’appareil.

Données
Les entrées (médicaments, sommeil, déclencheurs, activité, notes et réglages) sont stockées localement. Pas de compte, pas d’envoi du journal vers nos serveurs.

Notifications
Les rappels utilisent des notifications locales générées sur l’appareil.

Partage
L’export PDF / partage système ne quitte l’app que si vous le choisissez.

Permissions
Notifications et audio optionnel pour des sons apaisants.

Suppression
Désinstaller l’app supprime les données locales de cette installation (selon les sauvegardes de l’appareil).

Contact
Confidentialité : ${SUPPORT_EMAIL}`,

  de: `Datenschutzrichtlinie

Stand: August 2026

${APP_NAME} speichert Ihr Tagebuch privat auf dem Gerät.

Speicherung
Einträge (Medikamente, Schlaf, Auslöser, Aktivität, Notizen und Einstellungen) bleiben lokal. Kein Konto, kein Upload zu unseren Servern.

Benachrichtigungen
Erinnerungen nutzen lokale Systembenachrichtigungen auf dem Gerät.

Teilen
PDF-Export / Teilen verlässt die App nur, wenn Sie das selbst auslösen.

Berechtigungen
Benachrichtigungen und optional Audio für beruhigende Klänge.

Löschung
Deinstallation entfernt lokale App-Daten auf diesem Gerät (abhängig von Geräte-Backups).

Kontakt
Datenschutz: ${SUPPORT_EMAIL}`,

  zh: `隐私政策

更新日期：2026年8月

${APP_NAME} 将日记私密保存在您的设备上。

存储内容
日记条目（药物、睡眠、触发因素、活动、笔记及相关设置）仅保存在本机。应用不创建账户，也不会将日记上传到我们的服务器。

通知
若开启提醒，系统可能在本机安排本地通知。通知内容在设备上生成。

分享
导出周报 PDF 或使用系统分享时，仅在您主动操作后文件才会离开应用。

权限
可能请求通知权限，并可选使用音频播放安抚音效。

删除数据
卸载应用会删除该设备上的本地日记数据（取决于设备备份设置）。

联系
隐私相关：${SUPPORT_EMAIL}`,

  pt: `Política de privacidade

Atualizado: agosto de 2026

${APP_NAME} mantém o diário privado no dispositivo.

Armazenamento
As entradas (medicamentos, sono, gatilhos, atividade, notas e ajustes) ficam locais. Sem conta e sem envio do diário aos nossos servidores.

Notificações
Lembretes usam notificações locais geradas no dispositivo.

Partilha
Exportar PDF / partilhar só sai da app quando você decide.

Permissões
Notificações e áudio opcional para sons calmantes.

Eliminação
Desinstalar remove os dados locais dessa instalação (conforme backups do dispositivo).

Contacto
Privacidade: ${SUPPORT_EMAIL}`,

  it: `Informativa sulla privacy

Aggiornato: agosto 2026

${APP_NAME} conserva il diario in privato sul dispositivo.

Dati
Le voci (farmaci, sonno, trigger, attività, note e impostazioni) restano locali. Nessun account, nessun invio ai nostri server.

Notifiche
I promemoria usano notifiche locali generate sul dispositivo.

Condivisione
L’export PDF / condivisione esce dall’app solo se lo scegli tu.

Permessi
Notifiche e audio opzionale per suoni calmanti.

Cancellazione
Disinstallare rimuove i dati locali di questa installazione (in base ai backup del dispositivo).

Contatto
Privacy: ${SUPPORT_EMAIL}`,

  ja: `プライバシーポリシー

更新：2026年8月

${APP_NAME} は日記を端末内で非公開に保ちます。

保存内容
日記（服薬、睡眠、トリガー、活動、メモ、設定）は端末にのみ保存されます。アカウント作成や当社サーバーへの送信はありません。

通知
リマインダーは端末上のローカル通知を使います。

共有
週次 PDF の書き出しやシステムの共有は、あなたが操作したときだけアプリ外に出ます。

権限
通知、および任意のリラックス音のための音声を使う場合があります。

削除
アプリ削除で、その端末上のローカル日記データは削除されます（端末バックアップ設定による）。

連絡先
プライバシー：${SUPPORT_EMAIL}`,

  ko: `개인정보 처리방침

업데이트: 2026년 8월

${APP_NAME}는 일기를 기기에 비공개로 보관합니다.

저장 내용
일기(복약, 수면, 유발 요인, 활동, 메모, 설정)는 기기에만 저장됩니다. 계정 생성이나 서버 전송은 없습니다.

알림
알림은 기기 로컬 알림을 사용합니다.

공유
주간 PDF보내기/시스템 공유는 사용자가 선택할 때만 앱 밖으로 나갑니다.

권한
알림 권한과 선택적 안정 음원 재생을 위한 오디오를 사용할 수 있습니다.

삭제
앱 삭제 시 해당 기기의 로컬 일기 데이터가 삭제됩니다(기기 백업 설정에 따름).

문의
개인정보: ${SUPPORT_EMAIL}`,
};

const SUPPORT_INFO: Record<Language, string> = {
  en: `Support

Need help with ${APP_NAME}?

Email: ${SUPPORT_EMAIL}

You can also contact us through the App Store or Google Play listing for ${APP_NAME}.

Before writing, it helps to include:
• your device model and OS version
• a short description of what happened
• screenshots if useful

We read support messages as soon as we can.`,

  ru: `Поддержка

Нужна помощь с ${APP_NAME}?

Email: ${SUPPORT_EMAIL}

Также можно написать через страницу приложения в App Store или Google Play.

В письме полезно указать:
• модель устройства и версию ОС
• коротко, что произошло
• скриншоты, если помогают

Мы отвечаем на сообщения поддержки как можно скорее.`,

  es: `Soporte

¿Necesita ayuda con ${APP_NAME}?

Email: ${SUPPORT_EMAIL}

También puede contactarnos desde la ficha de App Store o Google Play.

Incluya si puede:
• modelo del dispositivo y versión del sistema
• breve descripción del problema
• capturas si ayudan

Respondemos lo antes posible.`,

  fr: `Assistance

Besoin d’aide avec ${APP_NAME} ?

Email : ${SUPPORT_EMAIL}

Vous pouvez aussi nous écrire via la fiche App Store ou Google Play.

Indiquez si possible :
• modèle et version du système
• courte description
• captures d’écran utiles

Nous répondons dès que possible.`,

  de: `Support

Brauchst du Hilfe mit ${APP_NAME}?

E-Mail: ${SUPPORT_EMAIL}

Kontakt auch über die App-Store- oder Google-Play-Seite möglich.

Hilfreich:
• Gerätemodell und Systemversion
• kurze Beschreibung
• Screenshots falls sinnvoll

Wir antworten so schnell wie möglich.`,

  zh: `支持

需要 ${APP_NAME} 的帮助？

邮箱：${SUPPORT_EMAIL}

也可通过 App Store 或 Google Play 页面联系我们。

请尽量说明：
• 设备型号与系统版本
• 问题简要描述
• 如有帮助请附截图

我们会尽快回复。`,

  pt: `Suporte

Precisa de ajuda com ${APP_NAME}?

Email: ${SUPPORT_EMAIL}

Também pode contactar-nos pela página da App Store ou Google Play.

Inclua se possível:
• modelo e versão do sistema
• breve descrição
• capturas úteis

Respondemos o mais rápido possível.`,

  it: `Supporto

Serve aiuto con ${APP_NAME}?

Email: ${SUPPORT_EMAIL}

Puoi anche scriverci dalla scheda App Store o Google Play.

Utile includere:
• modello e versione del sistema
• breve descrizione
• screenshot se utili

Rispondiamo il prima possibile.`,

  ja: `サポート

${APP_NAME} のサポートが必要ですか？

メール：${SUPPORT_EMAIL}

App Store / Google Play のページからも連絡できます。

可能なら次を書いてください：
• 端末モデルと OS バージョン
• 状況の短い説明
• 必要ならスクリーンショット

できるだけ早く返信します。`,

  ko: `지원

${APP_NAME} 도움이 필요하신가요?

이메일: ${SUPPORT_EMAIL}

App Store 또는 Google Play 페이지로도 문의할 수 있습니다.

가능하면 다음을 적어 주세요:
• 기기 모델과 OS 버전
• 짧은 상황 설명
• 도움이 되면 스크린샷

가능한 빨리 답변드립니다.`,
};

const MEDICAL_DISCLAIMER_TITLES = new Set([
  'Medical disclaimer',
  'Медицинский дисклеймер',
  'Aviso médico',
  'Avertissement médical',
  'Medizinischer Hinweis',
  '医疗免责声明',
  'Avvertenza medica',
  '医療に関する免責事項',
  '의료 면책 고지',
]);

export function getMedicalDisclaimerText(language: Language): string {
  return MEDICAL_DISCLAIMER[language] ?? MEDICAL_DISCLAIMER.en;
}

export function getPrivacyPolicyText(language: Language): string {
  return PRIVACY_POLICY[language] ?? PRIVACY_POLICY.en;
}

export function getSupportInfoText(language: Language): string {
  return SUPPORT_INFO[language] ?? SUPPORT_INFO.en;
}

export function isLegalSectionTitle(paragraph: string): boolean {
  const trimmed = paragraph.trim();
  return MEDICAL_DISCLAIMER_TITLES.has(trimmed);
}
