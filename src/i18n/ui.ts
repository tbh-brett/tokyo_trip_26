// Interface text in English and Traditional Chinese (Hong Kong written style).
// Pure: used by the page build and by the browser. Content translations
// (places, days, bookings…) live in data/i18n/zh-Hant.json.

export type Lang = 'en' | 'zh';

const S = {
  // Shell
  appName: ['Tokyo 2026', '東京 2026'],
  skip: ['Skip to content', '跳到內容'],
  'tab.today': ['Today', '今天'],
  'tab.plan': ['Plan', '行程'],
  'tab.places': ['Places', '地點'],
  'lang.switch': ['Switch to Chinese', '切換到英文'],
  // The button shows the other language's name.
  'lang.other': ['中文', 'EN'],
  'list.sep': [', ', '、'],
  'list.and': [' and ', '和'],
  'who.q': ["Who's using this phone?", '誰在用這部手機？'],
  'who.why': ['So the other phone sees who changed what.', '這樣另一部手機就知道是誰改了甚麼。'],
  'who.me': ["I'm {name}", '我是 {name}'],
  'sync.saving': ['Saving…', '儲存中…'],
  'sync.waiting1': ["No signal · 1 change will sync when you're back online", '沒有訊號 · 1 項更改會在恢復連線後同步'],
  'sync.waitingN': ["No signal · {n} changes will sync when you're back online", '沒有訊號 · {n} 項更改會在恢復連線後同步'],
  'sync.asOf': ['No signal · showing the plan as of {time}', '沒有訊號 · 顯示 {time} 時的行程'],
  'sync.notYet': ['No signal · the shared plan will load when you are back online', '沒有訊號 · 恢復連線後會載入共享行程'],
  'sync.expired': ['Your login has expired.', '登入已過期。'],
  'sync.signIn': ['Sign in again', '重新登入'],
  'sync.ok': ['OK', '好'],
  'sync.notSaved': ['Not saved: {reason}', '未能儲存：{reason}'],

  // Today
  'today.toGo': ['days to go', '天後出發'],
  'today.toGo1': ['day to go', '天後出發'],
  'today.firstDay': ['First day: {date}.', '第一天：{date}。'],
  'today.latest': ['Latest changes', '最新更改'],
  'today.bookNext': ['Book next', '接下來要訂'],
  'today.beforeFly': ['Before you fly', '出發前'],
  'today.everything': ["Everything, including what's done, is on Plan →", '全部項目（包括已完成的）都在「行程」→'],
  'today.doneNote': ["{n} already done. They're ticked off on Plan.", '已完成 {n} 項，已在「行程」剔除。'],
  'today.dayOf': ['Day {n} of {m} · {date}', '第 {n} 天（共 {m} 天）· {date}'],
  'today.nextUp': ['Next up', '下一項'],
  'today.todaysPlan': ["Today's plan", '今天的行程'],
  'today.change': ["Change today's plan", '修改今天的行程'],
  'today.notes': ['Notes', '備註'],
  'today.tomorrow': ['Tomorrow · {date}', '明天 · {date}'],
  'today.home': ['Home again.', '回家了。'],
  'today.homeLine': ['{n} days in Tokyo, {range}.', '在東京的 {n} 天，{range}。'],
  'today.theDays': ['The {n} days', '{n} 天行程'],
  'rel.today': ['Today', '今天'],
  'rel.tomorrow': ['Tomorrow', '明天'],
  'rel.inDays': ['In {n} days', '{n} 天後'],
  'due.now': ['Now', '現在'],
  'due.trip': ['On the trip', '旅程期間'],
  'when.anyTime': ['Any time', '隨時'],

  // Plan
  'plan.title': ['Plan', '行程'],
  'plan.shared': ['Shared by {names}. A change on one phone shows on the other within seconds.', '{names} 共用。一部手機上的更改，幾秒內就會在另一部出現。'],
  'plan.dayN': ['Day {n}', '第 {n} 天'],
  'plan.openDay': ['Open day →', '打開這天 →'],
  'plan.want': ['Want list', '想去清單'],
  'plan.wantHint': ['Places either of you marked Want. Open one to add it to a day.', '你們任何一人標為「想去」的地方。打開就可加到某一天。'],
  'plan.wantEmpty': ['Nothing yet. Tap Want on any place and it appears here for both of you.', '暫時沒有。在任何地方按「想去」，就會在這裡出現，兩人都看到。'],
  'plan.notPlanned': ['Not planned yet', '未加入行程'],
  'plan.planned': ['Planned · {days}', '已安排 · {days}'],
  'plan.markedBy': ['marked by {name}', '{name} 標記'],
  'plan.bookings': ['Bookings', '預約'],
  'plan.bigger': ['Bigger changes', '較大的修改'],
  'plan.biggerText': [
    "For research, like finding a place properly, checking opening hours or changing how the site works, ask Claude Code. It opens on this site's code, follows the rules in CLAUDE.md, and the site updates about a minute after you accept its change.",
    '要做資料搜集，例如好好查一個地方、核對營業時間，或修改網站的運作方式，就問 Claude Code。它會打開這個網站的程式碼，遵守 CLAUDE.md 的規則；你接受修改後約一分鐘，網站便會更新。',
  ],
  'plan.askCode': ['Ask Claude Code', '問 Claude Code'],
  'plan.opens': ['Opens claude.ai ↗', '打開 claude.ai ↗'],
  'plan.device': ['On this phone', '這部手機'],
  'device.ready': ['Ready for no signal', '沒有訊號也能用'],
  'device.saving': ['Saving the site to this phone…', '正在把網站存到這部手機…'],
  'device.unsupported': ["This browser can't save the site for offline use", '這個瀏覽器無法把網站存作離線使用'],
  'device.readyText': ['{n} pages and files are saved here. Every page opens on the subway; changes you make wait and sync later.', '已儲存 {n} 個頁面和檔案。在地鐵裡每頁都能打開；你作的更改會等到有訊號時再同步。'],
  'device.savingText': ['Keep this page open for a minute, then check again.', '讓這頁開著一分鐘，然後再檢查。'],
  'device.unsupportedText': ['Pages need signal to open. Changes still wait on the phone until they can sync.', '頁面需要訊號才能打開。更改仍會留在手機上，等到可以同步。'],
  'device.check': ['Check again', '再檢查'],
  'device.installed': ['Opened from the Home Screen', '已從主畫面打開'],
  'device.install': ['Add it to your Home Screen', '加到主畫面'],
  'device.installedText': ['It opens full screen, like an app.', '它會像 app 一樣全螢幕打開。'],
  'device.installText': [
    "iPhone: in Safari, tap Share, then Add to Home Screen. Android: in Chrome, open the menu, then Install app. You'll sign in once more inside it, and choose your name again.",
    'iPhone：在 Safari 按「分享」，再按「加入主畫面」。Android：在 Chrome 打開選單，再按「安裝應用程式」。打開後要再登入一次，並再選一次你的名字。',
  ],

  // Day
  'day.back': ['← Plan', '← 行程'],
  'day.editHeadline': ['Edit the headline', '修改標題'],
  'day.title': ['Title', '標題'],
  'day.mainPlan': ['Main plan', '主要安排'],
  'day.reset': ['Back to original', '還原'],
  'day.yourPlan': ['Your plan', '你們的行程'],
  'day.ask': ['Ask Claude about this day', '問 Claude 這天的安排'],
  'day.add': ['Add to this day', '加到這天'],
  'day.timeNext': ['Time (optional, for the next thing you add)', '時間（可選，用於下一項加入的內容）'],
  'day.find': ['Find a place', '找地方'],
  'day.findPh': ['Name, station or area', '名稱、車站或地區'],
  'day.custom': ["Or something that isn't a place", '或者不是地方的事項'],
  'day.customPh': ['Check in, rest at the hotel, meet Clara…', '入住、在酒店休息、約 Clara…'],
  'day.addIt': ['Add it', '加入'],
  'day.addUnlisted': ["Add a place that isn't listed", '加入清單上沒有的地方'],
  'day.fromWant': ['From your Want list', '來自想去清單'],
  'day.ideas': ['Ideas for this day', '這天的建議'],
  'day.notes': ['Notes from the research', '資料備註'],
  'day.onDay': ['On this day', '已在這天'],
  'day.empty': ['Nothing planned yet. Add something below: search, your Want list, or the ideas from the research.', '暫時未有安排。在下面加入：搜尋、想去清單，或資料建議。'],
  'day.anyTime': ['Any time', '不定時'],
  'day.legend': ['Timed things follow the clock. Use Move up and Move down to order the rest.', '有時間的項目按時間排列；其餘可用「上移」「下移」排序。'],
  'day.added': ['{label} added.', '已加入 {label}。'],
  'day.addedAt': ['{label} added at {time}.', '已加入 {label}，時間 {time}。'],
  'day.typeFirst': ['Type what it is first.', '請先輸入內容。'],
  'day.noMatch': ['No match. Try the station name, or add it as a new place.', '找不到。試試車站名稱，或加入為新地方。'],
  'day.wantsEmpty': ["Nothing on the Want list that isn't already here.", '想去清單上的地方都已在這天。'],
  'item.addedBy': ['added by {name}', '{name} 加入'],
  'item.edit': ['Edit', '修改'],
  'item.time': ['Time', '時間'],
  'item.day': ['Day', '日期'],
  'item.note': ['Note', '備註'],
  'item.notePh': ['Booked for 2, ask for the counter…', '已訂兩位，要求吧枱座…'],
  'item.save': ['Save changes', '儲存修改'],
  'item.up': ['Move up', '上移'],
  'item.down': ['Move down', '下移'],
  'item.open': ['Open place', '打開地方'],
  'item.remove': ['Remove', '刪除'],
  'item.removeAgain': ['Tap again to remove', '再按一次刪除'],
  'preview.nothing': ['Nothing planned yet', '未有安排'],
  'preview.more': ['and {n} more', '還有 {n} 項'],
  'preview.any': ['any', '不定'],

  // Places
  'places.area': ['Area', '地區'],
  'places.all': ['All', '全部'],
  'places.count': ['{n} places', '{n} 個地方'],
  'places.count1': ['1 place', '1 個地方'],
  'places.mine': ['Added by you', '你們加入的'],
  'places.none': ['None yet.', '暫時沒有。'],
  'places.addedBy': ['Added by {name}', '{name} 加入'],
  'row.bookAhead': ['Book ahead', '要預約'],

  // Place page
  'place.all': ['← All {kind}', '← 全部{kind}'],
  'place.note': ['Note', '備註'],
  'place.staff': ['Show to staff', '給店員看'],
  'place.fullScreen': ['Full screen', '全螢幕'],
  'place.maps': ['Open in Google Maps', '在 Google 地圖打開'],
  'place.directions': ['Directions from here', '從這裡出發的路線'],
  'place.transit': ['Transit ↗', '公共交通 ↗'],
  'place.copy': ['Copy address', '複製地址'],
  'place.copied': ['Copied', '已複製'],
  'place.copyFail': ['Press and hold the address instead', '請長按地址複製'],
  'place.ask': ['Ask Claude about it', '問 Claude'],
  'place.markFor': ['Mark for both of you', '兩人共用的標記'],
  'place.inPlan': ['In your plan', '在你們的行程中'],
  'place.notInPlan': ['Not in the plan yet.', '未加入行程。'],
  'place.timeOpt': ['Time (optional)', '時間（可選）'],
  'place.addToPlan': ['Add to plan', '加入行程'],
  'place.addedTo': ['Added to {date}.', '已加到 {date}。'],
  'fact.now': ['Now', '現在'],
  'fact.hours': ['Hours', '營業時間'],
  'fact.price': ['Price', '價錢'],
  'fact.booking': ['Booking', '預約'],
  'fact.station': ['Station', '車站'],
  'fact.area': ['Area', '地區'],
  'fact.address': ['Address', '地址'],
  'fact.goodFor': ['Good for', '適合'],
  'fact.source': ['Source', '來源'],
  'fact.generalKnowledge': ['General knowledge', '一般常識'],
  'fact.link': ['Link', '連結'],
  'fact.kind': ['Kind', '類別'],
  'fact.nowHint': ['See estimated hours below', '請看下面的估計營業時間'],
  'fact.nowHintVerified': ['Open hours below', '請看下面的營業時間'],
  'hours.notListed': ['Not listed yet', '未有資料'],
  'hours.checkMaps': ["Check Google Maps or the venue's site before going.", '出發前請查看 Google 地圖或場地網站。'],
  'hours.estimated': ['Estimated. Not yet checked with the shop.', '估計時間，尚未向店方核實。'],
  'addr.district': ['Neighbourhood only. The street address is not known yet, so Maps may land on the area, not the door.', '只有地區。尚未知道街道地址，地圖可能只會定位到該區，而不是門口。'],
  'addr.unchecked': ['Street address, not yet checked.', '街道地址，尚未核實。'],
  'staff.close': ['← Close', '← 關閉'],
  'staff.title': ['Show to staff: {name}', '給店員看：{name}'],

  // Your own places
  'mine.title': ['Your place', '你們的地方'],
  'mine.missing': ['This place was deleted, or the link is wrong.', '這個地方已被刪除，或連結有誤。'],
  'mine.loading': ['Loading…', '載入中…'],
  'mine.addedBy': ['Added by {name} · {ago}', '{name} 加入 · {ago}'],
  'mine.noAddress': ['No address yet. Edit the place to add one.', '未有地址。修改這個地方來加入。'],
  'mine.none': ['None', '沒有'],
  'mine.edit': ['Edit this place', '修改這個地方'],
  'mine.delete': ['Delete this place', '刪除這個地方'],
  'mine.deleteAgain': ['Tap again to delete it and remove it from the plan', '再按一次刪除，並從行程中移除'],
  'mine.notOnPhone': ['Place not found on this phone.', '這部手機找不到這個地方。'],

  // Add a place
  'add.title': ['Add a place', '加入地方'],
  'add.sub': ["Somewhere you found that isn't in the list. You'll both see it straight away.", '你們發現、清單上沒有的地方。兩人都會即時看到。'],
  'add.back': ['← Places', '← 地點'],
  'add.backDay': ['← Back to the day', '← 回到這天'],
  'add.name': ['Name', '名稱'],
  'add.namePh': ['Tsuta, the bar by the station…', 'Tsuta、車站旁的酒吧…'],
  'add.nameJa': ['Japanese name', '日文名稱'],
  'add.nameJaOpt': ['Japanese name (optional)', '日文名稱（可選）'],
  'add.nameJaHint': ['Shown to staff, and the best thing to search Maps with.', '會給店員看，也是在地圖搜尋的最好方法。'],
  'add.address': ['Address', '地址'],
  'add.addressOpt': ['Address (optional)', '地址（可選）'],
  'add.addressHint': ['Japanese is best. Copy it from Google Maps or Tabelog.', '日文最好。可從 Google 地圖或 Tabelog 複製。'],
  'add.maps': ['Google Maps link', 'Google 地圖連結'],
  'add.mapsOpt': ['Google Maps link (optional)', 'Google 地圖連結（可選）'],
  'add.mapsHint': ['In Google Maps: Share, then Copy link.', '在 Google 地圖：分享，然後複製連結。'],
  'add.kind': ['Kind', '類別'],
  'add.note': ['Note', '備註'],
  'add.noteOpt': ['Note (optional)', '備註（可選）'],
  'add.notePh': ["Why it's worth it, what to order…", '值得去的原因、要點甚麼…'],
  'add.day': ['Add to a day', '加到某一天'],
  'add.notYet': ['Not yet', '暫時不加'],
  'add.time': ['Time', '時間'],
  'add.submit': ['Add place', '加入地方'],
  'common.save': ['Save', '儲存'],
  'common.add': ['Add', '加入'],

  // 404
  'nf.title': ['Not here.', '找不到。'],
  'nf.short': ['Not found', '找不到'],
  'nf.text': ["That page doesn't exist, or it moved when the data changed.", '這一頁不存在，或已因資料更新而移動。'],
  'nf.today': ['Go to Today', '前往「今天」'],
  'nf.places': ['Go to Places', '前往「地點」'],

  // Live bits
  'ago.now': ['just now', '剛剛'],
  'ago.min': ['{n} min ago', '{n} 分鐘前'],
  'ago.h': ['{n} h ago', '{n} 小時前'],
  'check.done': ['Done · {name}, {ago}', '已完成 · {name}，{ago}'],
  'mark.by': ['{mark} · {name}, {ago}', '{mark} · {name}，{ago}'],
  'feed.empty': ['No changes yet. Anything either of you changes shows up here.', '暫時沒有更改。你們任何一人作的更改都會在這裡出現。'],

  // Opening hours
  'open.likely': ['Likely open · until {t}', '應該營業中 · 至 {t}'],
  'open.sure': ['Open · until {t}', '營業中 · 至 {t}'],
  'opens.likely': ['Likely closed · opens {t}', '應該休息中 · {t} 開門'],
  'opens.sure': ['Closed · opens {t}', '休息中 · {t} 開門'],
  'closedToday.likely': ['Likely closed today', '今天應該休息'],
  'closedToday.sure': ['Closed today', '今天休息'],
  'closedNow.likely': ['Likely closed for the day', '今天應該已打烊'],
  'closedNow.sure': ['Closed for the day', '今天已打烊'],
  'hours.none': ['No hours listed', '未有營業時間'],
  'hours.closed': ['Closed {days}', '{days}休息'],

  // The changes feed
  'act.item.add': ['added {label} to {day}{time}', '把 {label} 加到 {day}{time}'],
  'act.item.move': ['moved {label} from {day} to {to}{time}', '把 {label} 由 {day} 移到 {to}{time}'],
  'act.item.time': ['set {label} for {t} on {day}', '把 {label} 定在 {day} {t}'],
  'act.item.untime': ['took the time off {label} on {day}', '取消了 {day} {label} 的時間'],
  'act.item.note': ['added a note to {label}: {note}', '為 {label} 加了備註：{note}'],
  'act.item.unnote': ['removed the note from {label}', '刪除了 {label} 的備註'],
  'act.item.remove': ['removed {label} from {day}', '從 {day} 刪除了 {label}'],
  'act.place.add': ['added a new place: {label}', '新增了地方：{label}'],
  'act.place.edit': ['edited {label}', '修改了 {label}'],
  'act.place.remove': ['deleted {label}', '刪除了 {label}'],
  'act.mark.set': ['marked {label} as {mark}', '把 {label} 標為「{mark}」'],
  'act.mark.clear': ['cleared the mark on {label}', '取消了 {label} 的標記'],
  'act.day.edit': ['changed the headline for {day}', '修改了 {day} 的標題'],
  'act.day.reset': ['put back the original headline for {day}', '還原了 {day} 的原本標題'],
  'act.check.on': ['ticked off: {check}', '已完成：{check}'],
  'act.check.off': ['unticked: {check}', '取消完成：{check}'],
  'act.withNote': [', with a note', '，並加了備註'],
  'act.at': [' at {t}', ' {t}'],

  // Ask Claude (src/lib/ask.ts). The Chinese asks for a reply in Traditional Chinese.
  'ask.trip': [
    'We are two people in Tokyo, {range}, staying in Soto-Kanda near {station} station (Ginza line, {code}).',
    '我們兩人{range}在東京，住在外神田，近{station}站（銀座線 {code}）。',
  ],
  'ask.going': ["We're thinking of going to {name}{where}.", '我們打算去 {name}{where}。'],
  'ask.where': [' ({where})', '（{where}）'],
  'ask.notes': ['Our notes say: {why}', '我們的筆記：{why}'],
  'ask.placeQ': [
    'What should we know before going: what to order or see, how busy it gets and when, whether we need cash or a booking, and what nearby is worth pairing with it? Please check current opening hours if you can.',
    '去之前要知道甚麼：要點甚麼或看甚麼、甚麼時候最多人、需要現金或預約嗎，附近有甚麼值得一併去？如可以，請查一下現時的營業時間。請用繁體中文回答。',
  ],
  'ask.dayPlan': ['Our plan for {day}: {headline}', '我們{day}的行程：{headline}'],
  'ask.dayNone': ['(nothing specific planned yet)', '（暫時未有具體安排）'],
  'ask.dayQ': [
    'Does the order make sense for getting around by train and on foot? What are we missing, and where should we eat along the way? Flag anything likely to be closed that day.',
    '以坐車和步行來說，這個次序合理嗎？我們漏了甚麼？沿路在哪裡吃比較好？請標出當天可能休息的地方。請用繁體中文回答。',
  ],
} as const satisfies Record<string, readonly [string, string]>;

