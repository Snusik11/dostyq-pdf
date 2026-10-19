import { en } from '@/shared/i18n/en';
import type { TranslationValue } from '@/shared/i18n/types';

/**
 * Russian dictionary — the app's default locale when the browser language is
 * not Kazakh (see `LocaleProvider`). `satisfies Record<keyof typeof en,
 * TranslationValue>` makes a missing key a COMPILE error: every key `en`
 * defines must exist here too.
 *
 * Tone: "вы"-form, short imperative button labels, aimed at school students.
 * Technical names (PDF, A4, Letter, Legal, Oficio, Eco, ID) stay as they are.
 * Plural entries define `one` / `few` / `many` (CLDR rules for Russian);
 * `other` only covers fractions.
 */
export const ru = {
  'common.back': 'Назад',
  'common.close': 'Закрыть',
  'common.processing': 'Обработка…',
  'common.documentLimitReached': 'Достигнут лимит документа ({cap} стр.).',

  'lang.toggle': 'Сменить язык',

  'welcome.cta': 'Сканировать документ',
  'welcome.openCamera': 'Сканировать',
  'welcome.hint': 'По нажатию сразу откроется камера',
  'welcome.sourceCode': 'Открытый код · AGPL-3.0',

  'scanner.openScanner': 'Открыть сканер',
  'scanner.cameraError': 'Не удалось открыть камеру. Попробуйте ещё раз или выберите фото из галереи.',
  'scanner.loading': 'Загрузка…',
  'scanner.scanComplete': {
    one: 'Сканирование завершено — {n} страница.',
    few: 'Сканирование завершено — {n} страницы.',
    many: 'Сканирование завершено — {n} страниц.',
    other: 'Сканирование завершено — {n} страницы.',
  },
  'scanner.scanAnother': 'Сканировать другой документ',
  'scanner.couldNotReadImage': 'Не удалось прочитать выбранное фото.',
  'scanner.toggleTorch': 'Включить или выключить фонарик',
  'scanner.exportPdf': 'Сохранить PDF',
  'scanner.exporting': 'Сохранение…',
  'scanner.exportPdfError': 'Не удалось сохранить PDF.',

  'editor.cornerHandle': 'Угол {n}',
  'editor.moveTopEdge': 'Сдвинуть верхний край',
  'editor.moveRightEdge': 'Сдвинуть правый край',
  'editor.moveBottomEdge': 'Сдвинуть нижний край',
  'editor.moveLeftEdge': 'Сдвинуть левый край',
  'editor.convexWarning': 'Углы должны образовывать выпуклую фигуру. Сдвиньте один из углов, чтобы продолжить.',
  'editor.rotate': 'Повернуть на 90°',
  'editor.flipHorizontal': 'Отразить по горизонтали',
  'editor.processError': 'Не удалось обработать фото. Сдвиньте угол и попробуйте снова.',
  'editor.back': 'Назад',
  'editor.next': 'Далее',
  'editor.confirm': 'Подтвердить',
  'editor.aspectA4': 'A4',
  'editor.aspectLetter': 'Letter',
  'editor.aspectTicket': 'Чек',
  'editor.aspectOriginal': 'Оригинал',

  'adjust.retake': 'Переснять',
  'adjust.rotateLeft': 'Влево',
  'adjust.crop': 'Обрезка',
  'adjust.next': 'Далее',
  'adjust.addMore': 'Добавить ещё',
  'adjust.prevPage': 'Предыдущая страница',
  'adjust.nextPage': 'Следующая страница',
  'adjust.cropChip': 'Подправить края',
  'adjust.cropDone': 'Готово',
  'adjust.cropCancel': 'Отмена',

  'paper.format': 'Формат бумаги',
  'paper.detected': 'Определён: {format} ({confidence})',
  'paper.manual': 'Вручную: {format}',
  'paper.clearToAuto': 'Использовать определённый формат',
  'paper.confidenceHigh': 'высокая уверенность',
  'paper.confidenceMedium': 'средняя уверенность',
  'paper.confidenceLow': 'низкая уверенность',
  'paper.confidenceNone': 'не уверен',
  'paper.a4': 'A4',
  'paper.a4Probable': 'Вероятно, A4',
  'paper.letter': 'Letter',
  'paper.legal': 'Legal',
  'paper.oficio': 'Oficio',
  'paper.ticket': 'Чек',
  'paper.original': 'Оригинал',

  'filter.title': 'Фильтры',
  'filter.presetOriginal': 'Оригинал',
  'filter.presetEnhanced': 'Улучшенный',
  'filter.presetGrayscale': 'Серый',
  'filter.presetBw': 'Ч/Б',
  'filter.presetBwHighContrast': 'Ч/Б, высокий контраст',
  'filter.presetEco': 'Эко',
  'filter.brightness': 'Яркость',
  'filter.contrast': 'Контраст',
  'filter.sharpness': 'Резкость',
  'filter.applyToAll': 'Применить ко всем страницам',
  'filter.applyToAllConfirmText':
    'Применить этот фильтр ко всем страницам? Индивидуальные фильтры будут перезаписаны.',
  'filter.cancel': 'Отмена',
  'filter.applyToAllConfirmButton': 'Применить ко всем',

  'capture.pagesCaptured': {
    one: '{n} страница снята',
    few: '{n} страницы сняты',
    many: '{n} страниц снято',
    other: '{n} страницы снято',
  },
  'capture.done': 'Готово',
  'capture.captureDocument': 'Снять документ',
  'capture.pageRemoved': 'Страница удалена.',
  'capture.undo': 'Отменить',
  'capture.next': 'Далее',
  'capture.retakeLast': 'Переснять последний кадр',
  'capture.captureFailed': 'Не удалось снять страницу. Попробуйте ещё раз.',
  'capture.importAnother': 'Выбрать ещё фото',
  'capture.paperFormat': 'Размер бумаги',
  'capture.paperGuide': 'Рамка для формата {format}',
  'capture.paperA4A3': 'A4 / A3',
  'capture.paperOficio': 'Oficio',
  'capture.paperLetter': 'Letter',
  'capture.paperLegal': 'Legal',
  'capture.paperTicket': 'Карта / ID',
  'capture.paperOriginal': 'Свободно',

  'processing.title': 'Обрабатываем страницы…',
  'processing.subtitle': 'Ищем края и выравниваем перспективу',
  'processing.progress': '{done} из {total}',
  'processing.failedPages': 'Не удалось обработать ни одной страницы. Попробуйте ещё раз.',
  'processing.cancel': 'Отмена',

  'grid.title': 'Документ',
  'grid.pageCount': {
    one: '{n} страница',
    few: '{n} страницы',
    many: '{n} страниц',
    other: '{n} страницы',
  },
  'grid.reorderHint': 'Перетащите ручку, чтобы поменять порядок',
  'grid.reorder': 'Переместить страницу',
  'grid.pagesCaptured': {
    one: '{n} страница снята.',
    few: '{n} страницы сняты.',
    many: '{n} страниц снято.',
    other: '{n} страницы снято.',
  },
  'grid.captureMore': 'Снять ещё',
  // "Готово" rather than "Завершить": this screen reviews the document, it does
  // not end the flow — the done screen after it still offers view/export.
  'grid.finish': 'Готово',
  'grid.deletePage': 'Удалить страницу',
  'grid.needsReview': 'Проверить',
  'grid.editPage': 'Править страницу',
  'grid.emptyCta': 'Снять',

  'done.title': 'Документ готов!',
  'done.pagesScanned': {
    one: '{n} страница отсканирована',
    few: '{n} страницы отсканированы',
    many: '{n} страниц отсканировано',
    other: '{n} страницы отсканировано',
  },

  'import.instructionsFirefox':
    'Нажмите на значок замка в адресной строке, разрешите доступ к камере и перезагрузите страницу.',
  'import.instructionsLockIcon':
    'Нажмите на значок замка или «i» в адресной строке, разрешите доступ к камере и перезагрузите страницу.',
  'import.instructionsSafari':
    'Откройте «Настройки» Safari → «Веб-сайты» → «Камера», разрешите доступ для этого сайта и перезагрузите страницу.',
  'import.cameraAccessDenied': 'Доступ к камере запрещён.',
  'import.noCameraDetected':
    'На этом устройстве камера не найдена. Вы всё равно можете отсканировать документ, выбрав фото из галереи.',
  'import.importImage': 'Выбрать фото',
  'import.importADocumentImage': 'Выбрать фото документа',
  'import.processingStatus': 'Обрабатываем выбранное фото, подождите.',

  'opencv.unavailable':
    'Распознавание документа сейчас недоступно{error}. Вы всё равно можете сделать снимок и подправить углы вручную.',
  'opencv.retry': 'Повторить',

  'camera.selectCamera': 'Выбрать камеру',
  'camera.cameraN': 'Камера {n}',

  'install.cta': 'Установить приложение',
  'install.iosTitle': 'Установите Dostyq PDF на iPhone',
  'install.iosStep1': 'Нажмите кнопку «Поделиться» на панели Safari.',
  'install.iosStep2': 'Выберите «На экран “Домой”» и подтвердите.',
  'install.iosHint': 'Dostyq PDF появится на домашнем экране, как обычное приложение: без App Store и без аккаунта.',

  'viewer.title': 'Просмотр документа',
  'viewer.open': 'Открыть документ',
  'viewer.position': '{current} из {total}',
  'viewer.pageAlt': 'Страница {n}',
  'viewer.previous': 'Предыдущая страница',
  'viewer.next': 'Следующая страница',
  'viewer.renderError': 'Не удалось показать эту страницу.',

  'done.keep': 'Завершить',
  'done.keepHint': 'Сохранено в «Мои сканы», его можно открыть снова в любой момент.',

  'history.title': 'Мои сканы',
  'history.open': 'Открыть историю',
  'history.back': 'Назад',
  'history.documentTitle': 'Скан {date}',
  'history.pageCount': {
    one: '{n} страница',
    few: '{n} страницы',
    many: '{n} страниц',
    other: '{n} страницы',
  },
  'history.openDocument': 'Открыть',
  'history.deleteDocument': 'Удалить',
  'history.pin': 'Оставить этот скан',
  'history.unpin': 'Больше не хранить этот скан',
  'history.pinned': 'Сохранён',
  'history.empty': 'Сохранённых сканов пока нет',
  'history.emptyHint': 'Сканы сохраняются здесь автоматически, когда вы нажимаете «Готово» после проверки документа.',
  'history.loading': 'Загружаем ваши сканы…',
  'history.usage': 'Занято {used} из {total}',
  'history.saveError': 'Не удалось сохранить скан в историю.',
  'history.saveQuotaError': 'Не хватает места, чтобы сохранить этот скан. Удалите старые сканы и попробуйте снова.',
  'history.openError': 'Не удалось открыть этот скан.',
  'history.unavailable': 'В вашем браузере отключено хранилище, поэтому сканы сохранить нельзя.',
  'history.restoredNotice':
    'Восстановлено из истории: теперь обрезка подрезает уже выровненную страницу, а не ищет лист заново.',
} satisfies Record<keyof typeof en, TranslationValue>;
