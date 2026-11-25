import './style.css';
import { icon } from './icons';
import {
  BEST_PREFIX,
  compareBest,
  createShuffledNumbers,
  formatTime,
  GRID_SIZES,
  isSolved,
  parseBest,
  progressAfterTap,
  serializeBest,
  SOUND_KEY,
  type BestScore,
  type GridSize,
} from './engine';

type Phase = 'ready' | 'playing' | 'complete';
type Mood = 'idle' | 'watching' | 'happy' | 'wobble';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div class="page-grain" aria-hidden="true"></div>
  <div class="shell">
    <header class="site-header">
      <a class="brand" href="./" aria-label="寻数方格首页">
        <span class="brand-mark" aria-hidden="true">${icon('eye')}</span>
        <span class="brand-copy">寻数方格<small>SCHULTE GRID</small></span>
      </a>
      <div class="club-mark"><span>JOKE BEAR CLUB</span><b>专注练习 02</b></div>
    </header>

    <section class="hero" aria-labelledby="page-title">
      <div class="hero-copy">
        <p class="eyebrow"><span></span> 视线散开，数字排队</p>
        <h1 id="page-title">把乱掉的数字<br /><em>一颗颗找回来。</em></h1>
        <p class="hero-lead">这就是经典的舒尔特方格。数字被打散在方阵里，从 1 开始按顺序点到最后；不点错会更快，但稳住眼神更重要。</p>
      </div>
      <div class="hero-sticker" aria-hidden="true">
        <span class="sticker-ring"></span>
        <span class="sticker-note">FOCUS</span>
        <span class="sticker-bear">${icon('paw')}</span>
        <span class="sticker-small">EYES WIDE</span>
      </div>
    </section>

    <section class="game-layout" aria-label="舒尔特方格游戏">
      <div class="game-card" id="game">
        <div class="game-topline">
          <div class="size-picker" role="group" aria-label="选择方格尺寸">
            ${GRID_SIZES.map(size => `<button class="size-button" type="button" data-size="${size}" aria-pressed="${size === 5}"><span>${size}×${size}</span><small>${size * size} 格</small></button>`).join('')}
          </div>
          <div class="stat-strip">
            <div class="mini-stat"><span>用时</span><b id="time">00:00.0</b></div>
            <div class="mini-stat"><span>失误</span><b><span id="mistakes">0</span><small> 次</small></b></div>
          </div>
          <button class="icon-button sound-button" id="sound" type="button" aria-label="关闭音效" aria-pressed="true">${icon('sound')}</button>
        </div>

        <div class="status-line">
          <span class="status-light" id="statusLight" aria-hidden="true"></span>
          <p id="statusText">选好尺寸后，点击开始。</p>
          <span class="turn-tag" id="turnTag">准备</span>
        </div>

        <div class="target-bar">
          <span class="target-label">现在找</span>
          <span class="target-number" id="target">1</span>
          <div class="target-progress" aria-hidden="true"><span id="targetFill"></span></div>
          <span class="target-count" id="progressText">0 / 25</span>
        </div>

        <div class="board-wrap">
          <div class="board" id="board" role="grid" aria-label="数字方格棋盘" data-size="5"></div>
        </div>

        <div class="game-actions">
          <button class="primary-button" id="start" type="button"><span>开始计时</span>${icon('timer')}</button>
          <button class="text-button" id="restart" type="button">${icon('restart')}<span>重新打乱</span></button>
        </div>
        <p class="key-hint">先想好数字落点，再下手；手机屏幕上也尽量用余光扫全图。</p>
      </div>

      <aside class="side-column">
        <div class="companion-card" id="companion" data-mood="idle">
          <div class="companion-top">
            <div class="bear-frame">
              <img class="bear-photo" id="bearImg" src="./characters/classic.webp" alt="Joke Bear 小熊伙伴" />
              <svg class="bear-fallback" hidden viewBox="0 0 120 120" role="img" aria-label="手绘小熊伙伴">
                <path d="M60 23c-20 0-36 14-36 37 0 15 8 27 21 32v11h30V92c13-5 21-17 21-32 0-23-16-37-36-37Z" fill="#f7f3e9" stroke="#203e34" stroke-width="4"/>
                <circle cx="39" cy="26" r="10" fill="#f7f3e9" stroke="#203e34" stroke-width="4"/>
                <circle cx="81" cy="26" r="10" fill="#f7f3e9" stroke="#203e34" stroke-width="4"/>
                <circle cx="47" cy="60" r="3" fill="#203e34"/><circle cx="73" cy="60" r="3" fill="#203e34"/>
                <path d="M52 72c5 5 11 5 16 0" fill="none" stroke="#203e34" stroke-width="3" stroke-linecap="round"/>
              </svg>
              <span class="bear-status" aria-hidden="true"></span>
            </div>
            <div class="speech-bubble">
              <span class="speech-label">小熊说</span>
              <div class="mood-face" id="moodFace" aria-hidden="true"></div>
            </div>
          </div>
          <p class="bear-line" id="bearLine">别看单颗数字，先让整张图住进眼睛里。</p>
          <div class="bear-signature"><span>JOKE BEAR</span><i></i><span>你的专注搭子</span></div>
        </div>

        <div class="best-card">
          <span class="best-icon" aria-hidden="true">${icon('trophy')}</span>
          <div>
            <span class="card-kicker">本档最佳</span>
            <p><b id="bestTime">--</b></p>
            <span class="best-note" id="bestNote">完成一次 5×5，就会留下纪录。</span>
          </div>
        </div>

        <div class="result-card" id="resultCard" hidden>
          <div class="result-stamp">FINISH</div>
          <div class="card-heading"><span>完成啦</span><span class="tiny-note" id="resultSize">5×5</span></div>
          <dl class="result-list">
            <div><dt>用时</dt><dd id="resultTime">--</dd></div>
            <div><dt>失误</dt><dd id="resultMistakes">0 次</dd></div>
            <div><dt>纪录</dt><dd id="resultBest">--</dd></div>
          </dl>
          <button class="secondary-button" id="again" type="button">再来一局</button>
        </div>

        <div class="how-card">
          <div class="card-heading"><span>怎么玩</span><span class="tiny-note">3 个小步骤</span></div>
          <ol class="how-list">
            <li><span class="how-icon">${icon('eye')}</span><div><b>视线铺开</b><p>别盯着一格，把整片方阵看进余光里。</p></div></li>
            <li><span class="how-icon">${icon('paw')}</span><div><b>按序点</b><p>从 1 开始，点到下一个更大的数字。</p></div></li>
            <li><span class="how-icon">${icon('spark')}</span><div><b>稳住节奏</b><p>失误会打断节奏；慢半拍，常常反而更快。</p></div></li>
          </ol>
        </div>
      </aside>
    </section>

    <footer class="site-footer">
      <span>${icon('paw')} JOKE BEAR 陪伴练习</span>
      <span>盯住目标，也照顾余光。</span>
    </footer>
    <p id="announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
  </div>
