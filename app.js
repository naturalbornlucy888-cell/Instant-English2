// ===== 瞬間英作文トレーナー app.js =====

// ---------- 定数 ----------
const NEWS_COUNT   = 7;   // NewsAPIから取得する新問題数
const REVIEW_MAX   = 3;   // 復習問題の最大数
const DAILY_COUNT  = NEWS_COUNT + REVIEW_MAX; // 最大10問
const STORAGE_KEYS = {
  REVIEW:       'iet_review',        // 翌日復習リスト
  NEWS_KEY:     'iet_news_key',      // NewsAPIキー
  TODAY_CACHE:  'iet_today_cache',   // 当日問題キャッシュ
};

// ---------- サンプル文 ----------
const SAMPLE_SENTENCES = [
  { ja: '日本の株式市場は今週、世界的な不安定さの中で下落した。',           en: "Japan's stock market fell this week amid global instability." },
  { ja: '研究者たちは新しいがん治療法の開発に成功したと発表した。',           en: 'Researchers announced they had successfully developed a new cancer treatment.' },
  { ja: '政府は再生可能エネルギーへの投資を増やす計画を発表した。',           en: 'The government announced plans to increase investment in renewable energy.' },
  { ja: '東京オリンピックの遺産は今もスポーツ施設に残っている。',             en: 'The legacy of the Tokyo Olympics still remains in sports facilities.' },
  { ja: '人工知能は医療診断の精度を大幅に向上させている。',                   en: 'Artificial intelligence is significantly improving the accuracy of medical diagnoses.' },
  { ja: '気候変動により、世界各地で異常気象が増加している。',                 en: 'Climate change is causing an increase in extreme weather events around the world.' },
  { ja: '新しいスマートフォンモデルが来月発売される予定だ。',                 en: 'A new smartphone model is scheduled to be released next month.' },
  { ja: '国連は紛争地域への人道支援を強化すると述べた。',                     en: 'The United Nations said it would strengthen humanitarian aid to conflict zones.' },
  { ja: '電気自動車の販売台数が初めてガソリン車を上回った。',                 en: 'Sales of electric vehicles surpassed gasoline cars for the first time.' },
  { ja: '若者の間でメンタルヘルスへの関心が高まっている。',                   en: 'Interest in mental health is growing among young people.' },
  { ja: '宇宙探査機が火星の表面から新たなデータを送信した。',                 en: 'A space probe transmitted new data from the surface of Mars.' },
  { ja: '世界的なサプライチェーンの混乱が物価上昇を招いている。',             en: 'Global supply chain disruptions are causing price increases.' },
  { ja: '新しい教育政策により、デジタルスキルの習得が義務化された。',         en: 'A new education policy has made acquiring digital skills mandatory.' },
  { ja: '海洋プラスチック汚染を減らすための国際条約が締結された。',           en: 'An international treaty was concluded to reduce ocean plastic pollution.' },
  { ja: '中央銀行は物価安定のため金利を引き上げることを決定した。',           en: 'The central bank decided to raise interest rates to stabilize prices.' },
  { ja: '新型ウイルスのワクチン接種プログラムが全国で開始された。',           en: 'A vaccination program for the new virus was launched nationwide.' },
  { ja: '地震の被災地では復興作業が続いている。',                             en: 'Recovery work continues in areas affected by the earthquake.' },
  { ja: 'テクノロジー企業が大規模なリストラを発表した。',                     en: 'A technology company announced a large-scale restructuring.' },
  { ja: '農業分野でもAIの活用が急速に進んでいる。',                           en: 'The use of AI is rapidly advancing in the agricultural sector as well.' },
  { ja: '観光業はパンデミック後、急速に回復しつつある。',                     en: 'The tourism industry is recovering rapidly after the pandemic.' },
  { ja: '新しい国際空港が来年開港する予定だ。',                               en: 'A new international airport is scheduled to open next year.' },
  { ja: '科学者たちは地球外生命体の痕跡を発見したと主張している。',           en: 'Scientists claim to have found traces of extraterrestrial life.' },
  { ja: '政府は少子化対策として育児支援を拡充する方針だ。',                   en: 'The government plans to expand childcare support as a measure against the declining birthrate.' },
  { ja: 'サイバー攻撃が増加し、企業のセキュリティ対策が急務となっている。',   en: 'Cyberattacks are increasing, making security measures urgent for companies.' },
  { ja: '新しい薬が難病患者に希望をもたらしている。',                         en: 'A new drug is bringing hope to patients with intractable diseases.' },
  { ja: '都市部への人口集中が地方の過疎化を加速させている。',                 en: 'Population concentration in urban areas is accelerating depopulation in rural regions.' },
  { ja: '再生可能エネルギーのコストが過去10年で大幅に低下した。',             en: 'The cost of renewable energy has dropped significantly over the past decade.' },
  { ja: '高齢化社会に対応するため、介護ロボットの開発が進んでいる。',         en: 'Development of care robots is advancing to cope with an aging society.' },
  { ja: '国際社会は核軍縮に向けた交渉を再開することで合意した。',             en: 'The international community agreed to resume negotiations toward nuclear disarmament.' },
  { ja: 'フードロス削減のため、スーパーが値引き販売を強化している。',         en: 'Supermarkets are stepping up discounted sales to reduce food waste.' },
  { ja: '首相は来週、主要7カ国首脳会議に出席する予定だ。',                   en: 'The prime minister is scheduled to attend the G7 summit next week.' },
  { ja: '新しい法律により、プラスチック袋の使用が禁止された。',               en: 'A new law has banned the use of plastic bags.' },
  { ja: '大学の研究チームが画期的な電池技術を開発した。',                     en: 'A university research team has developed a groundbreaking battery technology.' },
  { ja: '世界の平均気温が過去最高を記録した。',                               en: 'The global average temperature reached a record high.' },
  { ja: '企業は従業員のリモートワークを恒久的に認める方針を示した。',         en: 'The company indicated a policy of permanently allowing employees to work remotely.' },
];