export type UIKey = keyof typeof S;

export function ui(key: UIKey, lang: Lang, vars?: Record<string, string | number>): string {
  let text: string = S[key][lang === 'zh' ? 1 : 0];
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

export const KIND_LABEL: Record<string, readonly [string, string]> = {
  eat: ['Eat', '美食'],
  coffee: ['Coffee', '咖啡'],
  tea: ['Tea', '茶'],
  bar: ['Bars', '酒吧'],
  see: ['See', '景點'],
  buy: ['Buy', '購物'],
};

export const MARK_TEXT: Record<'want' | 'booked' | 'skip', readonly [string, string]> = {
  want: ['Want', '想去'],
  booked: ['Booked', '已預約'],
  skip: ['Skip', '略過'],
};

export const SLOT_TEXT: Record<string, readonly [string, string]> = {
  breakfast: ['breakfast', '早餐'],
  coffee: ['coffee', '咖啡'],
  lunch: ['lunch', '午餐'],
  dinner: ['dinner', '晚餐'],
  late: ['late', '深夜'],
};

export const pick = (pair: readonly [string, string], lang: Lang) => pair[lang === 'zh' ? 1 : 0];

const WEEKDAY_ZH = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-11-27" → "Fri 27 Nov" / "11月27日（五）" */
export function dateIn(iso: string, lang: Lang): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return lang === 'zh'
    ? `${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${WEEKDAY_ZH[d.getUTCDay()]}）`
    : `${WEEKDAY_EN[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_EN[d.getUTCMonth()]}`;
}

/** "27 Nov – 3 Dec 2026" / "2026年11月27日至12月3日" */
export function rangeIn(first: string, last: string, lang: Lang): string {
  const a = new Date(`${first}T12:00:00Z`);
  const b = new Date(`${last}T12:00:00Z`);
  return lang === 'zh'
    ? `${a.getUTCFullYear()}年${a.getUTCMonth() + 1}月${a.getUTCDate()}日至${b.getUTCMonth() + 1}月${b.getUTCDate()}日`
    : `${a.getUTCDate()} ${MONTH_EN[a.getUTCMonth()]} – ${b.getUTCDate()} ${MONTH_EN[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
}

/** "Sun" → "Sun" / "週日" */
export const weekdayIn = (day: string, lang: Lang) => (lang === 'zh' ? `週${WEEKDAY_ZH[WEEKDAY_EN.indexOf(day)]}` : day);
