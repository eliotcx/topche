(() => {
  'use strict';

  const CONFIG = Object.freeze({
    apiBase: 'https://top-ches-leaderboard.topche.workers.dev',
    turnstileSiteKey: '0x4AAAAAAFC8mKL-RJpcUWD6',
    rulesVersion: 'v74',
    ...window.TOPCHE_LEADERBOARD_CONFIG
  });
  const PROFILE_KEY = 'topCheGlobalLeaderboardProfile';
  const OFFLINE_KEY = 'topCheLeaderboardOffline';
  const REQUEST_TIMEOUT = 9000;
  const BLOCKED_EXACT = new Set(['admin','administrator','moderator','system','support','official','owner','staff','root','fuck','fucker','fucking','shit','bitch','cunt','dick','penis','pussy','whore','slut','nigger','nigga','faggot','retard','rapist','nazi','hitler']);
  const BLOCKED_CONTAINS = ['fuck','shit','bitch','cunt','penis','pussy','whore','nigger','nigga','faggot','rapist','porn'];
  const state = { levels: [], currentLevel: 1, profile: readProfile(), completionRequest: 0 };

  const ui = {
    openButton: document.getElementById('globalLeaderboardButton'),
    usernameDialog: document.getElementById('usernameDialog'),
    usernameForm: document.getElementById('usernameForm'),
    usernameInput: document.getElementById('leaderboardUsername'),
    usernameCounter: document.getElementById('usernameCounter'),
    usernameStatus: document.getElementById('usernameStatus'),
    offlineButton: document.getElementById('leaderboardOfflineButton'),
    dialog: document.getElementById('globalLeaderboardDialog'),
    closeButton: document.getElementById('closeGlobalLeaderboard'),
    levelSelect: document.getElementById('leaderboardLevelSelect'),
    list: document.getElementById('globalLeaderboardList'),
    rankCard: document.getElementById('globalRankCard'),
    status: document.getElementById('globalLeaderboardStatus'),
    playerTag: document.getElementById('globalPlayerTag'),
    turnstileMount: document.getElementById('turnstileMount')
  };

  function readProfile() {
    try {
      const value = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
      return value?.username && value?.token ? value : null;
    } catch {
      return null;
    }
  }

  function saveProfile(profile) {
    state.profile = profile;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.removeItem(OFFLINE_KEY);
    updatePlayerTag();
  }

  function openDialog(dialog) {
    if (!dialog) return;
    try { dialog.showModal(); } catch { dialog.setAttribute('open', ''); }
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  function setStatus(element, message = '', kind = '') {
    if (!element) return;
    element.textContent = message;
    element.dataset.kind = kind;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  }

  function formatScore(score) {
    return Number(score || 0).toLocaleString('en-CA');
  }

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    const headers = { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers };
    if (state.profile?.token) headers.Authorization = `Bearer ${state.profile.token}`;
    try {
      const response = await fetch(`${CONFIG.apiBase}${path}`, { ...options, headers, signal: controller.signal });
      let payload = {};
      try { payload = await response.json(); } catch { /* An empty error response is handled below. */ }
      if (!response.ok) {
        const error = new Error(payload.error || 'The Global Leaderboard is temporarily unavailable.');
        error.status = response.status;
        error.code = payload.code;
        throw error;
      }
      return payload;
    } finally {
      clearTimeout(timer);
    }
  }

  function waitForTurnstile() {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const check = () => {
        if (window.turnstile?.render) resolve(window.turnstile);
        else if (Date.now() - started > 9000) reject(new Error('Security check could not load. Check your connection and try again.'));
        else setTimeout(check, 120);
      };
      check();
    });
  }

  async function getTurnstileToken() {
    const turnstile = await waitForTurnstile();
    if (!ui.turnstileMount) throw new Error('Security check is unavailable.');
    ui.turnstileMount.replaceChildren();
    return new Promise((resolve, reject) => {
      let widgetId, settled = false;
      const timeout = setTimeout(() => finish(reject)(new Error('Security check timed out. Check your connection and try again.')), 20000);
      const finish = callback => value => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        try { if (widgetId !== undefined) turnstile.remove(widgetId); } catch { /* Widget already removed. */ }
        callback(value);
      };
      try {
        widgetId = turnstile.render(ui.turnstileMount, {
          sitekey: CONFIG.turnstileSiteKey,
          action: 'create_player',
          appearance: 'interaction-only',
          execution: 'execute',
          callback: finish(resolve),
          'error-callback': finish(() => reject(new Error('Security check failed. Please try again.'))),
          'expired-callback': finish(() => reject(new Error('Security check expired. Please try again.'))),
          'timeout-callback': finish(() => reject(new Error('Security check timed out. Please try again.'))),
          'unsupported-callback': finish(() => reject(new Error('This browser could not run the security check.')))
        });
        turnstile.execute(widgetId);
      } catch {
        finish(reject)(new Error('Security check could not start. Refresh the page and try again.'));
      }
    });
  }

  function validateUsername(raw) {
    const username = String(raw || '').trim();
    if (!username) return { error: 'Enter a rink name.' };
    if (username.length > 8) return { error: 'Use no more than 8 characters.' };
    if (!/^[A-Za-z0-9]+$/.test(username)) return { error: 'Use letters and numbers only.' };
    const normalized = username.toLowerCase().replace(/[01345789]/g, value => ({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','9':'g'})[value]).replace(/(.)\1{2,}/g,'$1');
    if (BLOCKED_EXACT.has(normalized) || BLOCKED_CONTAINS.some(term => normalized.includes(term))) return { error: 'Please choose a different rink name.' };
    return { username };
  }

  async function createPlayer(event) {
    event.preventDefault();
    const validation = validateUsername(ui.usernameInput?.value);
    if (validation.error) {
      setStatus(ui.usernameStatus, validation.error, 'error');
      ui.usernameInput?.focus();
      return;
    }
    const submit = ui.usernameForm?.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    setStatus(ui.usernameStatus, 'Running security check…', 'loading');
    try {
      const turnstileToken = await getTurnstileToken();
      setStatus(ui.usernameStatus, 'Checking availability…', 'loading');
      const response = await request('/api/players', {
        method: 'POST',
        body: JSON.stringify({ username: validation.username, turnstileToken })
      });
      saveProfile({ username: response.player.username, token: response.token, playerId: response.player.id });
      setStatus(ui.usernameStatus, `Welcome, ${response.player.username}!`, 'success');
      setTimeout(() => closeDialog(ui.usernameDialog), 360);
    } catch (error) {
      const message = error.status === 409 ? 'That rink name is already taken. Try another.' : error.message;
      setStatus(ui.usernameStatus, message, 'error');
    } finally {
      if (submit) submit.disabled = false;
    }
  }

  function updatePlayerTag() {
    if (!ui.playerTag) return;
    ui.playerTag.hidden = !state.profile;
    const name = ui.playerTag.querySelector('strong');
    if (name) name.textContent = state.profile?.username || '';
  }

  function setLevels(levels) {
    state.levels = Array.isArray(levels) ? levels : [];
    if (!ui.levelSelect) return;
    ui.levelSelect.innerHTML = state.levels.map(level => `<option value="${level.number}">Level ${level.number} · ${escapeHtml(level.title)}</option>`).join('');
    ui.levelSelect.value = String(state.currentLevel);
  }

  function leaderboardRows(entries, limit = 10) {
    const rows = Array.isArray(entries) ? entries.slice(0, limit) : [];
    if (!rows.length) return '<li class="leaderboard-empty">No scores yet—be the first on the ice.</li>';
    return rows.map(entry => {
      const mine = Boolean(entry.isCurrentPlayer);
      const medal = entry.rank <= 3 ? `<i class="leaderboard-medal medal-${entry.rank}" aria-hidden="true"></i>` : '';
      return `<li class="${mine ? 'is-player' : ''}"><span class="leaderboard-rank">${medal}<b>${entry.rank}</b></span><strong>${escapeHtml(entry.username)}${mine ? '<small>YOU</small>' : ''}</strong><span class="leaderboard-score">${formatScore(entry.score)}</span></li>`;
    }).join('');
  }

  async function getLeaderboard(level, limit = 10) {
    return request(`/api/leaderboards/${encodeURIComponent(level)}?limit=${limit}&rules=${encodeURIComponent(CONFIG.rulesVersion)}`);
  }

  function renderFullLeaderboard(payload) {
    if (ui.list) ui.list.innerHTML = leaderboardRows(payload.entries, 10);
    if (ui.rankCard) {
      const me = payload.currentPlayer;
      ui.rankCard.hidden = !me;
      ui.rankCard.innerHTML = me ? `<span>YOUR GLOBAL RANK</span><strong>#${me.rank}</strong><small>${formatScore(me.score)} points</small>` : '';
    }
  }

  async function loadFullLeaderboard(level = state.currentLevel) {
    state.currentLevel = Number(level) || 1;
    if (ui.levelSelect) ui.levelSelect.value = String(state.currentLevel);
    if (ui.list) ui.list.innerHTML = '<li class="leaderboard-empty leaderboard-loading">Loading Global Leaders…</li>';
    if (ui.rankCard) ui.rankCard.hidden = true;
    setStatus(ui.status, '');
    try {
      renderFullLeaderboard(await getLeaderboard(state.currentLevel, 10));
    } catch (error) {
      if (ui.list) ui.list.innerHTML = '<li class="leaderboard-empty">Standings are unavailable right now.</li>';
      setStatus(ui.status, 'Your game progress is safe. Try the leaderboard again shortly.', 'error');
    }
  }

  function openGlobalLeaderboard(level = state.currentLevel) {
    openDialog(ui.dialog);
    loadFullLeaderboard(level);
  }

  function completionPanel(levelTitle) {
    const section = document.createElement('section');
    section.className = 'finish-leaderboard';
    section.innerHTML = `<div class="finish-leaderboard-header"><span><i aria-hidden="true">◎</i> GLOBAL LEADERS</span><button type="button">VIEW TOP 10</button></div><div class="finish-leaderboard-level">${escapeHtml(levelTitle)}</div><ol class="finish-leaderboard-list"><li class="leaderboard-empty leaderboard-loading">Updating standings…</li></ol><p class="finish-leaderboard-note" aria-live="polite"></p>`;
    section.querySelector('button').addEventListener('click', () => openGlobalLeaderboard(state.currentLevel));
    return section;
  }

  function attachCompletionPanel(result) {
    const layout = document.querySelector('#startOverlay .finish-layout');
    if (!layout) return null;
    layout.querySelector('.finish-leaderboard')?.remove();
    const panel = completionPanel(`Level ${result.level} · ${result.levelTitle}`);
    const actions = layout.querySelector('.finish-actions');
    layout.insertBefore(panel, actions || null);
    return panel;
  }

  async function submitResult(result) {
    return request('/api/scores', {
      method: 'POST',
      body: JSON.stringify({
        level: result.level,
        levelId: result.levelId,
        score: result.score,
        correct: result.correct,
        total: result.total,
        elapsedMs: result.elapsedMs,
        passed: Boolean(result.passed),
        rulesVersion: CONFIG.rulesVersion
      })
    });
  }

  async function recordLevelResult(result) {
    state.currentLevel = Number(result.level) || 1;
    const requestId = ++state.completionRequest;
    const panel = attachCompletionPanel(result);
    if (!panel) return;
    const list = panel.querySelector('.finish-leaderboard-list');
    const note = panel.querySelector('.finish-leaderboard-note');
    try {
      let payload;
      if (state.profile) {
        const response = await submitResult(result);
        payload = response.leaderboard;
        note.textContent = response.improved ? `New global best for ${state.profile.username}.` : `Your best score remains ${formatScore(response.bestScore)}.`;
      } else {
        payload = await getLeaderboard(result.level, 5);
        note.innerHTML = 'Playing offline · <button type="button">choose a rink name</button> to post scores.';
        note.querySelector('button')?.addEventListener('click', () => openDialog(ui.usernameDialog));
      }
      if (requestId !== state.completionRequest || !panel.isConnected) return;
      list.innerHTML = leaderboardRows(payload.entries, 5);
      if (payload.currentPlayer?.rank > 5) note.textContent += ` You are #${payload.currentPlayer.rank} globally.`;
    } catch {
      if (requestId !== state.completionRequest || !panel.isConnected) return;
      list.innerHTML = '<li class="leaderboard-empty">Standings unavailable</li>';
      note.textContent = 'Your local score and level progress are still saved.';
    }
  }

  ui.usernameInput?.addEventListener('input', () => {
    ui.usernameInput.value = ui.usernameInput.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 8);
    if (ui.usernameCounter) ui.usernameCounter.textContent = `${ui.usernameInput.value.length}/8`;
    setStatus(ui.usernameStatus, '');
  });
  ui.usernameForm?.addEventListener('submit', createPlayer);
  ui.offlineButton?.addEventListener('click', () => {
    sessionStorage.setItem(OFFLINE_KEY, '1');
    closeDialog(ui.usernameDialog);
  });
  ui.openButton?.addEventListener('click', () => openGlobalLeaderboard());
  ui.closeButton?.addEventListener('click', () => closeDialog(ui.dialog));
  ui.dialog?.addEventListener('click', event => { if (event.target === ui.dialog) closeDialog(ui.dialog); });
  ui.levelSelect?.addEventListener('change', () => loadFullLeaderboard(ui.levelSelect.value));

  updatePlayerTag();
  setTimeout(() => {
    if (!state.profile && !sessionStorage.getItem(OFFLINE_KEY)) openDialog(ui.usernameDialog);
  }, 1050);

  window.TopCheLeaderboard = Object.freeze({ setLevels, recordLevelResult, open: openGlobalLeaderboard });
})();
