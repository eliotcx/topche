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
  const state = { levels: [], currentLevel: 1, profile: readProfile(), completionRequest: 0, recoveryCode: '' };

  const ui = {
    openButton: document.getElementById('globalLeaderboardButton'),
    usernameDialog: document.getElementById('usernameDialog'),
    usernameForm: document.getElementById('usernameForm'),
    usernameInput: document.getElementById('leaderboardUsername'),
    usernameCounter: document.getElementById('usernameCounter'),
    usernameStatus: document.getElementById('usernameStatus'),
    existingButton: document.getElementById('leaderboardExistingButton'),
    offlineButton: document.getElementById('leaderboardOfflineButton'),
    recoveryLoginDialog: document.getElementById('recoveryLoginDialog'),
    closeRecoveryLogin: document.getElementById('closeRecoveryLogin'),
    recoveryLoginForm: document.getElementById('recoveryLoginForm'),
    recoveryUsername: document.getElementById('recoveryUsername'),
    recoveryCodeInput: document.getElementById('recoveryCodeInput'),
    recoveryLoginStatus: document.getElementById('recoveryLoginStatus'),
    recoveryTurnstileMount: document.getElementById('recoveryTurnstileMount'),
    recoveryCodeDialog: document.getElementById('recoveryCodeDialog'),
    recoveryCodeUsername: document.getElementById('recoveryCodeUsername'),
    recoveryCodeValue: document.getElementById('recoveryCodeValue'),
    recoveryCodeStatus: document.getElementById('recoveryCodeStatus'),
    copyRecoveryCode: document.getElementById('copyRecoveryCode'),
    shareRecoveryCode: document.getElementById('shareRecoveryCode'),
    saveRecoveryCode: document.getElementById('saveRecoveryCode'),
    recoveryCodeSaved: document.getElementById('recoveryCodeSaved'),
    dialog: document.getElementById('globalLeaderboardDialog'),
    closeButton: document.getElementById('closeGlobalLeaderboard'),
    levelSelect: document.getElementById('leaderboardLevelSelect'),
    list: document.getElementById('globalLeaderboardList'),
    rankCard: document.getElementById('globalRankCard'),
    status: document.getElementById('globalLeaderboardStatus'),
    playerTag: document.getElementById('globalPlayerTag'),
    playerTools: document.getElementById('globalPlayerTools'),
    manageRecoveryCode: document.getElementById('manageRecoveryCodeButton'),
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
    window.dispatchEvent(new CustomEvent('topche:profile-ready', { detail: { username: profile.username } }));
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

  async function getTurnstileToken(mount = ui.turnstileMount, action = 'create_player') {
    const turnstile = await waitForTurnstile();
    if (!mount) throw new Error('Security check is unavailable.');
    mount.replaceChildren();
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
        widgetId = turnstile.render(mount, {
          sitekey: CONFIG.turnstileSiteKey,
          action,
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
      const turnstileToken = await getTurnstileToken(ui.turnstileMount, 'create_player');
      setStatus(ui.usernameStatus, 'Checking availability…', 'loading');
      const response = await request('/api/players', {
        method: 'POST',
        body: JSON.stringify({ username: validation.username, turnstileToken })
      });
      saveProfile({ username: response.player.username, token: response.token, playerId: response.player.id });
      if (response.recoveryCode) {
        closeDialog(ui.usernameDialog);
        showRecoveryCode(response.player.username, response.recoveryCode);
      } else {
        setStatus(ui.usernameStatus, `Welcome, ${response.player.username}!`, 'success');
        setTimeout(() => closeDialog(ui.usernameDialog), 360);
      }
    } catch (error) {
      const message = error.status === 409 ? 'That rink name is already taken. Try another.' : error.message;
      setStatus(ui.usernameStatus, message, 'error');
    } finally {
      if (submit) submit.disabled = false;
    }
  }

  function normalizeRecoveryEntry(value) {
    const compact = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18);
    if (compact === 'T') return 'T';
    const remainder = (compact.startsWith('TC') ? compact.slice(2) : compact).slice(0, 16);
    const groups = remainder.match(/.{1,4}/g) || [];
    return ['TC', ...groups].join('-');
  }

  function showRecoveryCode(username, recoveryCode) {
    state.recoveryCode = recoveryCode;
    if (ui.recoveryCodeUsername) ui.recoveryCodeUsername.textContent = username;
    if (ui.recoveryCodeValue) ui.recoveryCodeValue.textContent = recoveryCode;
    setStatus(ui.recoveryCodeStatus, '');
    openDialog(ui.recoveryCodeDialog);
  }

  async function recoverPlayer(event) {
    event.preventDefault();
    const validation = validateUsername(ui.recoveryUsername?.value);
    const compactCode = String(ui.recoveryCodeInput?.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (validation.error) {
      setStatus(ui.recoveryLoginStatus, validation.error, 'error');
      return;
    }
    if (!/^TC[2-9A-HJKMNP-Z]{16}$/.test(compactCode)) {
      setStatus(ui.recoveryLoginStatus, 'Enter the complete Player Code.', 'error');
      return;
    }
    const submit = ui.recoveryLoginForm?.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    setStatus(ui.recoveryLoginStatus, 'Running security check…', 'loading');
    try {
      const turnstileToken = await getTurnstileToken(ui.recoveryTurnstileMount, 'recover_player');
      setStatus(ui.recoveryLoginStatus, 'Restoring your player…', 'loading');
      const response = await request('/api/recover', {
        method: 'POST',
        body: JSON.stringify({ username: validation.username, recoveryCode: compactCode, turnstileToken })
      });
      saveProfile({ username: response.player.username, token: response.token, playerId: response.player.id });
      setStatus(ui.recoveryLoginStatus, `Welcome back, ${response.player.username}!`, 'success');
      setTimeout(() => closeDialog(ui.recoveryLoginDialog), 420);
    } catch (error) {
      setStatus(ui.recoveryLoginStatus, error.message, 'error');
    } finally {
      if (submit) submit.disabled = false;
    }
  }

  async function copyText(value) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
    const field = document.createElement('textarea');
    field.value = value;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    document.execCommand('copy');
    field.remove();
  }

  function recoveryMessage() {
    return `Top Che’s Hockey Player Code\nRink name: ${state.profile?.username || ''}\nPlayer Code: ${state.recoveryCode}\nRestore at https://topche.org\n\nKeep this code private.`;
  }

  async function copyRecoveryCode() {
    try {
      await copyText(state.recoveryCode);
      setStatus(ui.recoveryCodeStatus, 'Player Code copied.', 'success');
    } catch {
      setStatus(ui.recoveryCodeStatus, 'Press and hold the code above to copy it.', 'error');
    }
  }

  async function shareRecoveryCode() {
    try {
      if (!navigator.share) throw new Error('Sharing unavailable');
      await navigator.share({ title:'Top Che’s Player Code', text:recoveryMessage() });
      setStatus(ui.recoveryCodeStatus, 'Player Code shared.', 'success');
    } catch (error) {
      if (error?.name !== 'AbortError') {
        await copyRecoveryCode();
        setStatus(ui.recoveryCodeStatus, 'Sharing was unavailable, so the code was copied.', 'success');
      }
    }
  }

  function recoveryCardBlob() {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200; canvas.height = 760;
      const context = canvas.getContext('2d');
      const gradient = context.createLinearGradient(0,0,1200,760);
      gradient.addColorStop(0,'#123e56');gradient.addColorStop(.58,'#071c2b');gradient.addColorStop(1,'#06121e');
      context.fillStyle=gradient;context.fillRect(0,0,1200,760);
      context.strokeStyle='#63e6ed';context.lineWidth=5;context.strokeRect(40,40,1120,680);
      context.fillStyle='#63e6ed';context.font='900 30px system-ui,sans-serif';context.letterSpacing='7px';context.fillText('TOP CHE’S HOCKEY',78,112);
      context.fillStyle='#ffda62';context.font='900 66px system-ui,sans-serif';context.fillText('PLAYER CODE',78,210);
      context.fillStyle='#9bb7c2';context.font='700 28px system-ui,sans-serif';context.fillText(`RINK NAME  ·  ${state.profile?.username || ''}`,82,284);
      context.fillStyle='#f8fdff';context.font='900 55px ui-monospace,monospace';context.fillText(state.recoveryCode,78,405);
      context.fillStyle='#8ba7b2';context.font='600 24px system-ui,sans-serif';context.fillText('Restore your player and Global scores at topche.org',82,500);
      context.fillStyle='#ffda62';context.font='800 22px system-ui,sans-serif';context.fillText('KEEP THIS CODE PRIVATE · SHOWN ONLY ONCE',82,642);
      canvas.toBlob(resolve,'image/png');
    });
  }

  async function saveRecoveryImage() {
    try {
      const blob = await recoveryCardBlob();
      if (!blob) throw new Error('Image unavailable');
      const file = new File([blob],`top-che-player-code-${state.profile?.username || 'player'}.png`,{type:'image/png'});
      if (navigator.share && navigator.canShare?.({files:[file]})) {
        await navigator.share({ title:'Save Top Che’s Player Code', files:[file] });
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);link.download=file.name;link.click();
        setTimeout(()=>URL.revokeObjectURL(link.href),1000);
      }
      setStatus(ui.recoveryCodeStatus, 'Player Code image ready to save.', 'success');
    } catch (error) {
      if (error?.name !== 'AbortError') setStatus(ui.recoveryCodeStatus, 'Could not create the image. Copy the code instead.', 'error');
    }
  }

  async function offerExistingPlayerRecoveryCode() {
    if (!state.profile) return;
    try {
      const profile = await request('/api/profile');
      if (profile.hasRecoveryCode) return;
      const response = await request('/api/recovery-code', { method:'POST', body:'{}' });
      if (response.recoveryCode) showRecoveryCode(response.player.username, response.recoveryCode);
    } catch {
      // The leaderboard remains usable if recovery setup is temporarily unavailable.
    }
  }

  function updatePlayerTag() {
    if (!ui.playerTag) return;
    if (ui.playerTools) ui.playerTools.hidden = !state.profile;
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

  async function bootstrapCloudProgress(snapshot) {
    if (!state.profile) return null;
    return request('/api/progress/bootstrap', { method:'POST', body:JSON.stringify(snapshot) });
  }

  async function syncCloudProgress(change) {
    if (!state.profile) return null;
    return request('/api/progress/sync', { method:'POST', body:JSON.stringify(change) });
  }

  function hasProfile() { return Boolean(state.profile); }
  function playerId() { return state.profile?.playerId || ''; }

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
  ui.existingButton?.addEventListener('click', () => {
    closeDialog(ui.usernameDialog);
    setStatus(ui.recoveryLoginStatus, '');
    openDialog(ui.recoveryLoginDialog);
    setTimeout(() => ui.recoveryUsername?.focus(), 80);
  });
  ui.closeRecoveryLogin?.addEventListener('click', () => {
    closeDialog(ui.recoveryLoginDialog);
    openDialog(ui.usernameDialog);
  });
  ui.recoveryUsername?.addEventListener('input', () => {
    ui.recoveryUsername.value = ui.recoveryUsername.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 8);
    setStatus(ui.recoveryLoginStatus, '');
  });
  ui.recoveryCodeInput?.addEventListener('input', () => {
    ui.recoveryCodeInput.value = normalizeRecoveryEntry(ui.recoveryCodeInput.value);
    setStatus(ui.recoveryLoginStatus, '');
  });
  ui.recoveryLoginForm?.addEventListener('submit', recoverPlayer);
  ui.copyRecoveryCode?.addEventListener('click', copyRecoveryCode);
  ui.shareRecoveryCode?.addEventListener('click', shareRecoveryCode);
  ui.saveRecoveryCode?.addEventListener('click', saveRecoveryImage);
  ui.recoveryCodeSaved?.addEventListener('click', () => {
    state.recoveryCode = '';
    closeDialog(ui.recoveryCodeDialog);
  });
  ui.manageRecoveryCode?.addEventListener('click', async () => {
    if (!window.confirm('Replace your Player Code? Your saved old code will stop working, but devices already signed in will stay connected.')) return;
    ui.manageRecoveryCode.disabled = true;
    setStatus(ui.status, 'Creating a new Player Code…', 'loading');
    try {
      const response = await request('/api/recovery-code', { method:'POST', body:JSON.stringify({ rotate:true }) });
      closeDialog(ui.dialog);
      showRecoveryCode(response.player.username, response.recoveryCode);
    } catch (error) {
      setStatus(ui.status, error.message, 'error');
    } finally {
      ui.manageRecoveryCode.disabled = false;
    }
  });
  ui.offlineButton?.addEventListener('click', () => {
    sessionStorage.setItem(OFFLINE_KEY, '1');
    closeDialog(ui.usernameDialog);
  });
  ui.openButton?.addEventListener('click', () => openGlobalLeaderboard());
  ui.closeButton?.addEventListener('click', () => closeDialog(ui.dialog));
  ui.dialog?.addEventListener('click', event => { if (event.target === ui.dialog) closeDialog(ui.dialog); });
  ui.levelSelect?.addEventListener('change', () => loadFullLeaderboard(ui.levelSelect.value));

  updatePlayerTag();
  if (state.profile) setTimeout(offerExistingPlayerRecoveryCode, 1600);
  setTimeout(() => {
    if (!state.profile && !sessionStorage.getItem(OFFLINE_KEY)) openDialog(ui.usernameDialog);
  }, 1050);

  window.TopCheLeaderboard = Object.freeze({
    setLevels,
    recordLevelResult,
    open: openGlobalLeaderboard,
    hasProfile,
    playerId,
    bootstrapCloudProgress,
    syncCloudProgress
  });
})();