// ---------- 状態 ----------
let state = {
  newsKey:      '',
  questions:    [],
  currentIndex: 0,
  results:      [],
  recognition:  null,
  isRecording:  false,
  activeTab:    'mic',
};

// ---------- ユーティリティ ----------
const todayStr = () => new Date().toISOString().slice(0, 10);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------- localStorage ----------
function getReviewList() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEW)) || []; }
  catch { return []; }
}
function saveReviewList(list) {
  localStorage.setItem(STORAGE_KEYS.REVIEW, JSON.stringify(list));
}
function getTodayCache() {
  try {
    const c = JSON.parse(localStorage.getItem(STORAGE_KEYS.TODAY_CACHE));
    if (c && c.date === todayStr()) return c.questions;
    return null;
  } catch { return null; }
}
function saveTodayCache(questions) {
  localStorage.setItem(STORAGE_KEYS.TODAY_CACHE, JSON.stringify({
    date: todayStr(),
    questions,
  }));
}

// ---------- Google翻訳（非公式エンドポイント） ----------
async function translateToJa(text) {
  // Google翻訳の非公式APIを使用（無料・キーなし）
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ja&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('翻訳失敗');
  const data = await res.json();
  // レスポンス形式: [[["翻訳文","原文",...], ...], ...]
  return data[0].map(seg => seg[0]).join('');
}

