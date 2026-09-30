const CLUB_LOGO = 'https://tjslovanhavirov.eoscms.cz/webimages/club_logo_filename_20240429_051352.png';

const palettes = [
  { name: 'Červená', value: '#e5484d' },
  { name: 'Žlutá', value: '#f3c316' },
  { name: 'Zelená', value: '#3fa66b' },
  { name: 'Oranžová', value: '#f28c28' },
  { name: 'Fialová', value: '#815ac0' },
  { name: 'Černá', value: '#24262b' }
];

const state = {
  courts: [
    { score: [0, 0], history: [] },
    { score: [0, 0], history: [] }
  ],
  opponentColor: '#e5484d',
  settingsOpen: false,
  lastAction: null
};

const app = document.querySelector('#app');

function render() {
  const totalSlovan = state.courts.reduce((sum, court) => sum + court.score[0], 0);
  const totalOpponent = state.courts.reduce((sum, court) => sum + court.score[1], 0);

  app.innerHTML = `
    <main class="screen">
      <header class="header">
        <div class="club"><img src="${CLUB_LOGO}" alt="Slovan Havířov" onerror="this.style.display='none'" /><div><span>FLORBAL</span><strong>SLOVAN HAVÍŘOV</strong></div></div>
        <button class="icon-button" id="settings" aria-label="Nastavení">⚙</button>
      </header>
      <section class="scoreboards">
        ${state.courts.map((court, index) => courtMarkup(court, index)).join('')}
      </section>
      <section class="total-score" aria-label="Součet skóre obou hřišť">
        <div class="total-team total-slovan"><span>SLOVAN</span><b>${totalSlovan}</b></div>
        <div class="total-separator">:</div>
        <div class="total-team total-opponent"><span>SOUPEŘ</span><b>${totalOpponent}</b></div>
      </section>
      <button class="reset-all" id="reset-all">↻ Vynulovat obě hřiště</button>
      <div class="tip"><span>👆</span> Klepni na barvu = gól &nbsp;·&nbsp; přejeď doleva = −1</div>
      ${state.lastAction ? `<button class="undo" id="undo">↶ Poslední změna</button>` : ''}
      ${settingsMarkup()}
    </main>
  `;
  bind();
}

function courtMarkup(court, index) {
  return `
    <article class="court" data-court="${index}">
      <div class="court-top"><span>HŘIŠTĚ ${index + 1}</span></div>
      <div class="score-area" data-score-area="${index}">
        <div class="goal-mark goal-top" aria-hidden="true"></div>
        <button class="team slovan" data-team="0" style="--team:#1c65d8">
          <img src="${CLUB_LOGO}" alt="" onerror="this.style.display='none'" />
          <span>SLOVAN</span>
          <b>${court.score[0]}</b>
          <i>+1</i>
        </button>
        <button class="team opponent" data-team="1" style="--team:${state.opponentColor}">
          <span>SOUPEŘ</span>
          <b>${court.score[1]}</b>
          <i>+1</i>
        </button>
        <div class="goal-mark goal-bottom" aria-hidden="true"></div>
        <div class="court-lines" aria-hidden="true"></div>
      </div>
      <div class="swipe-hint">← přejetím doleva odečteš gól</div>
    </article>
  `;
}

function settingsMarkup() {
  return `
    <div class="settings-panel" style="${state.settingsOpen ? '' : 'display:none'}">
      <div class="settings-head"><strong>Barva soupeře</strong><button id="close-settings">×</button></div>
      <p class="settings-note">Stejná barva platí pro obě hřiště.</p>
      <div class="colors">${palettes.map(p => `<button class="color-choice ${state.opponentColor === p.value ? 'selected' : ''}" title="${p.name}" style="background:${p.value}" data-color="${p.value}"></button>`).join('')}</div>
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

function resetAll() {
  if (!confirm('Vynulovat skóre na obou hřištích?')) return;
  state.courts.forEach(court => {
    court.score = [0, 0];
    court.history = [];
  });
  state.lastAction = null;
  render();
}

function bind() {
  document.querySelector('#settings')?.addEventListener('click', () => { state.settingsOpen = true; render(); });
  document.querySelector('#close-settings')?.addEventListener('click', () => { state.settingsOpen = false; render(); });
  document.querySelector('#undo')?.addEventListener('click', undo);
  document.querySelector('#reset-all')?.addEventListener('click', resetAll);

  document.querySelectorAll('[data-color]').forEach(btn => btn.addEventListener('click', () => {
    state.opponentColor = btn.dataset.color;
    state.settingsOpen = true;
    render();
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
