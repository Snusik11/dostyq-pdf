import { en } from '@/shared/i18n/en';
import type { TranslationValue } from '@/shared/i18n/types';

/**
 * Kazakh dictionary — the app's default locale when the browser language is
 * Kazakh (see `LocaleProvider`). `satisfies Record<keyof typeof en,
 * TranslationValue>` makes a missing key a COMPILE error: every key `en`
 * defines must exist here too.
 *
 * Tone: polite "сіз"-form, short button labels, aimed at school students.
 * Technical names (PDF, A4, Letter, Legal, Oficio, Eco, ID) stay as they are.
 * Kazakh nouns stay singular after a numeral ("3 бет"), so plural entries use
 * the same text for `one` and `other`.
 *
 * NOTE: machine-assisted draft — has to be reviewed by a native speaker
 * before the public release.
 */
export const kk = {
  'common.back': 'Артқа',
  'common.close': 'Жабу',
  'common.processing': 'Өңделуде…',
  'common.documentLimitReached': 'Құжат шегіне жетті ({cap} бет).',

  'lang.toggle': 'Тілді ауыстыру',

  'welcome.cta': 'Құжатты сканерлеу',
  'welcome.openCamera': 'Сканерлеу',
  'welcome.hint': 'Басқанда камера бірден ашылады',
  'welcome.sourceCode': 'Ашық код · AGPL-3.0',

  'scanner.openScanner': 'Сканерді ашу',
  'scanner.cameraError': 'Камераны ашу мүмкін болмады. Қайталап көріңіз немесе галереядан фото таңдаңыз.',
  'scanner.loading': 'Жүктелуде…',
  'scanner.scanComplete': { one: 'Сканерлеу аяқталды — {n} бет.', other: 'Сканерлеу аяқталды — {n} бет.' },
  'scanner.scanAnother': 'Басқа құжатты сканерлеу',
  'scanner.couldNotReadImage': 'Таңдалған фотоны оқу мүмкін болмады.',
  'scanner.toggleTorch': 'Жарықты қосу немесе өшіру',
  'scanner.exportPdf': 'PDF сақтау',
  'scanner.exporting': 'Сақталуда…',
  'scanner.exportPdfError': 'PDF сақтау мүмкін болмады.',

  'editor.cornerHandle': '{n}-бұрыш',
  'editor.moveTopEdge': 'Жоғарғы жиекті жылжыту',
  'editor.moveRightEdge': 'Оң жиекті жылжыту',
  'editor.moveBottomEdge': 'Төменгі жиекті жылжыту',
  'editor.moveLeftEdge': 'Сол жиекті жылжыту',
  'editor.convexWarning': 'Бұрыштар дөңес фигура құруы керек. Жалғастыру үшін бұрыштардың бірін жылжытыңыз.',
  'editor.rotate': '90° бұру',
  'editor.flipHorizontal': 'Көлденең айналдыру',
  'editor.processError': 'Фотоны өңдеу мүмкін болмады. Бұрышты жылжытып, қайталап көріңіз.',
  'editor.back': 'Артқа',
  'editor.next': 'Әрі қарай',
  'editor.confirm': 'Растау',
  'editor.aspectA4': 'A4',
  'editor.aspectLetter': 'Letter',
  'editor.aspectTicket': 'Чек',
  'editor.aspectOriginal': 'Түпнұсқа',

  'adjust.retake': 'Қайта түсіру',
  'adjust.rotateLeft': 'Солға',
  'adjust.crop': 'Қию',
  'adjust.next': 'Әрі қарай',
  'adjust.addMore': 'Тағы қосу',
  'adjust.prevPage': 'Алдыңғы бет',
  'adjust.nextPage': 'Келесі бет',
  'adjust.cropChip': 'Жиектерді түзету',
  'adjust.cropDone': 'Дайын',
  'adjust.cropCancel': 'Бас тарту',

  'paper.format': 'Қағаз форматы',
  'paper.detected': 'Анықталды: {format} ({confidence})',
  'paper.manual': 'Қолмен: {format}',
  'paper.clearToAuto': 'Анықталған форматты қолдану',
  'paper.confidenceHigh': 'жоғары сенімділік',
  'paper.confidenceMedium': 'орташа сенімділік',
  'paper.confidenceLow': 'төмен сенімділік',
  'paper.confidenceNone': 'сенімсіз',
  'paper.a4': 'A4',
  'paper.a4Probable': 'Мүмкін, A4',
  'paper.letter': 'Letter',
  'paper.legal': 'Legal',
  'paper.oficio': 'Oficio',
  'paper.ticket': 'Чек',
  'paper.original': 'Түпнұсқа',

  'filter.title': 'Сүзгілер',
  'filter.presetOriginal': 'Түпнұсқа',
  'filter.presetEnhanced': 'Жақсартылған',
  'filter.presetGrayscale': 'Сұр',
  'filter.presetBw': 'Ақ-қара',
  'filter.presetBwHighContrast': 'Ақ-қара, жоғары контраст',
  'filter.presetEco': 'Эко',
  'filter.brightness': 'Жарықтық',
  'filter.contrast': 'Контраст',
  'filter.sharpness': 'Айқындық',
  'filter.applyToAll': 'Барлық беттерге қолдану',
  'filter.applyToAllConfirmText': 'Бұл сүзгіні барлық беттерге қолдану керек пе? Жеке сүзгілер қайта жазылады.',
  'filter.cancel': 'Бас тарту',
  'filter.applyToAllConfirmButton': 'Барлығына қолдану',

  'capture.pagesCaptured': { one: '{n} бет түсірілді', other: '{n} бет түсірілді' },
  'capture.done': 'Дайын',
  'capture.captureDocument': 'Құжатты түсіру',
  'capture.pageRemoved': 'Бет жойылды.',
  'capture.undo': 'Қайтару',
  'capture.next': 'Әрі қарай',
  'capture.retakeLast': 'Соңғы кадрды қайта түсіру',
  'capture.captureFailed': 'Бетті түсіру мүмкін болмады. Қайталап көріңіз.',
  'capture.importAnother': 'Тағы фото таңдау',
  'capture.paperFormat': 'Қағаз өлшемі',
  'capture.paperGuide': '{format} форматына арналған жақтау',
  'capture.paperA4A3': 'A4 / A3',
  'capture.paperOficio': 'Oficio',
  'capture.paperLetter': 'Letter',
  'capture.paperLegal': 'Legal',
  'capture.paperTicket': 'Карта / ID',
  'capture.paperOriginal': 'Еркін',

  'processing.title': 'Беттер өңделуде…',
  'processing.subtitle': 'Жиектерді іздеп, перспективаны түзетудеміз',
  'processing.progress': '{total} ішінен {done}',
  'processing.failedPages': 'Бірде-бір бетті өңдеу мүмкін болмады. Қайталап көріңіз.',
  'processing.cancel': 'Бас тарту',

  'grid.title': 'Құжат',
  'grid.pageCount': { one: '{n} бет', other: '{n} бет' },
  'grid.reorderHint': 'Ретін өзгерту үшін тұтқаны сүйреңіз',
  'grid.reorder': 'Бетті жылжыту',
  'grid.pagesCaptured': { one: '{n} бет түсірілді.', other: '{n} бет түсірілді.' },
  'grid.captureMore': 'Тағы түсіру',
  // "Дайын" rather than "Аяқтау": this screen reviews the document, it does not
  // end the flow — the done screen after it still offers view/export.
  'grid.finish': 'Дайын',
  'grid.deletePage': 'Бетті жою',
  'grid.needsReview': 'Тексеру',
  'grid.editPage': 'Бетті өңдеу',
  'grid.emptyCta': 'Түсіру',

  'done.title': 'Құжат дайын!',
  'done.pagesScanned': { one: '{n} бет сканерленді', other: '{n} бет сканерленді' },

  'import.instructionsFirefox':
    'Мекенжай жолындағы құлып белгішесін басып, камераға рұқсат беріңіз де, бетті қайта жүктеңіз.',
  'import.instructionsLockIcon':
    'Мекенжай жолындағы құлып немесе «i» белгішесін басып, камераға рұқсат беріңіз де, бетті қайта жүктеңіз.',
  'import.instructionsSafari':
    'Safari «Параметрлері» → «Веб-сайттар» → «Камера» бөліміне өтіп, осы сайтқа рұқсат беріңіз де, бетті қайта жүктеңіз.',
  'import.cameraAccessDenied': 'Камераға рұқсат берілмеді.',
  'import.noCameraDetected':
    'Бұл құрылғыдан камера табылмады. Дегенмен галереядан фото таңдап, құжатты сканерлеуге болады.',
  'import.importImage': 'Фото таңдау',
  'import.importADocumentImage': 'Құжат фотосын таңдау',
  'import.processingStatus': 'Таңдалған фото өңделуде, күте тұрыңыз.',

  'opencv.unavailable':
    'Құжатты тану қазір қолжетімсіз{error}. Дегенмен суретке түсіріп, бұрыштарын қолмен түзетуге болады.',
  'opencv.retry': 'Қайталау',

  'camera.selectCamera': 'Камераны таңдау',
  'camera.cameraN': '{n}-камера',

  'install.cta': 'Қолданбаны орнату',
  'install.iosTitle': 'Dostyq PDF-ті iPhone-ға орнатыңыз',
  'install.iosStep1': 'Safari панеліндегі «Бөлісу» түймесін басыңыз.',
  'install.iosStep2': '«Басты экранға қосу» тармағын таңдап, растаңыз.',
  'install.iosHint': 'Dostyq PDF басқа қолданбалар сияқты басты экранда пайда болады: App Store-сыз, аккаунтсыз.',

  'viewer.title': 'Құжатты қарау',
  'viewer.open': 'Құжатты ашу',
  'viewer.position': '{total} ішінен {current}',
  'viewer.pageAlt': '{n}-бет',
  'viewer.previous': 'Алдыңғы бет',
  'viewer.next': 'Келесі бет',
  'viewer.renderError': 'Бұл бетті көрсету мүмкін болмады.',

  'done.keep': 'Аяқтау',
  'done.keepHint': '«Менің сканерлерім» бөлімінде сақталды, оны кез келген уақытта қайта аша аласыз.',

  'history.title': 'Менің сканерлерім',
  'history.open': 'Тарихты ашу',
  'history.back': 'Артқа',
  'history.documentTitle': '{date} сканері',
  'history.pageCount': { one: '{n} бет', other: '{n} бет' },
  'history.openDocument': 'Ашу',
  'history.deleteDocument': 'Жою',
  'history.pin': 'Бұл сканерді сақтап қою',
  'history.unpin': 'Бұл сканерді сақтап қоюды тоқтату',
  'history.pinned': 'Сақталған',
  'history.empty': 'Сақталған сканерлер әлі жоқ',
  'history.emptyHint':
    'Құжатты тексергеннен кейін «Дайын» түймесін басқанда, сканерлер осында автоматты түрде сақталады.',
  'history.loading': 'Сканерлеріңіз жүктелуде…',
  'history.usage': '{total} ішінен {used} толды',
  'history.saveError': 'Сканерді тарихқа сақтау мүмкін болмады.',
  'history.saveQuotaError': 'Бұл сканерді сақтауға орын жеткіліксіз. Ескі сканерлерді жойып, қайталап көріңіз.',
  'history.openError': 'Бұл сканерді ашу мүмкін болмады.',
  'history.unavailable': 'Браузеріңізде сақтау қоймасы өшірулі, сондықтан сканерлерді сақтау мүмкін емес.',
  'history.restoredNotice':
    'Тарихтан қалпына келтірілді: енді қию парақты қайта іздемей, түзетілген бетті қияды.',
} satisfies Record<keyof typeof en, TranslationValue>;
