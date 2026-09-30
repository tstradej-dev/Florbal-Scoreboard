const CLUB_LOGO = 'https://tjslovanhavirov.eoscms.cz/webimages/club_logo_filename_20240429_051352.png';

const palettes = [
  { name: 'Žlutá', value: '#f3c316' },
  { name: 'Červená', value: '#e5484d' },
  { name: 'Zelená', value: '#3fa66b' },
  { name: 'Oranžová', value: '#f28c28' },
  { name: 'Fialová', value: '#815ac0' },
  { name: 'Černá', value: '#24262b' }
];

const state = {
  courts: [
    { score: [0, 0], opponent: '#f3c316', history: [] },
    { score: [0, 0], opponent: '#e5484d', history: [] }
  ],
  settingsOpen: false,
  lastAction: null
};

const app = document.querySelector('#app');

function render() {
  app.innerHTML = `
    <main class="screen">
      <header class="header">
        <div class="club"><img src="${CLUB_LOGO}" alt="Slovan Havířov" onerror="this.style.display='none'" /><div><span>FLORBAL</span><strong>SLOVAN HAVÍŘOV</strong></div></div>
        <button class="icon-button" id="settings" aria-label="Nastavení">⚙</button>
      </header>
      <section class="scoreboards">
        ${state.courts.map((court, index) => courtMarkup(court, index)).join('')}
      </section>
      <div class="tip"><span>👆</span> Klepni na barvu = gól &nbsp;·&nbsp; přejeď doleva = −1</div>
      ${state.lastAction ? `<button class="undo" id="undo">↶ Poslední změna</button>` : ''}
      ${state.settingsOpen ? settingsMarkup() : ''}
    </main>
  `;
  bind();
}

function courtMarkup(court, index) {
  return `
    <article class="court" data-court="${index}">
      <div class="court-top"><span>HŘIŠTĚ ${index + 1}</span><button class="reset" data-reset="${index}">NOVÝ ZÁPAS</button></div>
      <div class="score-area" data-score-area="${index}">
        <button class="team slovan" data-team="0" style="--team:#1c65d8">
          <img src="${CLUB_LOGO}" alt="" onerror="this.style.display='none'" />
          <span>SLOVAN</span>
          <b>${court.score[0]}</b>
          <i>+1</i>
        </button>
        <div class="versus">:</div>
        <button class="team opponent" data-team="1" style="--team:${court.opponent}">
          <span class="color-dot"></span>
          <span>SOUPEŘ</span>
          <b>${court.score[1]}</b>
          <i>+1</i>
        </button>
      </div>
      <div class="swipe-hint">← přejetím doleva odečteš gól</div>
    </article>
  `;
}

function settingsMarkup() {
  return `
    <div class="settings-panel">
      <div class="settings-head"><strong>Barva soupeře</strong><button id="close-settings">×</button></div>
      <div class="settings-courts">
        ${state.courts.map((court, index) => `
          <div class="settings-court"><span>Hřiště ${index + 1}</span><div class="colors">${palettes.map(p => `<button class="color-choice ${court.opponent === p.value ? 'selected' : ''}" title="${p.name}" style="background:${p.value}" data-court-color="${index}" data-color="${p.value}"></button>`).join('')}</div></div>
        `).join('')}
      </div>
    </div>
  `;
}

function addGoal(courtIndex, team, delta = 1) {
  const court = state.courts[courtIndex];
  const previous = [...court.score];
  court.score[team] = Math.max(0, court.score[team] + delta);
  court.history.push({ previous, next: [...court.score], team, delta });
  state.lastAction = { courtIndex };
  render();
  const el = document.querySelector(`[data-court="${courtIndex}"] [data-team="${team}"]`);
  el?.classList.add(delta > 0 ? 'goal' : 'minus');
  if (navigator.vibrate) navigator.vibrate(delta > 0 ? 30 : [20, 20, 20]);
}

function undo() {
  if (!state.lastAction) return;
  const court = state.courts[state.lastAction.courtIndex];
  const action = court.history.pop();
  if (!action) return;
  court.score = action.previous;
  state.lastAction = null;
  render();
}

function reset(courtIndex) {
  const court = state.courts[courtIndex];
  if (!confirm(`Vynulovat skóre na hřišti ${courtIndex + 1}?`)) return;
  court.score = [0, 0];
  court.history = [];
  state.lastAction = null;
  render();
}

function bind() {
  document.querySelector('#settings')?.addEventListener('click', () => { state.settingsOpen = true; render(); });
  document.querySelector('#close-settings')?.addEventListener('click', () => { state.settingsOpen = false; render(); });
  document.querySelector('#undo')?.addEventListener('click', undo);

  document.querySelectorAll('[data-reset]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); reset(Number(btn.dataset.reset)); }));
  document.querySelectorAll('[data-court-color]').forEach(btn => btn.addEventListener('click', () => {
    state.courts[Number(btn.dataset.courtColor)].opponent = btn.dataset.color;
    render();
    state.settingsOpen = true;
  }));

  document.querySelectorAll('.team').forEach(button => {
    button.addEventListener('click', () => addGoal(Number(button.closest('.court').dataset.court), Number(button.dataset.team), 1));
    let startX = 0;
    button.addEventListener('touchstart', e => { startX = e.changedTouches[0].clientX; }, { passive: true });
    button.addEventListener('touchend', e => {
      const diff = e.changedTouches[0].clientX - startX;
      if (diff < -60) {
        e.preventDefault();
        addGoal(Number(button.closest('.court').dataset.court), Number(button.dataset.team), -1);
      }
    }, { passive: false });
  });
}

render();