// ---------- NewsAPI取得 ----------
async function fetchNewsQuestions(newsKey) {
  // CORSプロキシ経由でNewsAPIを呼ぶ（ブラウザから直接呼ぶとCORSエラーになる場合がある）
  const url = `https://newsapi.org/v2/top-headlines?language=en&pageSize=20&apiKey=${newsKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `NewsAPI error: ${res.status}`);
  }
  const data = await res.json();

  // タイトルが適切な長さの記事を選ぶ
  const articles = (data.articles || [])
    .filter(a => a.title && a.title.length >= 20 && a.title.length <= 120
                 && !a.title.includes('[Removed]'))
    .slice(0, NEWS_COUNT * 2); // 余裕を持って取得

  if (articles.length === 0) throw new Error('有効な記事が取得できませんでした');

  // 各記事を翻訳（並列処理）
  const results = await Promise.allSettled(
    articles.slice(0, NEWS_COUNT).map(async (a) => {
      const ja = await translateToJa(a.title);
      return {
        ja,
        en:     a.title,
        source: `📰 ${a.source?.name || 'News'}`,
        isReview: false,
      };
    })
  );

  // 成功したものだけ返す
  const questions = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  if (questions.length === 0) throw new Error('翻訳に失敗しました');
  return questions;
}

// ---------- 問題準備（非同期） ----------
async function prepareQuestions(newsKey, onProgress) {
  const today = todayStr();

  // 復習問題（最大3問）
  const reviewList  = getReviewList();
  const reviewToday = reviewList.filter(r => r.reviewDate === today);
  const reviewQs    = reviewToday.slice(0, REVIEW_MAX).map(r => ({
    ja: r.ja, en: r.en, source: '🔁 復習', isReview: true,
  }));

  // 当日キャッシュがあれば再利用（APIを無駄に叩かない）
  const cached = getTodayCache();
  if (cached) {
    onProgress('キャッシュから問題を読み込み中...');
    // 復習問題を先頭に追加して返す
    return [...reviewQs, ...cached.filter(q => !q.isReview)];
  }

  // NewsAPIから新問題を取得
  onProgress('今日のニュースを取得中...');
  let newsQs;
  try {
    newsQs = await fetchNewsQuestions(newsKey);
    onProgress('日本語に翻訳中...');
  } catch (e) {
    console.warn('NewsAPI失敗、サンプルにフォールバック:', e.message);
    onProgress('サンプル問題を準備中...');
    newsQs = getFallbackQuestions(NEWS_COUNT, today);
  }

  // 当日分をキャッシュ保存
  saveTodayCache(newsQs);

  return [...reviewQs, ...newsQs];
}

// ---------- フォールバック（NewsAPI失敗時） ----------
function getFallbackQuestions(count, dateStr) {
  const seed   = dateStr.replace(/-/g, '');
  const offset = parseInt(seed.slice(-4)) % SAMPLE_SENTENCES.length;
  const pool   = [...SAMPLE_SENTENCES.slice(offset), ...SAMPLE_SENTENCES.slice(0, offset)];
  return pool.slice(0, count).map(s => ({ ...s, source: '📚 サンプル', isReview: false }));
}

// ---------- 単語辞書（サンプル文の重要単語 + 語幹形も収録） ----------
const WORD_DICT = {
  // A
  advance:      { ja: '進歩する、前進する', ex: 'Technology continues to advance.' },
  advancing:    { ja: '進歩している', ex: 'Technology is advancing rapidly.' },
  affect:       { ja: '影響を与える', ex: 'The flood affected many people.' },
  affected:     { ja: '影響を受けた', ex: 'Many people were affected by the flood.' },
  agree:        { ja: '合意する', ex: 'Both sides agreed to the terms.' },
  agreed:       { ja: '合意した', ex: 'Both sides agreed to the terms.' },
  amid:         { ja: '〜の中で、〜に囲まれて', ex: 'She stayed calm amid the chaos.' },
  announce:     { ja: '発表する', ex: 'The company will announce results soon.' },
  announced:    { ja: '発表した', ex: 'The company announced a new product.' },
  // B
  ban:          { ja: '禁止する', ex: 'The city banned plastic bags.' },
  banned:       { ja: '禁止された', ex: 'Smoking was banned in public places.' },
  // C
  cause:        { ja: '引き起こす', ex: 'Pollution causes health problems.' },
  causing:      { ja: '引き起こしている', ex: 'The storm is causing delays.' },
  claim:        { ja: '主張する', ex: 'Scientists claim the drug is effective.' },
  conclude:     { ja: '締結する、結論づける', ex: 'They concluded a trade agreement.' },
  concluded:    { ja: '締結した', ex: 'A treaty was concluded last year.' },
  conflict:     { ja: '紛争、対立', ex: 'The conflict lasted for years.' },
  continue:     { ja: '続く', ex: 'The investigation continues.' },
  continues:    { ja: '続いている', ex: 'Recovery work continues.' },
  // D
  decide:       { ja: '決定する', ex: 'The board decided to expand.' },
  decided:      { ja: '決定した', ex: 'The bank decided to raise rates.' },
  decline:      { ja: '低下する、断る', ex: 'Sales declined last quarter.' },
  depopulation: { ja: '過疎化、人口減少', ex: 'Rural depopulation is a serious issue.' },
  develop:      { ja: '開発する', ex: 'They developed a new vaccine.' },
  developed:    { ja: '開発した', ex: 'Researchers developed a new treatment.' },
  diagnos:      { ja: '診断', ex: 'Early diagnosis saves lives.' },
  diagnosis:    { ja: '診断', ex: 'Accurate diagnosis is important.' },
  disruption:   { ja: '混乱、障害', ex: 'Supply chain disruptions caused delays.' },
  disruptions:  { ja: '混乱（複数）', ex: 'Disruptions affected global trade.' },
  // E
  expand:       { ja: '拡大する、拡充する', ex: 'The company plans to expand its services.' },
  extreme:      { ja: '極端な、異常な', ex: 'Extreme weather events are increasing.' },
  // F
  fall:         { ja: '下落する', ex: 'Prices tend to fall in winter.' },
  fell:         { ja: '下落した（fall の過去形）', ex: 'The temperature fell overnight.' },
  // G
  global:       { ja: '世界的な', ex: 'Global temperatures are rising.' },
  globally:     { ja: '世界的に', ex: 'The product is sold globally.' },
  groundbreaking: { ja: '画期的な', ex: 'This is a groundbreaking discovery.' },
  grow:         { ja: '増加する、成長する', ex: 'The economy continues to grow.' },
  growing:      { ja: '高まっている、増加している', ex: 'There is growing concern about pollution.' },
  // H
  humanitarian: { ja: '人道的な', ex: 'Humanitarian aid was sent to the region.' },
  // I
  improve:      { ja: '向上させる', ex: 'We need to improve efficiency.' },
  improving:    { ja: '向上させている', ex: 'AI is improving medical diagnoses.' },
  indicate:     { ja: '示す', ex: 'The data indicates a positive trend.' },
  indicated:    { ja: '示した', ex: 'The company indicated a new policy.' },
  instability:  { ja: '不安定さ', ex: 'Political instability affects investment.' },
  intractable:  { ja: '難治性の、手に負えない', ex: 'Intractable diseases are hard to treat.' },
  invest:       { ja: '投資する', ex: 'We should invest in education.' },
  investment:   { ja: '投資', ex: 'Investment in education is crucial.' },
  increase:     { ja: '増加、増やす', ex: 'There has been an increase in demand.' },
  // L
  launch:       { ja: '開始する、発売する', ex: 'They will launch a new product.' },
  launched:     { ja: '開始した、発売した', ex: 'The app was launched last month.' },
  legacy:       { ja: '遺産、レガシー', ex: 'The legacy of the war still remains.' },
  // M
  mandatory:    { ja: '義務的な、必須の', ex: 'Wearing a helmet is mandatory.' },
  // N
  nationwide:   { ja: '全国的に', ex: 'The campaign was held nationwide.' },
  negotiation:  { ja: '交渉', ex: 'Peace negotiations are ongoing.' },
  negotiations: { ja: '交渉（複数）', ex: 'Negotiations resumed this week.' },
  // P
  permanently:  { ja: '恒久的に', ex: 'The store was permanently closed.' },
  pollut:       { ja: '汚染する', ex: 'Factories pollute the air.' },
  pollution:    { ja: '汚染', ex: 'Air pollution is a major health risk.' },
  probe:        { ja: '探査機、調査する', ex: 'A space probe was sent to Mars.' },
  // R
  rapid:        { ja: '急速な', ex: 'There was a rapid increase in cases.' },
  rapidly:      { ja: '急速に', ex: 'The city is rapidly developing.' },
  reach:        { ja: '達する', ex: 'Temperatures will reach 40 degrees.' },
  reached:      { ja: '達した', ex: 'Temperatures reached a record high.' },
  recover:      { ja: '回復する', ex: 'The economy will recover soon.' },
  recovering:   { ja: '回復しつつある', ex: 'The economy is recovering slowly.' },
  renewable:    { ja: '再生可能な', ex: 'Renewable energy is the future.' },
  restructuring:{ ja: 'リストラ、再編', ex: 'The company underwent restructuring.' },
  resume:       { ja: '再開する', ex: 'Talks will resume next week.' },
  // S
  schedule:     { ja: '予定する', ex: 'The meeting is scheduled for Monday.' },
  scheduled:    { ja: '予定されている', ex: 'The flight is scheduled to depart at 9.' },
  significant:  { ja: '大幅な、著しい', ex: 'There was a significant improvement.' },
  significantly:{ ja: '大幅に、著しく', ex: 'Costs have significantly decreased.' },
  strengthen:   { ja: '強化する', ex: 'We need to strengthen security.' },
  surpass:      { ja: '上回る', ex: 'Sales surpassed expectations.' },
  surpassed:    { ja: '上回った', ex: 'EV sales surpassed gasoline cars.' },
  supply:       { ja: '供給、サプライ', ex: 'Supply chain issues caused delays.' },
  // T
  transmit:     { ja: '送信する、伝える', ex: 'The signal was transmitted.' },
  transmitted:  { ja: '送信した', ex: 'Data was transmitted from Mars.' },
  treaty:       { ja: '条約', ex: 'A peace treaty was signed.' },
  // U
  urgent:       { ja: '急務の、緊急の', ex: 'This is an urgent matter.' },
  // V
  vaccin:       { ja: 'ワクチン', ex: 'The vaccine was approved.' },
  vaccination:  { ja: 'ワクチン接種', ex: 'Vaccination rates are rising.' },
  vehicle:      { ja: '乗り物、車両', ex: 'Electric vehicles are becoming popular.' },
  vehicles:     { ja: '乗り物（複数）', ex: 'Electric vehicles are popular.' },
};

/**
 * 単語の辞書情報を取得。
 * 完全一致 → 語幹マッチング（-s/-ed/-ing/-ly/-tion/-ment 除去）の順で検索。
 */
function lookupWord(word) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return null;

  // 完全一致
  if (WORD_DICT[clean]) return WORD_DICT[clean];

  // 語幹マッチング（よくある語尾を順に除去して再検索）
  const stems = [
    clean.replace(/ations$/, ''),    // investigations → investigat
    clean.replace(/ation$/, ''),     // vaccination → vaccin
    clean.replace(/ments$/, ''),
    clean.replace(/ment$/, ''),
    clean.replace(/ings$/, ''),
    clean.replace(/ing$/, 'e'),      // causing → cause
    clean.replace(/ing$/, ''),       // advancing → advanc
    clean.replace(/tions$/, 't'),
    clean.replace(/tion$/, 't'),
    clean.replace(/ed$/, 'e'),       // surpassed → surpasse → surpass
    clean.replace(/ed$/, ''),        // affected → affect
    clean.replace(/ly$/, ''),        // rapidly → rapid
    clean.replace(/s$/, ''),         // vehicles → vehicle
    clean.replace(/es$/, 'e'),       // increases → increase
  ];

  for (const stem of stems) {
    if (stem && stem.length > 2 && WORD_DICT[stem]) return WORD_DICT[stem];
  }

  return null;
}

// ---------- 読み上げ（Text-to-Speech） ----------
function speak(text, rate = 0.9) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel(); // 前の読み上げを止める
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = rate;
  utter.pitch = 1.0;
  // 英語音声を優先して選ぶ
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang.startsWith('en') && v.localService) ||
                  voices.find(v => v.lang.startsWith('en'));
  if (enVoice) utter.voice = enVoice;
  window.speechSynthesis.speak(utter);
}

// ---------- ルールベース添削エンジン ----------
/**
 * ユーザー回答と模範解答を比較して添削結果を返す
 * @returns {{ score: number, comment: string, corrected: string, highlights: string[] }}
 */
function gradeAnswer(userRaw, modelRaw) {
  // 比較用の正規化（小文字・記号除去）
  const normalize = s => s.toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[^\w\s]/g, ' ')   // アポストロフィも除去してシンプルに
    .replace(/\s+/g, ' ')
    .trim();

  const userNorm  = normalize(userRaw);
  const modelNorm = normalize(modelRaw);

  const userWords  = userNorm.split(' ').filter(Boolean);
  const modelWords = modelNorm.split(' ').filter(Boolean);

  // 元の単語形も保持（辞書引き用）
  // アポストロフィ付き所有格（Japan's → Japans）は除去、それ以外の記号も除去
  const modelWordsRaw = modelRaw
    .replace(/'\w+/g, '')        // 's や 't などの短縮形・所有格を除去
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1); // 1文字の残骸（"s" など）を除外

  // ---- 単語一致率 ----
  const modelSet = new Set(modelWords);
  const userSet  = new Set(userWords);
  const matchCount = [...userSet].filter(w => modelSet.has(w)).length;
  const wordScore  = modelSet.size > 0 ? matchCount / modelSet.size : 0;
  // ---- 欠けている重要単語（辞書引き用に元の単語形を保持） ----
  const stopWords = new Set(['a','an','the','is','are','was','were','be','been','being',
    'have','has','had','do','does','did','will','would','could','should','may','might',
    'to','of','in','on','at','for','with','by','from','that','this','it','its',
    'also','still','first','new','said','not','as','and','or','but','so','yet',
    'i','we','they','he','she','you','our','their','his','her','its','my','your']);

  // 正規化済みで欠けている単語のインデックスを特定し、元の単語形を取得
  const missing = [];
  const seenNorm = new Set();
  modelWords.forEach((normWord, idx) => {
    if (!userSet.has(normWord) && !stopWords.has(normWord) && !seenNorm.has(normWord)) {
      seenNorm.add(normWord);
      // 元の単語形（modelWordsRaw の同じ位置）を使う
      const rawWord = (modelWordsRaw[idx] || normWord).toLowerCase();
      missing.push(rawWord);
    }
  });

  const extra = userWords.filter(w => !modelSet.has(w) && !stopWords.has(w));

  // ---- スコア計算 (1〜5) ----
  let score;
  if (wordScore >= 0.85)      score = 5;
  else if (wordScore >= 0.70) score = 4;
  else if (wordScore >= 0.50) score = 3;
  else if (wordScore >= 0.30) score = 2;
  else                        score = 1;

  // ---- コメント生成 ----
  const comments = [];

  if (score === 5) {
    comments.push('完璧です！模範解答とほぼ一致しています。');
  } else if (score === 4) {
    comments.push('ほぼ正解です。細かい表現の違いがあります。');
  } else if (score === 3) {
    comments.push('概ね伝わりますが、いくつか改善点があります。');
  } else {
    comments.push('模範解答と大きく異なります。下の模範解答を確認しましょう。');
  }

  if (missing.length > 0) {
    const shown = missing.slice(0, 4).map(w => `"${w}"`).join('、');
    comments.push(`使えていないキーワード: ${shown}`);
  }
  if (extra.length > 0 && score < 4) {
    const shown = extra.slice(0, 3).map(w => `"${w}"`).join('、');
    comments.push(`模範解答にない単語: ${shown}`);
  }

  // 大文字始まりチェック
  if (userRaw.length > 0 && userRaw[0] !== userRaw[0].toUpperCase()) {
    comments.push('文頭は大文字で始めましょう。');
  }
  // ピリオド終わりチェック
  if (userRaw.length > 0 && !/[.!?]$/.test(userRaw.trim())) {
    comments.push('文末にピリオド(.)を忘れずに。');
  }

  return {
    score,
    comment:      comments.join(' '),
    corrected:    score >= 4 ? userRaw : modelRaw,
    // 辞書にヒットする単語を優先、なければ残りを補完（最大5語）
    missingWords: [
      ...missing.filter(w => lookupWord(w) !== null),
      ...missing.filter(w => lookupWord(w) === null),
    ].slice(0, 5),
  };
}

// ---------- 音声認識 ----------
function initSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  const rec = new SR();
  rec.lang = 'en-US';
  rec.continuous = false;
  rec.interimResults = true;

  rec.onresult = (e) => {
    let interim = '', final = '';
    for (const r of e.results) {
      if (r.isFinal) final += r[0].transcript;
      else interim += r[0].transcript;
    }
    document.getElementById('interim-text').textContent = interim || final;
    if (final) {
      stopRecording();
      showTranscript(final.trim());
    }
  };

  rec.onerror = (e) => {
    stopRecording();
    const msg = document.getElementById('mic-status-msg');
    if (e.error === 'not-allowed') {
      msg.textContent = '⚠️ マイクへのアクセスが拒否されました。ブラウザのアドレスバー左のアイコンから許可してください。';
    } else if (e.error === 'network') {
      msg.textContent = '⚠️ 音声認識にはインターネット接続が必要です。';
    } else if (e.error === 'no-speech') {
      msg.textContent = '音声が検出されませんでした。もう一度お試しください。';
    } else {
      msg.textContent = `音声認識エラー: ${e.error}`;
    }
  };

  rec.onend = () => { if (state.isRecording) stopRecording(); };

  return rec;
}

function checkMicSupport() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const notice = document.getElementById('mic-notice');
  if (!SR) {
    notice.textContent = '⚠️ このブラウザは音声認識に対応していません。Chrome または Edge をお使いください。';
    return false;
  }
  if (location.protocol === 'file:') {
    notice.textContent = '⚠️ file:// では音声認識が使えないブラウザがあります。動かない場合は「テキスト入力」タブをご利用ください。';
  }
  return true;
}

function startRecording() {
  if (!state.recognition) {
    switchTab('text');
    document.getElementById('mic-status-msg').textContent = 'このブラウザは音声認識に対応していません。';
    return;
  }
  state.isRecording = true;
  document.getElementById('mic-btn').classList.add('recording');
  document.getElementById('mic-label').textContent = '録音中... (もう一度タップで停止)';
  document.getElementById('interim-text').textContent = '';
  document.getElementById('mic-status-msg').textContent = '';
  try {
    state.recognition.start();
  } catch (e) {
    stopRecording();
    document.getElementById('mic-status-msg').textContent = '音声認識を開始できませんでした。テキスト入力をお試しください。';
  }
}

function stopRecording() {
  state.isRecording = false;
  const btn = document.getElementById('mic-btn');
  if (btn) {
    btn.classList.remove('recording');
    document.getElementById('mic-label').textContent = 'タップして音声入力';
  }
  try { state.recognition && state.recognition.stop(); } catch {}
}

function showTranscript(text) {
  document.getElementById('mic-panel').classList.add('hidden');
  document.getElementById('text-panel').classList.add('hidden');
  document.getElementById('transcript-section').classList.remove('hidden');
  document.getElementById('transcript-display').textContent = text;
}

// ---------- タブ切り替え ----------
function switchTab(tab) {
  state.activeTab = tab;
  document.getElementById('tab-mic').classList.toggle('active', tab === 'mic');
  document.getElementById('tab-text').classList.toggle('active', tab === 'text');
  document.getElementById('mic-panel').classList.toggle('hidden', tab !== 'mic');
  document.getElementById('text-panel').classList.toggle('hidden', tab !== 'text');
}

// ---------- UI ----------
function renderQuestion() {
  const q     = state.questions[state.currentIndex];
  const total = state.questions.length;

  document.getElementById('progress-text').textContent = `${state.currentIndex + 1} / ${total}`;
  document.getElementById('progress-fill').style.width = `${((state.currentIndex + 1) / total) * 100}%`;
  document.getElementById('source-badge').textContent  = q.source || '📚 サンプル';
  document.getElementById('japanese-text').textContent = q.ja;

  // リセット
  document.getElementById('answer-area').classList.remove('hidden');
  document.getElementById('result-area').classList.add('hidden');
  document.getElementById('transcript-section').classList.add('hidden');
  document.getElementById('interim-text').textContent = '';
  document.getElementById('mic-status-msg').textContent = '';
  document.getElementById('text-input').value = '';

  // タブをデフォルトに戻す
  const hasMic = !!state.recognition;
  switchTab(hasMic ? 'mic' : 'text');
  document.getElementById('mic-panel').classList.toggle('hidden', !hasMic);
  document.getElementById('tab-mic').style.display = hasMic ? '' : 'none';
}

function submitAnswer(userAnswer) {
  if (!userAnswer.trim()) {
    alert('回答を入力してください。');
    return;
  }

  const q = state.questions[state.currentIndex];

  // 添削（同期・ルールベース）
  const grade = gradeAnswer(userAnswer, q.en);
  const isCorrect = grade.score >= 4;

  state.results.push({ question: q, userAnswer, score: grade.score, correct: isCorrect });

  // 復習リスト更新
  const reviewList = getReviewList().filter(r => r.ja !== q.ja);
  if (!isCorrect) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    reviewList.push({ ja: q.ja, en: q.en, reviewDate: tomorrow.toISOString().slice(0, 10) });
  }
  saveReviewList(reviewList);

  // スコアバッジ
  let badgeClass, badgeText;
  if (grade.score >= 4)      { badgeClass = 'good'; badgeText = `⭐ ${grade.score}/5 — 素晴らしい！`; }
  else if (grade.score === 3){ badgeClass = 'ok';   badgeText = `👍 ${grade.score}/5 — もう少し！`; }
  else                       { badgeClass = 'bad';  badgeText = `📝 ${grade.score}/5 — 要復習`; }

  // 修正案の表示
  const correctedHtml = (grade.corrected && grade.corrected !== userAnswer)
    ? `<p style="margin-bottom:8px"><strong>修正案:</strong> ${escHtml(grade.corrected)}</p>`
    : '';

  document.getElementById('answer-area').classList.add('hidden');
  document.getElementById('result-area').classList.remove('hidden');

  // 単語解説HTML生成
  const wordCards = grade.missingWords
    .map(w => {
      const info = lookupWord(w);
      if (!info) return '';
      return `
        <div class="word-card">
          <div class="word-card-header">
            <span class="word-en">${escHtml(w)}</span>
            <button class="btn-speak-word" data-word="${escHtml(w)}" title="発音を聞く">🔊</button>
          </div>
          <div class="word-ja">${escHtml(info.ja)}</div>
          <div class="word-ex"><span class="word-ex-label">例文</span> ${escHtml(info.ex)}</div>
        </div>`;
    })
    .filter(Boolean)
    .join('');

  const wordSectionHtml = wordCards
    ? `<div class="result-section">
        <label class="field-label">📖 使えていなかった単語</label>
        <div class="word-cards">${wordCards}</div>
       </div>`
    : '';

  document.getElementById('result-area').innerHTML = `
    <div class="score-badge ${badgeClass}">${badgeText}</div>
    <div class="result-section">
      <label class="field-label">あなたの回答</label>
      <p class="user-answer">${escHtml(userAnswer)}</p>
    </div>
    <div class="result-section">
      <label class="field-label">✏️ 添削・解説</label>
      <div class="correction-text">
        ${correctedHtml}
        <p>${escHtml(grade.comment)}</p>
      </div>
    </div>
    <div class="result-section">
      <label class="field-label">💡 模範解答</label>
      <div class="model-answer-row">
        <p class="model-answer" id="model-answer-text">${escHtml(q.en)}</p>
        <button class="btn-speak" id="speak-btn" title="模範解答を読み上げる">🔊 読み上げ</button>
      </div>
    </div>
    ${wordSectionHtml}
    <button id="next-btn" class="btn btn-primary btn-full">
      ${state.currentIndex + 1 < state.questions.length ? '次の問題へ →' : '結果を見る 🎉'}
    </button>`;

  // 読み上げボタン（模範解答）
  document.getElementById('speak-btn').addEventListener('click', () => {
    speak(q.en);
  });

  // 単語ごとの読み上げボタン
  document.querySelectorAll('.btn-speak-word').forEach(btn => {
    btn.addEventListener('click', () => speak(btn.dataset.word, 0.8));
  });

  document.getElementById('next-btn').addEventListener('click', nextQuestion);
}

function nextQuestion() {
  state.currentIndex++;
  if (state.currentIndex >= state.questions.length) showComplete();
  else renderQuestion();
}

function showComplete() {
  const correct = state.results.filter(r => r.correct).length;
  const wrong   = state.results.length - correct;
  const pct     = Math.round((correct / state.results.length) * 100);

  document.getElementById('stat-correct').textContent = correct;
  document.getElementById('stat-wrong').textContent   = wrong;
  document.getElementById('stat-score').textContent   = pct + '%';
  document.getElementById('review-note').textContent  = wrong > 0
    ? `明日は ${wrong} 問の復習問題が出題されます。`
    : '全問正解！明日も新しい問題に挑戦しましょう。';

  showScreen('complete-screen');
}

// ---------- 初期化 ----------
function init() {
  // 保存済みNewsAPIキーを読み込む
  const savedKey = localStorage.getItem(STORAGE_KEYS.NEWS_KEY) || '';
  document.getElementById('news-key').value = savedKey;

  // 音声認識セットアップ
  state.recognition = initSpeechRecognition();
  checkMicSupport();

  // ===== イベントリスナー =====

  // 学習開始
  document.getElementById('start-btn').addEventListener('click', async () => {
    const newsKey = document.getElementById('news-key').value.trim();
    if (!newsKey) {
      alert('NewsAPI キーを入力してください。\nhttps://newsapi.org で無料取得できます。');
      return;
    }

    state.newsKey = newsKey;
    localStorage.setItem(STORAGE_KEYS.NEWS_KEY, newsKey);

    // ローディング画面へ
    showScreen('loading-screen');

    try {
      state.questions = await prepareQuestions(newsKey, (msg) => {
        document.getElementById('loading-msg').textContent = msg;
      });
      state.currentIndex = 0;
      state.results      = [];
      showScreen('practice-screen');
      renderQuestion();
    } catch (e) {
      alert('問題の準備に失敗しました: ' + e.message);
      showScreen('setup-screen');
    }
  });

  // タブ切り替え
  document.getElementById('tab-mic').addEventListener('click',  () => switchTab('mic'));
  document.getElementById('tab-text').addEventListener('click', () => switchTab('text'));

  // マイクボタン
  document.getElementById('mic-btn').addEventListener('click', () => {
    if (state.isRecording) stopRecording();
    else startRecording();
  });

  // テキスト入力で回答
  document.getElementById('text-submit-btn').addEventListener('click', () => {
    const text = document.getElementById('text-input').value.trim();
    if (text) showTranscript(text);
    else alert('英文を入力してください。');
  });

  // Enterキー送信（Shift+Enterは改行）
  document.getElementById('text-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('text-submit-btn').click();
    }
  });

  // やり直す
  document.getElementById('retry-btn').addEventListener('click', () => {
    document.getElementById('transcript-section').classList.add('hidden');
    document.getElementById('interim-text').textContent = '';
    document.getElementById('text-input').value = '';
    switchTab(state.recognition ? 'mic' : 'text');
    document.getElementById('mic-panel').classList.toggle('hidden', !state.recognition);
    document.getElementById('text-panel').classList.toggle('hidden', !!state.recognition);
  });

  // 添削する
  document.getElementById('submit-btn').addEventListener('click', () => {
    const answer = document.getElementById('transcript-display').textContent.trim();
    submitAnswer(answer);
  });

  // 設定ボタン
  document.getElementById('settings-btn').addEventListener('click', () => {
    if (confirm('トップ画面に戻りますか？現在の進捗は失われます。')) {
      showScreen('setup-screen');
    }
  });

  // 明日また学習する
  document.getElementById('restart-btn').addEventListener('click', () => {
    showScreen('setup-screen');
  });
}

document.addEventListener('DOMContentLoaded', init);