`;

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const game = $('#game');
const board = $('#board');
const startButton = $<HTMLButtonElement>('#start');
const restartButton = $<HTMLButtonElement>('#restart');
const againButton = $<HTMLButtonElement>('#again');
const soundButton = $<HTMLButtonElement>('#sound');
const sizeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-size]'));
const bearImg = $<HTMLImageElement>('#bearImg');
const announcement = $('#announcement');

function bestKey(size: GridSize): string {
  return `${BEST_PREFIX}${size}`;
}

function readBest(size: GridSize): BestScore | null {
  try {
    return parseBest(localStorage.getItem(bestKey(size)));
  } catch {
    return null;
  }
}

function writeBest(size: GridSize, best: BestScore): void {
  try {
    localStorage.setItem(bestKey(size), serializeBest(best));
  } catch {
    // Storage is optional.
  }
}

function readSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

const state = {
  size: 5 as GridSize,
  numbers: [] as number[],
  phase: 'ready' as Phase,
  target: 1,
  mistakes: 0,
  startedAt: 0,
  elapsed: 0,
  wrongValue: null as number | null,
  correctValue: null as number | null,
  muted: !readSound(),
};

let timer: number | undefined;
let wrongTimer: number | undefined;
let correctTimer: number | undefined;
let audio: AudioContext | null = null;

function announce(message: string): void {
  announcement.textContent = '';
  window.setTimeout(() => {
    announcement.textContent = message;
  }, 20);
}

function moodFor(): Mood {
  if (state.phase === 'complete') return 'happy';
  if (state.wrongValue !== null) return 'wobble';
  return state.phase === 'playing' ? 'watching' : 'idle';
}

function moodFace(mood: Mood): string {
  const eyes = mood === 'happy'
    ? '<path d="M18 24q6-8 12 0M40 24q6-8 12 0"/>'
    : mood === 'wobble'
      ? '<path d="M18 22l10 5M42 27l10-5"/><circle cx="23" cy="31" r="1.8" fill="currentColor" stroke="none"/><circle cx="47" cy="31" r="1.8" fill="currentColor" stroke="none"/>'
      : mood === 'watching'
        ? '<circle cx="23" cy="26" r="2.8" fill="currentColor" stroke="none"/><circle cx="47" cy="26" r="2.8" fill="currentColor" stroke="none"/><path d="M19 18h8M43 18h8"/>'
        : '<circle cx="23" cy="26" r="2.2" fill="currentColor" stroke="none"/><circle cx="47" cy="26" r="2.2" fill="currentColor" stroke="none"/>';
  const mouth = mood === 'happy'
    ? '<path d="M28 36q7 8 14 0"/>'
    : mood === 'wobble'
      ? '<path d="M29 41q6-6 12 0"/>'
      : mood === 'watching'
        ? '<path d="M32 38h6"/>'
        : '<path d="M30 38q5 4 10 0"/>';
  return `<svg viewBox="0 0 70 52" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${eyes}${mouth}</svg>`;
}

function statusCopy(): { text: string; tag: string } {
  if (state.phase === 'ready') return { text: '选好尺寸后，点击开始。', tag: '准备' };
  if (state.phase === 'complete') return { text: '整盘找到了，很稳。', tag: '完成' };
  return { text: `现在找 ${state.target}，失误 ${state.mistakes} 次。`, tag: '进行中' };
}

function bearCopy(): string {
  if (state.phase === 'complete') return '整盘都找齐了。刚才的节奏，值得记住。';
  if (state.wrongValue !== null) return '没关系，先找回中心，再继续。';
  if (state.phase === 'playing') return `现在找 ${state.target}。眼睛别急着跳，先扫全图。`;
  return '别看单颗数字，先让整张图住进眼睛里。';
}

function elapsedNow(): number {
  if (state.phase !== 'playing') return state.elapsed;
  return (performance.now() - state.startedAt) / 1000;
}

function totalCount(): number {
  return state.size * state.size;
}

function renderBoard(): void {
  if (!state.numbers.length) {
    board.innerHTML = '';
    return;
  }
  board.dataset.size = String(state.size);
  const foundBefore = state.target;
  board.innerHTML = state.numbers.map((value, index) => {
    const found = value < foundBefore || (state.phase === 'complete' && value <= totalCount());
    const wrong = state.wrongValue === value;
    const correct = state.correctValue === value && !found;
    const row = Math.floor(index / state.size) + 1;
    const col = (index % state.size) + 1;
    return `<button
      class="cell${found ? ' is-found' : ''}${wrong ? ' is-wrong' : ''}${correct ? ' is-correct' : ''}"
      type="button"
      data-value="${value}"
      role="gridcell"
      aria-label="第 ${row} 行第 ${col} 列，数字 ${value}${found ? '，已完成' : ''}"
      ${found ? 'disabled' : ''}
    ><span>${value}</span></button>`;
  }).join('');
}

function renderBest(): void {
  const best = readBest(state.size);
  $('#bestTime').textContent = best ? formatTime(best.seconds) : '--';
  $('#bestNote').textContent = best
    ? `${state.size}×${state.size} 最快 ${formatTime(best.seconds)}，失误 ${best.mistakes} 次。`
    : `完成一次 ${state.size}×${state.size}，就会留下纪录。`;
}

function render(): void {
  const status = statusCopy();
  const mood = moodFor();
  const total = totalCount();
  const done = state.phase === 'complete' ? total : Math.max(0, state.target - 1);
  $('#time').textContent = formatTime(state.phase === 'playing' ? elapsedNow() : state.elapsed);
  $('#mistakes').textContent = String(state.mistakes);
  $('#statusText').textContent = status.text;
  $('#turnTag').textContent = status.tag;
  $('#target').textContent = state.phase === 'complete' ? '✓' : String(Math.min(state.target, total));
  $('#targetFill').style.width = `${(done / total) * 100}%`;
  $('#progressText').textContent = `${done} / ${total}`;
  $('#bearLine').textContent = bearCopy();
  $('#moodFace').innerHTML = moodFace(mood);
  $('#companion').dataset.mood = mood;
  $('#statusLight').dataset.phase = state.phase;
  game.dataset.phase = state.phase;
  game.dataset.target = String(state.target);
  game.dataset.mistakes = String(state.mistakes);
  game.dataset.elapsed = formatTime(state.phase === 'playing' ? elapsedNow() : state.elapsed);
  startButton.hidden = state.phase !== 'ready';
  soundButton.setAttribute('aria-label', state.muted ? '开启音效' : '关闭音效');
  soundButton.setAttribute('aria-pressed', String(!state.muted));
  soundButton.innerHTML = icon(state.muted ? 'muted' : 'sound');
  for (const button of sizeButtons) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.size) === state.size));
    button.disabled = state.phase === 'playing';
  }
  renderBoard();
  renderBest();
}

function ensureAudio(): void {
  if (state.muted) return;
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume();
  } catch {
    state.muted = true;
  }
}

function toneAt(frequency: number, delay: number, duration: number, type: OscillatorType = 'sine', volume = 0.045): void {
  if (state.muted) return;
  ensureAudio();
  if (!audio) return;
  try {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = audio.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  } catch {
    // Audio feedback is optional.
  }
}

function stopTimer(): void {
  window.clearInterval(timer);
  timer = undefined;
}

function startTimer(): void {
  stopTimer();
  timer = window.setInterval(() => {
    $('#time').textContent = formatTime(elapsedNow());
    game.dataset.elapsed = formatTime(elapsedNow());
  }, 100);
}

function resetRound(): void {
  stopTimer();
  window.clearTimeout(wrongTimer);
  window.clearTimeout(correctTimer);
  state.numbers = createShuffledNumbers(state.size);
  state.phase = 'ready';
  state.target = 1;
  state.mistakes = 0;
  state.elapsed = 0;
  state.wrongValue = null;
  state.correctValue = null;
  $('#resultCard').hidden = true;
  render();
}

function startGame(): void {
  if (state.phase === 'playing') return;
  if (!state.numbers.length) resetRound();
  state.phase = 'playing';
  state.startedAt = performance.now();
  state.elapsed = 0;
  render();
  ensureAudio();
  startTimer();
  announce(`开始计时，请从 1 找到 ${totalCount()}。`);
  board.querySelector<HTMLButtonElement>('.cell')?.focus({ preventScroll: true });
}

function finishGame(): void {
  stopTimer();
  state.phase = 'complete';
  state.elapsed = elapsedNow();
  const score: BestScore = { seconds: state.elapsed, mistakes: state.mistakes, finishedAt: Date.now() };
  const best = compareBest(score, readBest(state.size));
  writeBest(state.size, best);
  toneAt(523.25, 0, 0.22, 'sine', 0.04);
  toneAt(659.25, 0.1, 0.3, 'sine', 0.035);
  $('#resultCard').hidden = false;
  $('#resultSize').textContent = `${state.size}×${state.size}`;
  $('#resultTime').textContent = formatTime(score.seconds);
  $('#resultMistakes').textContent = `${score.mistakes} 次`;
  $('#resultBest').textContent = `${formatTime(best.seconds)} / ${best.mistakes} 次`;
  render();
  announce(`完成，用时 ${formatTime(score.seconds)}，失误 ${score.mistakes} 次。`);
}

function handleCell(value: number, button: HTMLButtonElement): void {
  if (state.phase !== 'playing') return;
  const next = progressAfterTap(value, state.target);
  if (next === state.target) {
    state.mistakes += 1;
    state.wrongValue = value;
    toneAt(130, 0, 0.18, 'triangle', 0.03);
    render();
    announce(`找错了，现在还是要找 ${state.target}。`);
    window.clearTimeout(wrongTimer);
    wrongTimer = window.setTimeout(() => {
      state.wrongValue = null;
      render();
    }, 520);
    return;
  }

  state.target = next;
  state.correctValue = value;
  toneAt(392 + Math.min(20, value) * 6, 0, 0.1, 'sine', 0.025);
  window.clearTimeout(correctTimer);
  correctTimer = window.setTimeout(() => {
    state.correctValue = null;
    render();
  }, 180);
  button.disabled = true;

  if (isSolved(state.target, state.size)) {
    render();
    finishGame();
    return;
  }

  render();
  announce(`正确，下一颗是 ${state.target}。`);
  const nextCell = board.querySelector<HTMLButtonElement>(`[data-value="${state.target}"]`);
  nextCell?.focus({ preventScroll: true });
}

board.addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-value]');
  if (button) handleCell(Number(button.dataset.value), button);
});

startButton.addEventListener('click', startGame);
againButton.addEventListener('click', () => {
  resetRound();
  startGame();
});
restartButton.addEventListener('click', () => {
  resetRound();
  announce('数字已重新打乱。');
  startButton.focus({ preventScroll: true });
});

for (const button of sizeButtons) {
  button.addEventListener('click', () => {
    const size = Number(button.dataset.size) as GridSize;
    if (size === state.size) return;
    state.size = size;
    resetRound();
    announce(`已切换为 ${size} 乘 ${size}。`);
  });
}

soundButton.addEventListener('click', () => {
  state.muted = !state.muted;
  try {
    localStorage.setItem(SOUND_KEY, state.muted ? 'off' : 'on');
  } catch {
    // Ignore storage failures.
  }
  if (!state.muted) {
    ensureAudio();
    toneAt(392, 0, 0.18, 'sine', 0.035);
  }
  render();
  announce(state.muted ? '音效已关闭。' : '音效已开启。');
});

bearImg.addEventListener('error', () => {
  bearImg.hidden = true;
  const fallback = bearImg.nextElementSibling;
  if (fallback instanceof SVGElement) fallback.removeAttribute('hidden');
});

window.addEventListener('pagehide', stopTimer);
resetRound();
