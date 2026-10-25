/* Additive integration: app.js, games.js, rewards and stored progress are untouched. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const config = window.LUMA_AI_CONFIG || {};
  const input = $('aiInput'), send = $('aiSend'), log = $('aiLog'), status = $('aiState');
  if (!input || !send || !log || !status) return;
  let endpoint = '';
  try {
    const url = new URL(config.endpoint);
    if (config.enabled === true && url.protocol === 'https:' && url.hostname.endsWith('.workers.dev') && !url.username && !url.password && !url.search && !url.hash) {
      endpoint = new URL('/api/hint', url.origin).href;
    }
  } catch { /* Not connected yet; keep the original local hints. */ }
  const clientId = crypto.randomUUID(); // Session-only anonymous rate-limit key.
  let busy = false, history = [], context = {}, mistakes = 0, lastAction = '';
  let previousScreen = '', controller = null, pickedValue = '';
  const style = document.createElement('style');
  style.textContent = `
  .luma-ai-tools{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:16px 0}
  .luma-ai-tools label{display:flex;align-items:center;gap:8px;font-size:14px}
  .luma-ai-note{font-size:13px;line-height:1.8;color:#49617d;margin:10px 0}
  .luma-ai-source{display:block;font-size:11px;color:#4c637d;margin-bottom:3px}
  .luma-ai-dialog{border:1px solid #bed3ee;border-radius:24px;padding:24px;width:min(620px,calc(100% - 24px));max-height:85vh;color:#142e69;background:#fff;box-shadow:0 18px 65px #142e6940;overflow:auto}
  .luma-ai-dialog::backdrop{background:#142e6970}.luma-ai-dialog h2{margin:0;font-size:23px}
  .luma-ai-dialog .row{display:flex;gap:10px;flex-wrap:wrap}.luma-ai-dialog input{flex:1;min-width:150px}
  .luma-ai-dialog .chatmsg{white-space:pre-wrap;overflow-wrap:anywhere;direction:rtl;unicode-bidi:plaintext}
  .luma-ai-dialog [role=log]{max-height:35vh;overflow:auto}.luma-ai-close{float:left}
  #aiLog .chatmsg{white-space:pre-wrap;overflow-wrap:anywhere;unicode-bidi:plaintext}
  .luma-ai-preview{font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;background:#f2f7fd;padding:12px;border-radius:12px;max-height:150px;overflow:auto}
  `;
  document.head.append(style);
  const tools = document.createElement('div'); tools.className = 'luma-ai-tools';
  const modeLabel = document.createElement('label'); modeLabel.append('نوع المساعدة ');
  const mode = document.createElement('select'); mode.className = 'field'; mode.id = 'lumaMode';
  for (const [value, text] of [['ai', 'ذكاء اصطناعي'], ['local', 'تلميحات محلية جاهزة']]) {
    const option = document.createElement('option'); option.value = value; option.textContent = text;
    if (value === 'ai' && !endpoint) { option.disabled = true; option.textContent += ' (لم يُفعّل بعد)'; }
    mode.append(option);
  }
  mode.value = endpoint ? 'ai' : 'local'; modeLabel.append(mode); tools.append(modeLabel);
  const codeLabel = document.createElement('label'); const shareCode = document.createElement('input');
  shareCode.type = 'checkbox'; shareCode.id = 'lumaShareCode';
  codeLabel.append(shareCode, 'أرفق كودي ورسالة الخطأ'); tools.append(codeLabel);
  const reset = document.createElement('button'); reset.className = 'btn alt'; reset.textContent = 'محادثة جديدة'; tools.append(reset);
  status.before(tools);
  const note = document.createElement('p'); note.className = 'luma-ai-note';
  note.textContent = 'في وضع الذكاء الاصطناعي يُرسل سؤالك وسياق التدريب وآخر رسائل المحادثة إلى Cloudflare. لا تكتب اسمك أو معلومات شخصية. قد تخطئ لُمى؛ اختبر الكود وناقش معلمك. لا تُحفظ المحادثة بعد إعادة تحميل الصفحة.';
  status.after(note);
  const preview = document.createElement('details'); const summary = document.createElement('summary');
  summary.textContent = 'السياق الذي سيُرفق بسؤالي'; const previewText = document.createElement('pre'); previewText.className = 'luma-ai-preview';
  preview.append(summary, previewText); note.after(preview);

  // A dialog keeps the game mounted: opening help does not navigate away or reset a round.
  const dialog = document.createElement('dialog'); dialog.className = 'luma-ai-dialog'; dialog.dir = 'rtl';
  dialog.setAttribute('aria-labelledby', 'lumaDialogTitle');
  dialog.innerHTML = '<button type="button" class="btn alt luma-ai-close" aria-label="إغلاق مساعدة لُمى">إغلاق</button><h2 id="lumaDialogTitle">تلميح من لُمى</h2><p class="luma-ai-note">يُرسل سؤالك وسياق المحاولة إلى Cloudflare. لا تكتب معلومات شخصية. قد تخطئ لُمى.</p><p class="luma-ai-note" data-status role="status"></p><div role="log" aria-live="polite" aria-label="محادثة لُمى أثناء التدريب"></div><form class="row"><input class="field" aria-label="سؤالك للُمى" maxlength="500" placeholder="ما الذي لم أفهمه في هذه المحاولة؟" required><button type="submit" class="btn">اطلب تلميحًا</button></form>';
  document.body.append(dialog);
  const dInput = dialog.querySelector('input'), dSend = dialog.querySelector('[type=submit]');
  const dLog = dialog.querySelector('[role=log]'), dStatus = dialog.querySelector('[data-status]');
  const gameHelp = document.createElement('button'); gameHelp.className = 'btn alt'; gameHelp.textContent = 'اسأل لُمى الذكية';
  gameHelp.id = 'lumaGameHelp'; gameHelp.hidden = true; $('gameHint')?.after(gameHelp);
  const shown = id => $(id)?.classList.contains('active');
  const text = (id, max = 300) => ($(id)?.innerText || '').trim().slice(0, max);
  const inAssessment = () => shown('diagnostic') || shown('final') || (shown('game') && $('gameHint')?.hidden);
  function updateStatus() {
    status.textContent = mode.value === 'ai' ? 'لُمى تستخدم الذكاء الاصطناعي عند الإرسال. اكتب سؤالك.' : endpoint ? 'وضع محلي: ردود جاهزة، لا تُرسل أسئلتك إلى خادم.' : 'الذكاء الاصطناعي لم يُفعّل بعد؛ المساعدة الحالية تلميحات محلية جاهزة.';
    dStatus.textContent = endpoint ? 'مساعدة بالذكاء الاصطناعي أثناء التدريب.' : 'الذكاء الاصطناعي لم يُفعّل بعد؛ زر التلميح المحلي يعمل كالمعتاد.';
    gameHelp.disabled = !endpoint;
  }
  function snapshot() {
    if (shown('assistant')) return context;
    const screen = document.querySelector('.screen.active')?.id || '';
    const key = window.Journey?.getState()?.current;
    const names = {types:'مصنع البيانات',convert:'بوابات التحويل',input:'أنقذ الروبوت',debug:'قلعة الأخطاء',coding:'مدينة الطاقة'};
    context = {island: names[key] || '', activity: shown('game') ? text('gameTitle',160) : screen,
      instruction: shown('game') ? (document.querySelector('#gameArena .arena-instruction')?.innerText || '').slice(0,400) : text('islandGoal',400),
      lastAction, feedback: shown('game') ? text('gameFeedback',300) : shown('lab') ? text('labResult',300) : '',
      mistakes, assessment: inAssessment()};
    return context;
  }
  function payloadContext(withCode) {
    const current = {...(shown('assistant') ? context : snapshot())};
    if (withCode) { current.code = ($('codeEditor')?.value || '').slice(0,1200); current.error = text('pyOutput',300); }
    return current;
  }
  function updatePreview() { previewText.textContent = JSON.stringify(payloadContext(shareCode.checked),null,2); }
  function addMessage(target, content, role, label) {
    const item = document.createElement('div'); item.className = 'chatmsg' + (role === 'user' ? ' user' : '');
    const source = document.createElement('small'); source.className = 'luma-ai-source'; source.textContent = label;
    const body = document.createElement('span'); body.textContent = content; item.append(source, body); target.append(item);
    while (target.children.length > 20) target.firstElementChild.remove();
    target.scrollTop = target.scrollHeight;
  }
  function setBusy(value) { busy = value; send.disabled = dSend.disabled = value; mode.disabled = value; reset.disabled = value; }
  const messages = {
    rate_limit:'طلبات المساعدة متقاربة. انتظر دقيقة ثم أعد المحاولة، أو استخدم التلميح المحلي.',
    not_configured:'خدمة لُمى لم تُفعّل بالكامل بعد. يمكنك استخدام التلميحات المحلية.',
    assessment:'أكمل التحدي بنفسك، ثم اطلب المساعدة في التدريب.',
    ai_unavailable:'لُمى الذكية غير متاحة الآن؛ ربما انتهت الحصة المجانية أو تعذّر الاتصال. يمكنك استخدام التلميح المحلي.',
  };
  async function ask(targetInput, targetLog, targetStatus, withCode = false) {
    const message = targetInput.value.trim(); if (!message || busy || !endpoint) return;
    if (message.length > 500) return;
    const ctx = payloadContext(withCode);
    if (ctx.assessment || inAssessment()) { targetStatus.textContent = messages.assessment; return; }
    setBusy(true); targetStatus.textContent = 'لُمى تفكّر في تلميح مناسب…';
    controller = new AbortController(); const timer = setTimeout(() => controller?.abort(), 25000);
    addMessage(targetLog, message, 'user', 'أنت');
    try {
      const response = await fetch(endpoint, {method:'POST', headers:{'Content-Type':'application/json'}, credentials:'omit',
        body:JSON.stringify({message,context:ctx,history:history.slice(-4),clientId}), signal:controller.signal});
      const body = await response.json();
      if (!response.ok || body.source !== 'workers-ai' || typeof body.reply !== 'string' || !body.reply.trim()) throw new Error(body.error || 'ai_unavailable');
      addMessage(targetLog, body.reply.slice(0,1000), 'assistant', 'لُمى · ذكاء اصطناعي');
      history.push({role:'user',content:message},{role:'assistant',content:body.reply.slice(0,500)}); history = history.slice(-4);
      targetInput.value = ''; targetStatus.textContent = 'وصل التلميح. جرّب بنفسك ثم أخبر لُمى بما حدث.';
    } catch (error) {
      targetStatus.textContent = error.name === 'AbortError' ? 'طال انتظار الرد. حاول مجددًا أو استخدم التلميح المحلي.' : (messages[error.message] || messages.ai_unavailable);
      // No fabricated AI reply or silent local fallback on a failed request.
    } finally { clearTimeout(timer); controller = null; setBusy(false); }
  }
  // Capture only the AI mode; the original local askAI handler is preserved unchanged.
  send.addEventListener('click', event => {
    if (mode.value !== 'ai') return;
    event.preventDefault(); event.stopImmediatePropagation(); ask(input,log,status,shareCode.checked);
  },true);
  input.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.isComposing || mode.value !== 'ai') return;
    event.preventDefault(); event.stopImmediatePropagation(); ask(input,log,status,shareCode.checked);
  },true);
  mode.onchange = () => { history = []; log.replaceChildren(); updateStatus(); };
  shareCode.onchange = updatePreview;
  reset.onclick = () => { history = []; log.replaceChildren(); dLog.replaceChildren(); updateStatus(); };
  gameHelp.onclick = () => {
    if (!endpoint || inAssessment()) return;
    snapshot(); dialog.showModal(); dInput.focus();
  };
  dialog.querySelector('.luma-ai-close').onclick = () => dialog.close();
  dialog.querySelector('form').onsubmit = event => {event.preventDefault(); ask(dInput,dLog,dStatus);};
  document.addEventListener('click', event => {
    if (!shown('game')) return;
    const target = event.target.closest?.('#gameArena [role=button],#gameArena button');
    if (target) {
      const label = (target.getAttribute('aria-label') || target.innerText || '').slice(0,100);
      if (target.classList.contains('play-token')) { pickedValue = label; lastAction = 'اختيار: ' + label; }
      else lastAction = (pickedValue ? pickedValue + ' ← ' : '') + label;
    }
  },true);
  document.addEventListener('dragstart', event => {
    const target = event.target.closest?.('#gameArena .play-token');
    if (target) pickedValue = (target.getAttribute('aria-label') || target.innerText || '').slice(0,100);
  },true);
  document.addEventListener('drop', event => {
    const target = event.target.closest?.('#gameArena [role=button]');
    if (target) lastAction = pickedValue + ' ← ' + (target.getAttribute('aria-label') || '').slice(0,80);
  },true);
  window.addEventListener('journey-answer', event => {
    if (!event.detail?.correct) mistakes++;
    if (shown('game')) snapshot();
  });
  window.addEventListener('journey-screen', event => {
    const screen = event.detail;
    if (screen !== 'assistant') {
      if (screen !== previousScreen) { mistakes = 0; lastAction = ''; history = []; log.replaceChildren(); dLog.replaceChildren(); }
      snapshot(); previousScreen = screen;
    }
    if (screen === 'assistant') updatePreview();
    gameHelp.hidden = screen !== 'game' || Boolean($('gameHint')?.hidden);
    if (screen !== 'game' && dialog.open) dialog.close();
  });
  // askAi already navigates to the original assistant; code sharing remains opt-in.
  $('askAi')?.addEventListener('click', () => { updatePreview(); input.focus(); });
  if ($('gameHint')) new MutationObserver(() => {
    gameHelp.hidden = !shown('game') || Boolean($('gameHint').hidden);
  }).observe($('gameHint'), {attributes:true,attributeFilter:['hidden']});
  updateStatus(); snapshot(); updatePreview();
})();
