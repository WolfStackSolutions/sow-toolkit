(function() {
        'use strict';

        var existing = document.getElementById('sow-toolkit-menu');
        if (existing) {
            existing.style.display = existing.style.display === 'none' ? 'block' : 'none';
            return;
        }

        var SK = 'sow-toolkit-state';
        function loadState() { try { return JSON.parse(sessionStorage.getItem(SK)) || {}; } catch(e) { return {}; } }
        function saveState(s) { try { sessionStorage.setItem(SK, JSON.stringify(s)); } catch(e) {} }
        var state = loadState();

        var CURRENT_VERSION = '3.1';
        var LAST_UPDATED = '26 May 2026';
        var CDN_BASE = 'https://cdn.jsdelivr.net/gh/WolfStackSolutions/sow-toolkit@main/';

        function getTabRoot() {
            var m1 = document.querySelector('macroponent-f51912f4c700201072b211d4d8c26010');
            if (!m1 || !m1.shadowRoot) return null;
            var shell = m1.shadowRoot.querySelector('sn-canvas-appshell-main');
            if (!shell || !shell.shadowRoot) return null;
            var m2 = shell.shadowRoot.querySelector('macroponent-c276387cc331101080d6d3658940ddd2');
            if (!m2 || !m2.shadowRoot) return null;
            var tabs = m2.shadowRoot.querySelector('sn-canvas-tabs');
            if (!tabs || !tabs.shadowRoot) return null;
            return tabs.shadowRoot;
        }

        if (!window._sowToolkit) window._sowToolkit = {};
        var tk = window._sowToolkit;

        var tools = [
            {
                name: 'Alert Suppressor V5', color: '#4F52BD', key: 'as',
                on: function() {
                    var count = 0, accent = '#6C6FFF';

                    // ---- Styled HUD ----
                    var hud = document.createElement('div'); hud.id = 'sow-as-hud';
                    hud.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:999999;background:rgba(10,10,18,0.96);border:1px solid rgba(108,111,255,0.3);border-radius:14px;font-family:"JetBrains Mono","SF Mono",Consolas,monospace;font-size:12px;color:#ccc;width:360px;box-shadow:0 16px 48px rgba(0,0,0,0.5),0 0 40px rgba(108,111,255,0.08);overflow:hidden;backdrop-filter:blur(20px);';
                    var hdr = document.createElement('div'); hdr.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:12px 16px;cursor:pointer;user-select:none;';
                    hdr.innerHTML = '<div style="display:flex;align-items:center;gap:10px;"><div id="as-dot" style="width:8px;height:8px;border-radius:50%;background:#6C6FFF;box-shadow:0 0 10px rgba(108,111,255,0.6);"></div><div><div style="color:#e0e0ea;font-weight:700;font-size:12px;letter-spacing:0.5px;">Alert Suppressor V5</div><div style="font-size:9px;color:#55556e;margin-top:2px;">DOM insertion block</div></div></div><div style="display:flex;align-items:center;gap:12px;"><span id="as-count" style="font-weight:700;color:#6C6FFF;font-size:14px;">0</span><span id="as-toggle" style="cursor:pointer;color:#55556e;font-size:14px;transition:color 0.15s;line-height:1;">_</span></div>';
                    var sep = document.createElement('div'); sep.style.cssText = 'height:1px;background:linear-gradient(90deg,transparent,rgba(108,111,255,0.25),transparent);margin:0 16px;';
                    var bd = document.createElement('div'); bd.id = 'as-body'; bd.style.cssText = 'max-height:280px;overflow-y:auto;padding:8px 12px;';
                    bd.innerHTML = '<div id="as-log" style="display:flex;flex-direction:column;gap:4px;"></div>';
                    var col = false;
                    hdr.addEventListener('click', function() { col = !col; bd.style.display = col ? 'none' : 'block'; sep.style.display = col ? 'none' : 'block'; document.getElementById('as-toggle').textContent = col ? '+' : '_'; });
                    hud.appendChild(hdr); hud.appendChild(sep); hud.appendChild(bd); document.body.appendChild(hud);

                    function bump() { count++; var ce = document.getElementById('as-count'); if (ce) ce.textContent = count; }
                    function flash(text) {
                        bump();
                        var dot = document.getElementById('as-dot');
                        if (dot) { dot.style.background = '#ff4444'; dot.style.boxShadow = '0 0 12px rgba(255,68,68,0.8)'; }
                        setTimeout(function() { if (dot) { dot.style.background = accent; dot.style.boxShadow = '0 0 10px rgba(108,111,255,0.6)'; } }, 600);
                        var le = document.getElementById('as-log'); if (!le) return;
                        var line = document.createElement('div');
                        line.style.cssText = 'background:rgba(108,111,255,0.04);border:1px solid rgba(108,111,255,0.1);border-radius:8px;padding:8px 10px;';
                        line.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;"><span style="font-size:10px;font-weight:600;color:#00ccff;letter-spacing:0.5px;">Blocked Script Event:</span><span style="font-size:9px;color:#333;">' + new Date().toLocaleTimeString() + '</span></div><div style="font-size:11px;color:#999;line-height:1.4;word-break:break-word;">' + (text || '').substring(0, 250).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
                        le.prepend(line);
                    }

                    // Pending message queue — event interception logs text, DOM block matches it
                    var pendingMessages = [];

                    // ==== LAYER 0: Event Interception (for logging only) ====
                    var origDispatch = EventTarget.prototype.dispatchEvent;
                    EventTarget.prototype.dispatchEvent = function(e) {
                        if (e && e.detail && e.detail.type && e.detail.type.indexOf('NOTIFICATIONS_UPDATED') >= 0) {
                            try {
                                var p = e.detail.payload;
                                if (p && p.notifications && p.notifications.length > 0) {
                                    p.notifications.forEach(function(n) {
                                        var msg = (n.message || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                                        if (msg) pendingMessages.push(msg);
                                    });
                                }
                            } catch(ex) {}
                        }
                        return origDispatch.apply(this, arguments);
                    };

                    // ==== LAYER 1: DOM Insertion Block ====
                    // Prevent now-alert from EVER entering the DOM.
                    // No element = no timer = no dismiss = no focus steal.
                    var origInsertBefore = Node.prototype.insertBefore;
                    var origAppendChild = Node.prototype.appendChild;

                    function isNowAlert(n) {
                        return n && n.tagName && n.tagName.toLowerCase() === 'now-alert';
                    }

                    Node.prototype.insertBefore = function(newNode, refNode) {
                        if (isNowAlert(newNode)) {
                            var msg = pendingMessages.shift() || '(alert blocked)';
                            flash(msg);
                            var result = origInsertBefore.apply(this, arguments);
                            newNode.style.cssText = 'display:none!important;height:0!important;overflow:hidden!important;pointer-events:none!important;';
                            requestAnimationFrame(function() { try { newNode.remove(); } catch(e) {} });
                            return result;
                        }
                        return origInsertBefore.apply(this, arguments);
                    };

                    Node.prototype.appendChild = function(newNode) {
                        if (isNowAlert(newNode)) {
                            var msg = pendingMessages.shift() || '(alert blocked)';
                            flash(msg);
                            var result = origAppendChild.apply(this, arguments);
                            newNode.style.cssText = 'display:none!important;height:0!important;overflow:hidden!important;pointer-events:none!important;';
                            requestAnimationFrame(function() { try { newNode.remove(); } catch(e) {} });
                            return result;
                        }
                        return origAppendChild.apply(this, arguments);
                    };

                    // ==== Cleanup ====
                    return function() {
                        EventTarget.prototype.dispatchEvent = origDispatch;
                        Node.prototype.insertBefore = origInsertBefore;
                        Node.prototype.appendChild = origAppendChild;
                        hud.remove();
                    };
                }
            },

            {
                name: 'Ticket Copy', color: '#00c2e0', key: 'tc',
                on: function() {
                    var watched = new WeakSet(), observers = [], intervals = [];
                    var pat = /\b(INC|RITM|REQ|CHG|PRB|CTASK|SCTASK|STASK|TASK|IMS)\d{5,}\b/;
                    function addBtn(span) { var text = (span.textContent || '').trim(); if (!pat.test(text)) return; var tab = span.closest('.sn-chrome-one-tab-container') || span.closest('a[role="tab"]'); if (!tab) return; if (tab.querySelectorAll('.tc-btn').length > 0) return; var btn = document.createElement('span'); btn.className = 'tc-btn'; btn.title = 'Copy ' + text; btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'; btn.style.cssText = 'display:none;align-items:center;justify-content:center;cursor:pointer;margin-left:4px;padding:3px;border-radius:4px;vertical-align:middle;color:inherit;transition:opacity 0.15s;'; tab.addEventListener('mouseenter', function() { btn.style.display = 'inline-flex'; btn.style.opacity = '0.7'; }); tab.addEventListener('mouseleave', function() { btn.style.display = 'none'; }); btn.addEventListener('mouseenter', function() { btn.style.opacity = '1'; }); btn.addEventListener('click', function(e) { e.stopPropagation(); e.preventDefault(); navigator.clipboard.writeText(text); btn.style.opacity = '0.2'; setTimeout(function() { btn.style.opacity = '0.7'; }, 300); }); span.after(btn); }
                    function scan(root) { if (root) root.querySelectorAll('.sn-chrome-one-tab-label').forEach(addBtn); }
                    function watch(el) { if (!el || !el.shadowRoot || watched.has(el.shadowRoot)) return; watched.add(el.shadowRoot); scan(el.shadowRoot); var o = new MutationObserver(function() { scan(el.shadowRoot); }); o.observe(el.shadowRoot, { childList: true, subtree: true }); observers.push(o); el.shadowRoot.querySelectorAll('*').forEach(watch); }
                    scan(document); var bo = new MutationObserver(function() { scan(document); }); bo.observe(document.body, { childList: true, subtree: true }); observers.push(bo);
                    document.querySelectorAll('*').forEach(watch); var iv = setInterval(function() { scan(document); document.querySelectorAll('*').forEach(watch); }, 2000); intervals.push(iv);
                    return function() { intervals.forEach(clearInterval); observers.forEach(function(o) { o.disconnect(); }); document.querySelectorAll('.tc-btn').forEach(function(b) { b.remove(); }); };
                }
            },
            {
                name: 'Tab Counter', color: '#f59e0b', key: 'tabcnt',
                on: function() {
                    var MAX = 10, timeout = null, intervals = [];
                    function updateCounter() { var root = getTabRoot(); if (!root) return; var tabList = root.querySelector('.sn-chrome-tabs-group'); if (!tabList) return; var tabs = tabList.querySelectorAll('.sn-chrome-one-tab-container'); var count = Math.max(0, tabs.length - 1); var counter = root.querySelector('#sow-tab-counter'); if (!counter) { counter = document.createElement('div'); counter.id = 'sow-tab-counter'; counter.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;font-family:-apple-system,sans-serif;font-size:12px;font-weight:600;padding:4px 10px;border-radius:6px;margin-left:8px;white-space:nowrap;user-select:none;flex-shrink:0;'; var content = root.querySelector('.sn-chrome-tabs-content'); if (content) { content.style.alignItems = 'center'; content.appendChild(counter); } } var text = count + ' / ' + MAX; if (counter.textContent === text) return; counter.textContent = text; if (count >= MAX) { counter.style.background = 'rgba(239,68,68,0.15)'; counter.style.color = '#ef4444'; counter.style.border = '1px solid rgba(239,68,68,0.3)'; } else if (count >= 8) { counter.style.background = 'rgba(250,204,21,0.12)'; counter.style.color = '#facc15'; counter.style.border = '1px solid rgba(250,204,21,0.25)'; } else { counter.style.background = 'rgba(79,82,189,0.1)'; counter.style.color = '#8888aa'; counter.style.border = '1px solid rgba(79,82,189,0.2)'; } }
                    var rc = setInterval(function() { var root = getTabRoot(); if (root) { clearInterval(rc); updateCounter(); var iv2 = setInterval(updateCounter, 2000); intervals.push(iv2); } }, 1000); intervals.push(rc);
                    return function() { intervals.forEach(clearInterval); var root = getTabRoot(); if (root) { var c = root.querySelector('#sow-tab-counter'); if (c) c.remove(); } };
                }
            },
            {
                name: 'Background Open', color: '#ef4444', key: 'bgopen',
                on: function() {
                    var watched = new WeakSet(), intervals = []; var busy = false, homeTab = null, mouseX = 0, mouseY = 0, ready = false;
                    var mm = function(e) { mouseX = e.clientX; mouseY = e.clientY; }; document.addEventListener('mousemove', mm, true);
                    var tooltip = document.createElement('div'); tooltip.id = 'sow-bgopen-tip'; tooltip.style.cssText = 'position:fixed;z-index:999999;background:#111;border:1px solid #ff4444;border-radius:4px;font-family:monospace;font-size:11px;color:#ff4444;padding:4px 8px;pointer-events:none;display:none;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.4);'; document.body.appendChild(tooltip);
                    var toast = document.createElement('div'); toast.id = 'sow-bgopen-toast'; toast.style.cssText = 'position:fixed;bottom:10px;left:10px;z-index:999999;background:#111;border:1px solid #ff9900;border-radius:6px;font-family:monospace;font-size:12px;color:#ff9900;padding:6px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.4);'; toast.textContent = 'Background Open: waiting for SOW home...'; document.body.appendChild(toast);
                    function isOnHome() { return location.href.indexOf('/now/sow/home') >= 0; }
                    function getActiveTab() { var root = getTabRoot(); return root ? root.querySelector('.sn-chrome-one-tab.is-selected') : null; }
                    function isHome() { return homeTab && getActiveTab() === homeTab; }
                    function forceHome() { var att = 0; var poller = setInterval(function() { att++; if (isHome() || att > 40) { clearInterval(poller); busy = false; homeTab = null; return; } try { homeTab.click(); } catch(e) {} }, 100); intervals.push(poller); }
                    var clickHandler = function(e) { if (!e.shiftKey || busy || !ready) return; var target = e.target; while (target) { if (target.matches && target.matches('a[data-testisrecordlink="true"]')) { busy = true; homeTab = getActiveTab(); tooltip.textContent = 'Opening: ' + target.textContent.trim(); tooltip.style.left = (mouseX + 14) + 'px'; tooltip.style.top = (mouseY + 14) + 'px'; tooltip.style.display = 'block'; setTimeout(function() { tooltip.style.display = 'none'; }, 1200); setTimeout(forceHome, 200); break; } target = target.parentElement; } };
                    document.addEventListener('click', clickHandler, true);
                    function watchShadows(root) { if (!root) return; root.querySelectorAll('*').forEach(function(el) { if (el.shadowRoot && !watched.has(el.shadowRoot)) { watched.add(el.shadowRoot); el.shadowRoot.addEventListener('click', clickHandler, true); watchShadows(el.shadowRoot); } }); }
                    var rc = setInterval(function() { if (getTabRoot() && isOnHome()) { ready = true; clearInterval(rc); function fullPass() { watched = new WeakSet(); document.removeEventListener('click', clickHandler, true); document.addEventListener('click', clickHandler, true); watchShadows(document); } fullPass(); setTimeout(fullPass, 500); setTimeout(fullPass, 1500); setTimeout(fullPass, 3000); var iv3 = setInterval(function() { watchShadows(document); }, 3000); intervals.push(iv3); toast.textContent = 'Background Open: active'; toast.style.borderColor = '#00cc00'; toast.style.color = '#00cc00'; setTimeout(function() { toast.remove(); }, 2000); } }, 500); intervals.push(rc);
                    return function() { intervals.forEach(clearInterval); document.removeEventListener('click', clickHandler, true); document.removeEventListener('mousemove', mm, true); tooltip.remove(); var t = document.getElementById('sow-bgopen-toast'); if (t) t.remove(); };
                }
            },
            {
                name: 'Tab Load Time', color: '#10b981', key: 'tlt',
                on: function() {
                    var accent = '#4F52BD', intervals = [];
                    var hud = document.createElement('div'); hud.id = 'sow-tlt-hud'; hud.style.cssText = 'position:fixed;bottom:10px;left:10px;z-index:999999;background:#111;border:2px solid ' + accent + ';border-radius:8px;font-family:monospace;font-size:12px;color:#ccc;width:340px;box-shadow:0 0 20px rgba(79,82,189,0.3);overflow:hidden;';
                    var header = document.createElement('div'); header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 14px;cursor:pointer;user-select:none;';
                    header.innerHTML = '<span style="color:' + accent + ';font-weight:bold;">Tab Load Time</span><span style="display:flex;align-items:center;gap:10px;"><span id="tp-header-avg" style="font-weight:bold;color:#ff9900;">--</span><span id="tp-toggle" style="font-size:16px;color:' + accent + ';">+</span></span>';
                    var bd = document.createElement('div'); bd.id = 'tp-body'; bd.style.cssText = 'display:none;padding:10px 14px;border-top:1px solid #222;max-height:400px;overflow-y:auto;';
                    bd.innerHTML = '<div id="tp-avg" style="background:#1a1a1a;padding:10px;border-radius:6px;margin-bottom:8px;"><div style="display:flex;justify-content:space-between;"><div><div style="color:#666;font-size:10px;">AVG SWITCH TIME</div><div id="tp-avg-val" style="font-size:22px;font-weight:bold;color:#ff9900;">--</div></div><div style="text-align:right;"><div style="color:#666;font-size:10px;">SWITCHES</div><div id="tp-count" style="font-size:22px;font-weight:bold;color:' + accent + ';">0</div></div></div></div><div id="tp-breakdown" style="background:#1a1a1a;padding:10px;border-radius:6px;margin-bottom:8px;"><div style="color:#666;font-size:10px;margin-bottom:6px;">BREAKDOWN</div><div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span style="color:#888;">DOM mutation</span><span id="tp-dom" style="color:#fff;">--</span></div><div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span style="color:#888;">Layout/paint</span><span id="tp-paint" style="color:#fff;">--</span></div><div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span style="color:#888;">JS execution</span><span id="tp-js" style="color:#fff;">--</span></div><div style="display:flex;justify-content:space-between;"><span style="color:#888;">Total blocked</span><span id="tp-blocked" style="color:#fff;">--</span></div></div><div id="tp-log" style="font-size:10px;"></div>';
                    var col = true; header.addEventListener('click', function() { col = !col; bd.style.display = col ? 'none' : 'block'; document.getElementById('tp-toggle').textContent = col ? '+' : '_'; });
                    hud.appendChild(header); hud.appendChild(bd); document.body.appendChild(hud);
                    var switches = [], switching = false, watched = new WeakSet();
                    function detectClick(e) { var target = e.target; while (target) { var cls = target.className || ''; if ((typeof cls === 'string' && cls.includes('sn-chrome-one-tab')) || (target.getAttribute && target.getAttribute('role') === 'tab')) { startMeasure(); break; } target = target.parentElement; } }
                    function watchTabs(root) { if (!root) return; root.querySelectorAll('*').forEach(function(el) { if (el.shadowRoot && !watched.has(el.shadowRoot)) { watched.add(el.shadowRoot); el.shadowRoot.addEventListener('click', detectClick, true); watchTabs(el.shadowRoot); } }); }
                    function startMeasure() { if (switching) return; switching = true; var switchStart = performance.now(); var domTime = 0, mutationCount = 0; var longTasks = []; var ltObs; try { ltObs = new PerformanceObserver(function(list) { list.getEntries().forEach(function(e) { longTasks.push(e.duration); }); }); ltObs.observe({ entryTypes: ['longtask'] }); } catch(e) {} var mutObs = new MutationObserver(function(muts) { mutationCount += muts.length; var now = performance.now(); domTime += (now - (mutObs._lt || switchStart)); mutObs._lt = now; }); mutObs.observe(document.body, { childList: true, subtree: true }); var checks = 0, lastMut = { val: 0 }; function checkSettled() { checks++; if (mutationCount === lastMut.val || checks > 50) { var total = performance.now() - switchStart; mutObs.disconnect(); if (ltObs) ltObs.disconnect(); var js = longTasks.reduce(function(a, b) { return a + b; }, 0); var paint = Math.max(0, total - js - Math.min(domTime, total)); switching = false; switches.push({ total: total, dom: domTime, paint: paint, js: js, mutations: mutationCount, time: new Date().toLocaleTimeString() }); var avg = Math.round(switches.reduce(function(a, b) { return a + b.total; }, 0) / switches.length); var avgColor = avg < 500 ? '#00cc00' : avg < 1500 ? '#ff9900' : '#ff4444'; document.getElementById('tp-avg-val').textContent = avg + 'ms'; document.getElementById('tp-avg-val').style.color = avgColor; document.getElementById('tp-header-avg').textContent = avg + 'ms'; document.getElementById('tp-header-avg').style.color = avgColor; document.getElementById('tp-count').textContent = switches.length; document.getElementById('tp-dom').textContent = Math.round(domTime) + 'ms (' + mutationCount + ' mutations)'; document.getElementById('tp-paint').textContent = Math.round(paint) + 'ms'; document.getElementById('tp-js').textContent = Math.round(js) + 'ms'; document.getElementById('tp-blocked').textContent = Math.round(total) + 'ms'; var color = total < 500 ? '#00cc00' : total < 1500 ? '#ff9900' : '#ff4444'; var log = document.getElementById('tp-log'); var line = document.createElement('div'); line.style.cssText = 'padding:4px 0;border-bottom:1px solid #1a1a1a;'; line.innerHTML = '<span style="color:#888;">' + switches[switches.length - 1].time + '</span><span style="color:' + color + ';font-weight:bold;"> ' + Math.round(total) + 'ms</span><span style="color:#555;"> | dom:' + Math.round(domTime) + 'ms js:' + Math.round(js) + 'ms paint:' + Math.round(paint) + 'ms | ' + mutationCount + ' mutations</span>'; log.prepend(line); } else { lastMut.val = mutationCount; setTimeout(checkSettled, 100); } } setTimeout(checkSettled, 200); }
                    document.addEventListener('click', detectClick, true);
                    var rc = setInterval(function() { var m1 = document.querySelector('macroponent-f51912f4c700201072b211d4d8c26010'); if (m1 && m1.shadowRoot) { clearInterval(rc); watchTabs(document); var iv4 = setInterval(function() { watchTabs(document); }, 3000); intervals.push(iv4); } }, 1000); intervals.push(rc);
                    return function() { intervals.forEach(clearInterval); document.removeEventListener('click', detectClick, true); hud.remove(); };
                }
            },
            {
                name: 'Lockout Check', color: '#a78bff', key: 'lc',
                on: function() {
                    var intervals = [];
                    function ww(r, f, d) { if (!r || d > 30) return; try { r.querySelectorAll('*').forEach(function(e) { f(e); if (e.shadowRoot) ww(e.shadowRoot, f, d + 1); }); } catch(e) {} }
                    function pp(n) { var x = n.parentNode; if (x && x.nodeType === 11 && x.host) x = x.host; if (!x && n.getRootNode) { var r = n.getRootNode(); if (r && r.host && r.host !== n) x = r.host; } return x; }
                    function ss(n) { var c = n, h = 0; while (c && h < 60) { if (c.getAttribute) { var i = c.getAttribute('component-id') || ''; var m = i.match(/^([a-f0-9]{20,})-/); if (m) return m[1]; } c = pp(c); h++; } return null; }
                    function findTabButtons() { var btns = []; ww(document, function(e) { if (e.tagName && e.tagName.toLowerCase() === 'now-button' && e.getAttribute('role') === 'tab') { btns.push(e); } else if (e.getAttribute && e.getAttribute('role') === 'tab' && btns.indexOf(e) < 0) { btns.push(e); } }, 0); return btns; }
                    function stage(btn) {
                        var tabBtns = findTabButtons();
                        if (!tabBtns.length) { alert('Could not find tab buttons. Switch to Details tab manually.'); return; }
                        var detailsBtn = null, currentBtn = null;
                        tabBtns.forEach(function(t) {
                            var lbl = (t.getAttribute('label') || t.textContent || '').toLowerCase();
                            var sel = t.getAttribute('aria-selected') || t.getAttribute('selected') || '';
                            if (lbl.indexOf('detail') >= 0) detailsBtn = t;
                            if (sel === 'true' || sel === 'selected') currentBtn = t;
                        });
                        if (!detailsBtn) { alert('Could not find Details tab.'); return; }
                        btn.textContent = 'open the details tab plz thx';
                        try { detailsBtn.click(); } catch(e) {}
                        setTimeout(function() { if (currentBtn && currentBtn !== detailsBtn) { try { currentBtn.click(); } catch(e) {} } }, 1200);
                    }
                    function inj() {
                        var cs = [], is = [], lp = [];
                        ww(document, function(e) {
                            var t = e.tagName.toLowerCase();
                            if (t === 'sn-contact-card') cs.push(e);
                            if (t === 'input' && e.getAttribute('name') === 'caller_id.employee_number') is.push(e);
                            if (e.classList && e.classList.contains('now-label-value-pair')) {
                                var l = e.querySelector('.now-label-value-label');
                                var v = e.querySelector('.now-label-value-value [title]');
                                if (l && v && /employee\s*number/i.test(l.textContent || '')) {
                                    var vl = v.getAttribute('title') || v.textContent;
                                    if (vl && vl.trim()) lp.push({ el: e, value: vl.trim() });
                                }
                            }
                        }, 0);
                        var m = {};
                        is.forEach(function(i) { var x = ss(i); if (x && i.value) m[x] = i.value; });
                        lp.forEach(function(o) { var x = ss(o.el); if (x && o.value) m[x] = o.value; });
                        cs.forEach(function(c) {
                            var r = c.shadowRoot; if (!r) return;
                            var a = c.getAttribute('aria-label') || '';
                            if (a.toLowerCase().indexOf('caller') < 0) return;
                            var ct = r.querySelector('.sn-contact-card--content') || r.querySelector('.sn-contact-card--container');
                            if (!ct) return;
                            var sx = ss(c);
                            var eid = sx ? m[sx] : null;
                            var nm = c.getAttribute('heading-name') || 'unknown';
                            var b = r.querySelector('.lockout-btn');
                            if (!b) {
                                b = document.createElement('button');
                                b.className = 'lockout-btn';
                                b.style.cssText = 'margin-top:6px;padding:4px 10px;font-size:12px;color:#fff;border:0;border-radius:4px;cursor:pointer;font-family:inherit;font-weight:500;';
                                ct.appendChild(b);
                            }
                            var newMode = eid ? 'ready' : 'stage';
                            if (b.dataset.mode === newMode && b.dataset.empId === (eid || '')) return;
                            b.dataset.mode = newMode;
                            b.dataset.empId = eid || '';
                            b.dataset.name = nm;
                            if (eid) {
                                b.textContent = 'Check Lockout';
                                b.title = 'Open lockout status for ' + eid;
                                b.style.background = '#293e40';
                                b.onclick = function(ev) {
                                    ev.preventDefault(); ev.stopPropagation();
                                    var id = b.dataset.empId; if (!id) return;
                                    window.open('https://userlockoutstatus.eduweb.vic.gov.au/Default.aspx?AccountName=' + encodeURIComponent(id), 'lockout_popup', 'width=700,height=500,resizable=yes,scrollbars=yes');
                                };
                            } else {
                                b.textContent = 'Stage';
                                b.title = 'Click to briefly load Details tab and read employee ID';
                                b.style.background = '#c98a2b';
                                b.onclick = function(ev) {
                                    ev.preventDefault(); ev.stopPropagation();
                                    stage(b);
                                };
                            }
                        });
                    }
                    inj();
                    var iv = setInterval(function() { try { inj(); } catch(e) {} }, 2000);
                    intervals.push(iv);
                    return function() {
                        intervals.forEach(clearInterval);
                        ww(document, function(e) { if (e.shadowRoot) e.shadowRoot.querySelectorAll('.lockout-btn').forEach(function(b) { b.remove(); }); }, 0);
                    };
                }
            },
            {
                name: 'Genesys Timer', color: '#00c2e0', key: 'gt',
                on: function() {
                    var SK = 'sow-gt-history';
                    var DK = 'sow-gt-day';
                    var DAILY_WRAP_BUDGET_S = 15 * 60;
                    var WRAP_NOTIFY_S = 300;

                    var intervals = [], hookedWindows = new WeakSet(), listenerRefs = [];
                    var phaseState = { phase: 'idle', anchor: null, meta: {}, lastId: null, currentCall: null };
                    var cachedFrame = null;
                    var ddOpen = false;
                    var statusState = null;
                    var notifiedForCall = null;

                    var history = [];
                    try { history = JSON.parse(sessionStorage.getItem(SK)) || []; } catch(e) {}
                    function saveHistory() { try { sessionStorage.setItem(SK, JSON.stringify(history)); } catch(e) {} }

                    var todayKey = new Date().toISOString().slice(0, 10);
                    var dayStats = { date: todayKey, calls: 0, totalCallTime: 0, totalWrap: 0, longestWrap: 0, totalIvr: 0, totalAcd: 0 };
                    try {
                        var stored = JSON.parse(localStorage.getItem(DK) || '{}');
                        if (stored.date === todayKey) {
                            dayStats.calls = stored.calls || 0;
                            dayStats.totalCallTime = stored.totalCallTime || 0;
                            dayStats.totalWrap = stored.totalWrap || 0;
                            dayStats.longestWrap = stored.longestWrap || 0;
                            dayStats.totalIvr = stored.totalIvr || 0;
                            dayStats.totalAcd = stored.totalAcd || 0;
                        }
                    } catch(e) {}
                    function saveDayStats() { try { localStorage.setItem(DK, JSON.stringify(dayStats)); } catch(e) {} }

                    try {
                        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                            Notification.requestPermission();
                        }
                    } catch(e) {}

                    function mapStatus(status, subStatus) {
                        if (!status) return null;
                        var s = String(status).toUpperCase();
                        var color = '#888';
                        if (s === 'ON_QUEUE' || s === 'AVAILABLE') color = '#10b981';
                        else if (s === 'BREAK' || s === 'MEAL') color = '#f59e0b';
                        else if (s === 'TRAINING' || s === 'MEETING') color = '#00c2e0';
                        else if (s === 'BUSY' || s === 'AWAY' || s === 'OUT_OF_OFFICE') color = '#ef4444';
                        else if (s === 'OFF_QUEUE') color = '#888';
                        var label = s.replace(/_/g, ' ');
                        if (subStatus && String(subStatus).trim()) label += ' · ' + String(subStatus).toUpperCase();
                        return { code: s, sub: subStatus || '', label: label, color: color };
                    }

                    var styleEl = document.createElement('style');
                    styleEl.id = 'sow-gt-styles';
                    styleEl.textContent = '@keyframes gt-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } } @keyframes gt-dot-hook { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } } @keyframes gt-wrap-flash { 0%, 100% { opacity: 0.75; } 50% { opacity: 1; } }';
                    document.head.appendChild(styleEl);

                    var widget = document.createElement('div');
                    widget.id = 'sow-gt-widget';
                    widget.style.cssText = 'display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 12px;background:rgba(13,13,21,0.7);border:1.5px solid rgba(79,82,189,0.4);border-radius:100px;font-family:"JetBrains Mono",monospace;font-size:12px;color:#e0e0ea;box-shadow:0 0 12px rgba(79,82,189,0.15);user-select:none;cursor:pointer;transition:border-color 0.3s,box-shadow 0.3s,opacity 0.15s;margin-right:8px;align-self:center;flex-shrink:0;position:relative;overflow:hidden;';
                    widget.innerHTML = '<span id="gt-dot" style="width:7px;height:7px;border-radius:50%;background:#55556e;transition:all 0.3s;flex-shrink:0;position:relative;z-index:1;"></span>' +
                        '<span id="gt-label" style="font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#55556e;font-weight:600;position:relative;z-index:1;">IDLE</span>' +
                        '<span id="gt-time" style="font-size:12px;font-weight:600;color:#e0e0ea;font-variant-numeric:tabular-nums;min-width:42px;position:relative;z-index:1;">--:--</span>' +
                        '<svg id="gt-chevron" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color:#55556e;transition:transform 0.2s,color 0.3s;flex-shrink:0;position:relative;z-index:1;"><polyline points="6 9 12 15 18 9"/></svg>' +
                        '<div id="gt-budget-bar" style="position:absolute;bottom:0;left:0;height:2px;width:0%;background:linear-gradient(90deg,#4F52BD,#6C6FFF);transition:width 0.5s,background 0.3s,opacity 0.3s;border-bottom-left-radius:100px;border-bottom-right-radius:100px;z-index:0;opacity:0;"></div>';

                    var dot = widget.querySelector('#gt-dot');
                    var labelEl = widget.querySelector('#gt-label');
                    var timeEl = widget.querySelector('#gt-time');
                    var chevron = widget.querySelector('#gt-chevron');
                    var budgetBar = widget.querySelector('#gt-budget-bar');

                    var statusPill = document.createElement('div');
                    statusPill.id = 'sow-gt-status-pill';
                    statusPill.style.cssText = 'display:none;align-items:center;gap:6px;height:22px;padding:0 10px;background:rgba(13,13,21,0.6);border:1px solid rgba(108,111,255,0.3);border-radius:100px;font-family:"JetBrains Mono",monospace;font-size:9px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#a8aaff;user-select:none;margin-right:8px;align-self:center;flex-shrink:0;transition:all 0.3s;';
                    statusPill.innerHTML = '<span id="gts-dot" style="width:6px;height:6px;border-radius:50%;background:#888;flex-shrink:0;transition:all 0.3s;"></span><span id="gts-label">--</span>';
                    var statusDot = statusPill.querySelector('#gts-dot');
                    var statusLabel = statusPill.querySelector('#gts-label');

                    var incomingPanel = document.createElement('div');
                    incomingPanel.id = 'sow-gt-incoming';
                    incomingPanel.style.cssText = 'position:fixed;display:none;z-index:9999998;background:rgba(13,13,21,0.96);border:1.5px solid #00c2e0;border-radius:10px;padding:12px 16px;font-family:"JetBrains Mono",monospace;font-size:11px;color:#e0e0ea;box-shadow:0 8px 32px rgba(0,0,0,0.5),0 0 24px rgba(0,194,224,0.4);min-width:240px;max-width:320px;backdrop-filter:blur(12px);';
                    document.body.appendChild(incomingPanel);

                    var dropdown = document.createElement('div');
                    dropdown.id = 'sow-gt-dropdown';
                    dropdown.style.cssText = 'position:fixed;display:none;z-index:9999999;background:rgba(13,13,21,0.96);border:1.5px solid rgba(79,82,189,0.4);border-radius:10px;font-family:"JetBrains Mono",monospace;font-size:12px;color:#e0e0ea;box-shadow:0 8px 32px rgba(0,0,0,0.5),0 0 20px rgba(79,82,189,0.2);min-width:340px;max-width:420px;max-height:540px;overflow:hidden;backdrop-filter:blur(12px);';
                    var ddHeader = document.createElement('div');
                    ddHeader.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid rgba(79,82,189,0.2);';
                    ddHeader.innerHTML = '<span style="color:#4F52BD;font-weight:bold;font-size:11px;letter-spacing:1.5px;">RECENT CALLS</span><span id="gt-clear" style="cursor:pointer;color:#55556e;font-size:10px;letter-spacing:1px;transition:color 0.2s;">CLEAR</span>';
                    var ddStats = document.createElement('div');
                    ddStats.id = 'gt-stats';
                    ddStats.style.cssText = 'padding:10px 14px;border-bottom:1px solid rgba(79,82,189,0.2);background:rgba(79,82,189,0.05);';
                    var ddList = document.createElement('div');
                    ddList.id = 'gt-list';
                    ddList.style.cssText = 'overflow-y:auto;max-height:380px;';
                    dropdown.appendChild(ddHeader);
                    dropdown.appendChild(ddStats);
                    dropdown.appendChild(ddList);
                    document.body.appendChild(dropdown);

                    var clearBtn = ddHeader.querySelector('#gt-clear');
                    clearBtn.addEventListener('mouseenter', function() { clearBtn.style.color = '#ef4444'; });
                    clearBtn.addEventListener('mouseleave', function() { clearBtn.style.color = '#55556e'; });
                    clearBtn.addEventListener('click', function(e) { e.stopPropagation(); history = []; saveHistory(); renderHistory(); });

                    function fmt(secs) {
                        secs = Math.max(0, Math.floor(secs));
                        var h = Math.floor(secs / 3600);
                        var m = Math.floor((secs % 3600) / 60);
                        var s = secs % 60;
                        var p = function(n) { return n < 10 ? '0' + n : '' + n; };
                        if (h > 0) return h + ':' + p(m) + ':' + p(s);
                        return p(m) + ':' + p(s);
                    }

                    function fmtShort(secs) {
                        secs = Math.max(0, Math.floor(secs));
                        if (secs < 60) return secs + 's';
                        var m = Math.floor(secs / 60);
                        var s = secs % 60;
                        return m + 'm' + (s ? ' ' + s + 's' : '');
                    }

                    function fmtTime(ts) {
                        var d = new Date(ts);
                        var h = d.getHours(), m = d.getMinutes();
                        var ampm = h >= 12 ? 'pm' : 'am';
                        h = h % 12 || 12;
                        return h + ':' + (m < 10 ? '0' + m : m) + ampm;
                    }

                    function renderStats() {
                        var avgWrap = dayStats.calls > 0 ? Math.round(dayStats.totalWrap / dayStats.calls) : 0;
                        var pct = Math.min(100, Math.round((dayStats.totalWrap / DAILY_WRAP_BUDGET_S) * 100));
                        var budgetCol = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';
                        ddStats.innerHTML =
                            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span style="color:#888;font-size:9px;letter-spacing:1px;">TODAY</span><span style="color:#55556e;font-size:9px;">' + dayStats.calls + ' CALL' + (dayStats.calls === 1 ? '' : 'S') + '</span></div>' +
                            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:10px;">' +
                                '<div><div style="color:#55556e;font-size:9px;letter-spacing:0.5px;margin-bottom:2px;">AVG WRAP</div><div style="color:#a8aaff;font-weight:600;font-size:13px;">' + (dayStats.calls ? fmtShort(avgWrap) : '—') + '</div></div>' +
                                '<div><div style="color:#55556e;font-size:9px;letter-spacing:0.5px;margin-bottom:2px;">LONGEST</div><div style="color:#f59e0b;font-weight:600;font-size:13px;">' + (dayStats.calls ? fmtShort(dayStats.longestWrap) : '—') + '</div></div>' +
                                '<div><div style="color:#55556e;font-size:9px;letter-spacing:0.5px;margin-bottom:2px;">TOTAL WRAP</div><div style="color:' + budgetCol + ';font-weight:600;font-size:13px;">' + fmtShort(dayStats.totalWrap) + '</div></div>' +
                            '</div>' +
                            '<div style="margin-top:10px;height:4px;background:rgba(79,82,189,0.15);border-radius:2px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:' + budgetCol + ';transition:width 0.3s;"></div></div>' +
                            '<div style="display:flex;justify-content:space-between;margin-top:4px;font-size:9px;color:#55556e;letter-spacing:0.5px;"><span>BUDGET ' + pct + '%</span><span>' + fmtShort(DAILY_WRAP_BUDGET_S) + ' / day</span></div>';
                    }

                    function renderHistory() {
                        renderStats();
                        if (history.length === 0) {
                            ddList.innerHTML = '<div style="padding:24px 14px;text-align:center;color:#55556e;font-size:11px;letter-spacing:0.5px;">No calls yet this session</div>';
                            return;
                        }
                        ddList.innerHTML = '';
                        history.slice().reverse().forEach(function(h) {
                            var row = document.createElement('div');
                            row.style.cssText = 'padding:10px 14px;border-bottom:1px solid rgba(79,82,189,0.1);transition:background 0.15s;cursor:pointer;';
                            var wrapColor = h.wrapDuration < 120 ? '#f59e0b' : (h.wrapDuration < 300 ? '#ff6b00' : '#ef4444');
                            var queueChip = h.queueName ? '<span style="display:inline-block;padding:1px 7px;background:rgba(79,82,189,0.18);border:1px solid rgba(79,82,189,0.4);border-radius:100px;color:#a8aaff;font-size:9px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">' + h.queueName + '</span>' : '';
                            var dialedRow = h.calledNumber ? '<div style="font-size:10px;color:#888;margin-bottom:4px;letter-spacing:0.3px;"><span style="color:#55556e;">DIALED </span><span style="color:#a8aaff;font-family:\'JetBrains Mono\',monospace;">' + h.calledNumber + '</span></div>' : '';
                            row.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;gap:8px;"><span style="color:#e0e0ea;font-weight:600;font-size:13px;flex:1;">' + (h.phone || 'Unknown') + '</span><span style="color:#55556e;font-size:10px;flex-shrink:0;">' + fmtTime(h.endTime) + '</span></div>' +
                                dialedRow +
                                (queueChip ? '<div style="margin-bottom:6px;">' + queueChip + '</div>' : '') +
                                '<div style="display:flex;gap:10px;font-size:10px;color:#888;letter-spacing:0.5px;flex-wrap:wrap;"><span>Talk <span style="color:#10b981;">' + fmt(h.callDuration) + '</span></span><span>Wrap <span style="color:' + wrapColor + ';">' + fmt(h.wrapDuration) + '</span></span></div>' +
                                '<div class="gt-copy-hint" style="font-size:9px;color:#4F52BD;margin-top:4px;letter-spacing:1px;opacity:0;transition:opacity 0.15s;">CLICK TO COPY CALLER NUMBER</div>';
                            var hintEl = row.querySelector('.gt-copy-hint');
                            row.addEventListener('mouseenter', function() { row.style.background = 'rgba(79,82,189,0.08)'; hintEl.style.opacity = '1'; });
                            row.addEventListener('mouseleave', function() { row.style.background = 'transparent'; hintEl.style.opacity = '0'; });
                            row.addEventListener('click', function(e) {
                                e.stopPropagation();
                                var phone = h.phone || '';
                                if (!phone) return;
                                try {
                                    navigator.clipboard.writeText(phone).then(function() {
                                        hintEl.textContent = 'COPIED ' + phone;
                                        hintEl.style.color = '#10b981';
                                        hintEl.style.opacity = '1';
                                        setTimeout(function() { hintEl.textContent = 'CLICK TO COPY CALLER NUMBER'; hintEl.style.color = '#4F52BD'; }, 1400);
                                    });
                                } catch(err) {}
                            });
                            ddList.appendChild(row);
                        });
                    }

                    function renderIncomingPanel() {
                        var c = phaseState.currentCall;
                        if (phaseState.phase !== 'alerting' || !c) {
                            incomingPanel.style.display = 'none';
                            return;
                        }
                        var rows = [];
                        rows.push('<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><span style="width:8px;height:8px;border-radius:50%;background:#00c2e0;box-shadow:0 0 10px #00c2e0;animation:gt-pulse 1.2s infinite;"></span><span style="color:#00c2e0;font-weight:700;letter-spacing:1.5px;font-size:10px;">INCOMING CALL</span></div>');
                        if (c.phone) rows.push('<div style="font-size:14px;font-weight:600;color:#e0e0ea;margin-bottom:8px;">' + c.phone + '</div>');
                        var details = [];
                        if (typeof c.ivrSeconds === 'number') details.push('<div><span style="color:#888;">In IVR for </span><span style="color:#a8aaff;font-weight:600;">' + fmtShort(c.ivrSeconds) + '</span></div>');
                        if (c.queueName) details.push('<div><span style="color:#888;">Queue: </span><span style="color:#a8aaff;font-weight:600;">' + c.queueName + '</span></div>');
                        if (c.direction) details.push('<div><span style="color:#888;">Direction: </span><span style="color:#a8aaff;font-weight:600;">' + c.direction + '</span></div>');
                        if (c.calledNumber) details.push('<div><span style="color:#888;">Dialed: </span><span style="color:#a8aaff;">' + c.calledNumber + '</span></div>');
                        if (details.length) rows.push('<div style="display:flex;flex-direction:column;gap:4px;font-size:11px;">' + details.join('') + '</div>');
                        incomingPanel.innerHTML = rows.join('');
                        var r = widget.getBoundingClientRect();
                        incomingPanel.style.display = 'block';
                        var pw = incomingPanel.offsetWidth || 240;
                        var lp = r.left;
                        if (lp + pw > window.innerWidth - 12) lp = window.innerWidth - pw - 12;
                        incomingPanel.style.top = (r.bottom + 8) + 'px';
                        incomingPanel.style.left = Math.max(12, lp) + 'px';
                    }

                    function positionDropdown() {
                        var r = widget.getBoundingClientRect();
                        var ddWidth = dropdown.offsetWidth || 340;
                        var leftPos = r.left;
                        if (leftPos + ddWidth > window.innerWidth - 12) leftPos = window.innerWidth - ddWidth - 12;
                        dropdown.style.top = (r.bottom + 8) + 'px';
                        dropdown.style.left = Math.max(12, leftPos) + 'px';
                    }

                    function toggleDropdown() {
                        if (ddOpen) {
                            dropdown.style.display = 'none';
                            chevron.style.transform = 'rotate(0deg)';
                            ddOpen = false;
                        } else {
                            renderHistory();
                            dropdown.style.display = 'block';
                            positionDropdown();
                            chevron.style.transform = 'rotate(180deg)';
                            ddOpen = true;
                        }
                    }

                    widget.addEventListener('click', function(e) { e.stopPropagation(); toggleDropdown(); });

                    var docClick = function(e) {
                        if (!ddOpen) return;
                        var path = e.composedPath ? e.composedPath() : [e.target];
                        for (var i = 0; i < path.length; i++) {
                            if (path[i] === widget || path[i] === dropdown) return;
                        }
                        toggleDropdown();
                    };
                    document.addEventListener('click', docClick, true);

                    function applyStyle(borderCol, glow, dotCol, labelCol, timeCol) {
                        widget.style.borderColor = borderCol;
                        widget.style.boxShadow = '0 0 12px ' + glow;
                        dot.style.background = dotCol;
                        dot.style.boxShadow = '0 0 8px ' + dotCol;
                        labelEl.style.color = labelCol;
                        timeEl.style.color = timeCol;
                        chevron.style.color = labelCol;
                    }

                    function updateBudgetBar() {
                        var p = phaseState.phase;
                        if (p !== 'idle' && p !== 'wrapup') {
                            budgetBar.style.opacity = '0';
                            return;
                        }
                        if (dayStats.totalWrap <= 0) {
                            budgetBar.style.opacity = '0';
                            return;
                        }
                        budgetBar.style.opacity = '1';
                        var pct = Math.min(100, (dayStats.totalWrap / DAILY_WRAP_BUDGET_S) * 100);
                        budgetBar.style.width = pct + '%';
                        if (pct >= 100) budgetBar.style.background = 'linear-gradient(90deg, #ef4444, #ff6b6b)';
                        else if (pct >= 80) budgetBar.style.background = 'linear-gradient(90deg, #f59e0b, #ffb84d)';
                        else budgetBar.style.background = 'linear-gradient(90deg, #4F52BD, #6C6FFF)';
                    }

                    function renderStatusPill() {
                        if (phaseState.phase === 'idle' && statusState) {
                            statusPill.style.display = 'inline-flex';
                            statusLabel.textContent = statusState.label;
                            statusDot.style.background = statusState.color;
                            statusDot.style.boxShadow = '0 0 6px ' + statusState.color;
                            statusPill.style.borderColor = statusState.color + '66';
                            statusLabel.style.color = statusState.color;
                        } else {
                            statusPill.style.display = 'none';
                        }
                    }

                    function fireWrapNotification() {
                        try {
                            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                                var n = new Notification('Wrap-up running long', {
                                    body: 'You\'ve been in wrap-up for over 5 minutes. Don\'t forget to disposition!',
                                    tag: 'sow-gt-wrapup',
                                    requireInteraction: false
                                });
                                setTimeout(function() { try { n.close(); } catch(e) {} }, 12000);
                            }
                        } catch(e) {}
                    }

                    function render() {
                        var p = phaseState.phase;
                        dot.style.opacity = '1';
                        dot.style.animation = 'none';
                        widget.style.animation = 'none';
                        if (p === 'hooking') {
                            labelEl.textContent = 'HOOKING';
                            timeEl.textContent = 'Genesys...';
                            applyStyle('#6C6FFF', 'rgba(108,111,255,0.45)', '#6C6FFF', '#6C6FFF', '#6C6FFF');
                            widget.style.opacity = '1';
                            dot.style.animation = 'gt-dot-hook 0.5s ease-in-out infinite';
                        } else if (p === 'hooked') {
                            labelEl.textContent = 'HOOKED';
                            timeEl.textContent = '✓';
                            applyStyle('#10b981', 'rgba(16,185,129,0.45)', '#10b981', '#10b981', '#10b981');
                            widget.style.opacity = '1';
                        } else if (p === 'idle') {
                            labelEl.textContent = 'IDLE';
                            timeEl.textContent = phaseState.anchor ? fmt((Date.now() - phaseState.anchor) / 1000) : '--:--';
                            applyStyle('#6C6FFF', 'rgba(108,111,255,0.45)', '#6C6FFF', '#6C6FFF', '#a8aaff');
                            widget.style.opacity = '1';
                        } else if (p === 'alerting') {
                            labelEl.textContent = 'INCOMING';
                            timeEl.textContent = phaseState.meta.from || '...';
                            applyStyle('#00c2e0', 'rgba(0,194,224,0.4)', '#00c2e0', '#00c2e0', '#00c2e0');
                            widget.style.opacity = '1';
                        } else if (p === 'oncall') {
                            var elapsed = (Date.now() - phaseState.anchor) / 1000;
                            labelEl.textContent = 'ON CALL';
                            timeEl.textContent = fmt(elapsed);
                            applyStyle('#10b981', 'rgba(16,185,129,0.3)', '#10b981', '#10b981', '#10b981');
                            widget.style.opacity = '1';
                        } else if (p === 'wrapup') {
                            var el = (Date.now() - phaseState.anchor) / 1000;
                            var c, g;
                            if (el < 120) { c = '#f59e0b'; g = 'rgba(245,158,11,0.4)'; }
                            else if (el < 300) { c = '#ff6b00'; g = 'rgba(255,107,0,0.5)'; }
                            else { c = '#ef4444'; g = 'rgba(239,68,68,0.6)'; }
                            labelEl.textContent = 'WRAP-UP';
                            timeEl.textContent = fmt(el);
                            applyStyle(c, g, c, c, c);
                            if (el >= 300) {
                                widget.style.animation = 'gt-wrap-flash 0.5s ease-in-out infinite';
                                if (notifiedForCall !== phaseState.lastId) {
                                    notifiedForCall = phaseState.lastId;
                                    fireWrapNotification();
                                }
                            } else {
                                widget.style.opacity = '1';
                            }
                        }
                        updateBudgetBar();
                        renderStatusPill();
                        renderIncomingPanel();
                    }

                    function handleMsg(ev) {
                        var data = ev.data;
                        if (!data || data.type !== 'softphone_connector') return;
                        var msg = data.msg;
                        if (!msg) return;

                        if (msg.type === 'UserAction' && msg.category === 'status' && msg.data && msg.data.status) {
                            statusState = mapStatus(msg.data.status, msg.data.sub_status);
                            renderStatusPill();
                            return;
                        }
                        if (msg.type === 'UserAction' && msg.category === 'routingStatus') {
                            if (!statusState && (msg.data === 'IDLE' || msg.data === 'OFF_QUEUE')) {
                                statusState = mapStatus(msg.data === 'IDLE' ? 'ON_QUEUE' : 'OFF_QUEUE', null);
                                renderStatusPill();
                            }
                            return;
                        }

                        if (msg.type !== 'Interaction') return;
                        var d = (msg.data && msg.data.new) ? msg.data.new : msg.data;
                        if (!d) return;
                        var cat = msg.category;
                        if (cat === 'add' && d.state === 'ALERTING') {
                            phaseState.phase = 'alerting';
                            phaseState.meta.from = d.displayAddress || d.ani || d.name || '';
                            phaseState.lastId = d.id;
                            phaseState.currentCall = {
                                phone: d.displayAddress || d.ani || d.name || '',
                                queueName: d.queueName || '',
                                direction: d.direction || '',
                                calledNumber: d.calledNumber || '',
                                ivrSeconds: typeof d.totalIvrDurationSeconds === 'number' ? d.totalIvrDurationSeconds : null,
                                alertTime: Date.now()
                            };
                        } else if ((cat === 'connect' || cat === 'change') && d.isConnected && d.state === 'CONNECTED') {
                            phaseState.phase = 'oncall';
                            phaseState.anchor = d.connectedTime ? new Date(d.connectedTime).getTime() : Date.now();
                            phaseState.lastId = d.id;
                            if (!phaseState.currentCall) phaseState.currentCall = {};
                            phaseState.currentCall.phone = d.displayAddress || d.ani || d.name || phaseState.currentCall.phone || '';
                            phaseState.currentCall.queueName = d.queueName || phaseState.currentCall.queueName || '';
                            phaseState.currentCall.calledNumber = d.calledNumber || phaseState.currentCall.calledNumber || '';
                            phaseState.currentCall.direction = d.direction || phaseState.currentCall.direction || '';
                            phaseState.currentCall.connectedTime = phaseState.anchor;
                            if (typeof d.totalIvrDurationSeconds === 'number') phaseState.currentCall.ivrSeconds = d.totalIvrDurationSeconds;
                        } else if ((cat === 'disconnect' || (cat === 'change' && d.isDisconnected && !d.isDone)) && d.state === 'DISCONNECTED') {
                            phaseState.phase = 'wrapup';
                            phaseState.anchor = d.endTime ? new Date(d.endTime).getTime() : Date.now();
                            phaseState.lastId = d.id;
                            if (!phaseState.currentCall) phaseState.currentCall = {};
                            phaseState.currentCall.endTime = phaseState.anchor;
                            phaseState.currentCall.callDuration = d.interactionDurationSeconds || (phaseState.currentCall.connectedTime ? Math.floor((phaseState.anchor - phaseState.currentCall.connectedTime) / 1000) : 0);
                            if (typeof d.totalAcdDurationSeconds === 'number') phaseState.currentCall.acdSeconds = d.totalAcdDurationSeconds;
                            if (typeof d.totalIvrDurationSeconds === 'number') phaseState.currentCall.ivrSeconds = d.totalIvrDurationSeconds;
                        } else if (cat === 'acw' && d.isDone) {
                            if (phaseState.currentCall && phaseState.currentCall.endTime) {
                                var wrapDuration = d.dispositionDurationSeconds || Math.floor((Date.now() - phaseState.anchor) / 1000);
                                var callDuration = phaseState.currentCall.callDuration || d.interactionDurationSeconds || 0;
                                var entry = {
                                    phone: phaseState.currentCall.phone || (d.displayAddress || d.ani || d.name || ''),
                                    queueName: phaseState.currentCall.queueName || d.queueName || '',
                                    calledNumber: phaseState.currentCall.calledNumber || d.calledNumber || '',
                                    direction: phaseState.currentCall.direction || d.direction || '',
                                    endTime: phaseState.currentCall.endTime,
                                    callDuration: callDuration,
                                    wrapDuration: wrapDuration,
                                    ivrSeconds: phaseState.currentCall.ivrSeconds,
                                    acdSeconds: phaseState.currentCall.acdSeconds
                                };
                                history.push(entry);
                                if (history.length > 50) history = history.slice(-50);
                                saveHistory();

                                var nowKey = new Date().toISOString().slice(0, 10);
                                if (nowKey !== dayStats.date) {
                                    dayStats = { date: nowKey, calls: 0, totalCallTime: 0, totalWrap: 0, longestWrap: 0, totalIvr: 0, totalAcd: 0 };
                                }
                                dayStats.calls++;
                                dayStats.totalCallTime += callDuration;
                                dayStats.totalWrap += wrapDuration;
                                if (wrapDuration > dayStats.longestWrap) dayStats.longestWrap = wrapDuration;
                                if (typeof phaseState.currentCall.ivrSeconds === 'number') dayStats.totalIvr += phaseState.currentCall.ivrSeconds;
                                if (typeof phaseState.currentCall.acdSeconds === 'number') dayStats.totalAcd += phaseState.currentCall.acdSeconds;
                                saveDayStats();

                                if (ddOpen) renderHistory();
                            }
                            phaseState.phase = 'idle';
                            phaseState.anchor = Date.now();
                            phaseState.meta = {};
                            phaseState.lastId = null;
                            phaseState.currentCall = null;
                            notifiedForCall = null;
                        }
                        render();
                    }

                    function findFrame(root, depth) {
                        if (!root || depth > 30) return null;
                        try {
                            var direct = root.querySelector && root.querySelector('iframe#iframe');
                            if (direct) return direct;
                            var all = root.querySelectorAll ? root.querySelectorAll('*') : [];
                            for (var i = 0; i < all.length; i++) {
                                if (all[i].shadowRoot) {
                                    var f = findFrame(all[i].shadowRoot, depth + 1);
                                    if (f) return f;
                                }
                            }
                        } catch(e) {}
                        return null;
                    }
                    function getFrame() {
                        if (cachedFrame && cachedFrame.isConnected && cachedFrame.contentWindow) return cachedFrame;
                        cachedFrame = findFrame(document, 0);
                        return cachedFrame;
                    }
                    function hook() {
                        var f = getFrame();
                        if (!f || !f.contentWindow) return;
                        var w = f.contentWindow;
                        if (hookedWindows.has(w)) return;
                        try {
                            w.addEventListener('message', handleMsg, true);
                            hookedWindows.add(w);
                            listenerRefs.push({ win: w, handler: handleMsg });
                        } catch(e) {}
                    }

                    function findNavSlot(root, depth) {
                        if (!root || depth > 30) return null;
                        try {
                            var direct = root.querySelector && root.querySelector('.polaris-header-controls');
                            if (direct) return direct;
                            var all = root.querySelectorAll ? root.querySelectorAll('*') : [];
                            for (var i = 0; i < all.length; i++) {
                                if (all[i].shadowRoot) {
                                    var s = findNavSlot(all[i].shadowRoot, depth + 1);
                                    if (s) return s;
                                }
                            }
                        } catch(e) {}
                        return null;
                    }

                    function mountWidget() {
                        var slot = findNavSlot(document, 0);
                        var widgetInNavbar = widget.parentNode && widget.parentNode.classList && widget.parentNode.classList.contains('polaris-header-controls');
                        if (!slot) {
                            if (!widget.parentNode || !widget.parentNode.isConnected) {
                                widget.style.position = 'fixed';
                                widget.style.top = '8px';
                                widget.style.left = '50%';
                                widget.style.transform = 'translateX(-50%)';
                                widget.style.zIndex = '999999';
                                widget.style.marginRight = '0';
                                document.body.appendChild(widget);
                            }
                            return;
                        }
                        if (!widgetInNavbar) {
                            widget.style.position = 'relative';
                            widget.style.top = '';
                            widget.style.left = '';
                            widget.style.transform = '';
                            widget.style.zIndex = '';
                            widget.style.marginRight = '8px';
                            var search = slot.querySelector('.search-container');
                            if (search) slot.insertBefore(widget, search);
                            else slot.insertBefore(widget, slot.firstChild);
                        }
                        if (statusPill.parentNode !== slot) {
                            slot.insertBefore(statusPill, widget.nextSibling);
                        }
                    }

                    phaseState.phase = 'hooking';
                    render();
                    mountWidget();
                    hook();
                    var renderIv = setInterval(render, 1000);
                    var hookIv = setInterval(hook, 2000);
                    var mountIv = setInterval(mountWidget, 2000);
                    var posIv = setInterval(function() { if (ddOpen) positionDropdown(); }, 1000);
                    intervals.push(renderIv, hookIv, mountIv, posIv);

                    var hookedTimeout = setTimeout(function() {
                        if (phaseState.phase !== 'hooking') return;
                        phaseState.phase = 'hooked';
                        render();
                        var idleTimeout = setTimeout(function() {
                            if (phaseState.phase !== 'hooked') return;
                            phaseState.phase = 'idle';
                            phaseState.anchor = Date.now();
                            render();
                        }, 900);
                    }, 2000);

                    return function() {
                        intervals.forEach(clearInterval);
                        listenerRefs.forEach(function(r) { try { r.win.removeEventListener('message', r.handler, true); } catch(e) {} });
                        document.removeEventListener('click', docClick, true);
                        widget.remove();
                        statusPill.remove();
                        dropdown.remove();
                        incomingPanel.remove();
                        try { styleEl.remove(); } catch(e) {}
                    };
                }
            },
            {
                name: 'Attachment Drop V2', color: '#10b981', key: 'ad',
                on: function() {
                    var dragCount = 0;
                    var TABLE_MAP = {
                        'INC': 'incident', 'IMS': 'interaction',
                        'RITM': 'sc_req_item', 'REQ': 'sc_request',
                        'CHG': 'change_request', 'PRB': 'problem',
                        'CTASK': 'change_task', 'SCTASK': 'sc_task',
                        'STASK': 'sn_si_task', 'TASK': 'task',
                        'KB': 'kb_knowledge'
                    };
                    var NUM_PAT = /\b(INC|RITM|REQ|CHG|PRB|CTASK|SCTASK|STASK|TASK|IMS)\d{5,}\b/;

                    var overlay = document.createElement('div');
                    overlay.id = 'sow-ad-overlay';
                    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999990;background:rgba(16,185,129,0.06);border:3px dashed rgba(16,185,129,0.6);display:none;align-items:center;justify-content:center;pointer-events:none;backdrop-filter:blur(2px);transition:opacity 0.15s;';
                    overlay.innerHTML = '<div style="background:rgba(13,13,21,0.92);border:1.5px solid #10b981;border-radius:12px;padding:24px 36px;font-family:\'JetBrains Mono\',monospace;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.5),0 0 24px rgba(16,185,129,0.3);"><div style="color:#10b981;font-size:14px;font-weight:700;letter-spacing:1.5px;">DROP TO ATTACH</div><div id="sow-ad-target" style="color:#55556e;font-size:11px;margin-top:6px;letter-spacing:0.5px;">Files will be added to the ticket</div></div>';
                    document.body.appendChild(overlay);

                    function toast(msg, color, duration) {
                        var t = document.createElement('div');
                        t.style.cssText = 'position:fixed;bottom:14px;left:50%;transform:translateX(-50%);z-index:9999999;background:rgba(13,13,21,0.94);border:1.5px solid ' + color + ';border-radius:8px;font-family:"JetBrains Mono",monospace;font-size:12px;color:' + color + ';padding:8px 16px;box-shadow:0 4px 16px rgba(0,0,0,0.4);pointer-events:none;transition:opacity 0.3s;max-width:500px;word-break:break-all;';
                        t.textContent = msg;
                        document.body.appendChild(t);
                        var d = duration || 2500;
                        setTimeout(function() { t.style.opacity = '0'; }, d);
                        setTimeout(function() { try { t.remove(); } catch(e) {} }, d + 400);
                    }

                    // Walk ALL shadow DOMs to find every selected tab, not just the top-level one.
                    // IMS tabs have sub-tabs (e.g. INC06029844 inside IMS0391209).
                    // We prefer the sub-record (INC/RITM/CHG etc.) over the parent (IMS).
                    function getActiveTicketNumber() {
                        var numbers = [];
                        function walk(root, depth) {
                            if (!root || depth > 30) return;
                            try {
                                var tabs = root.querySelectorAll('.sn-chrome-one-tab.is-selected');
                                for (var t = 0; t < tabs.length; t++) {
                                    var label = tabs[t].querySelector('.sn-chrome-one-tab-label');
                                    var text = label ? (label.textContent || '').trim() : (tabs[t].textContent || '').trim();
                                    var match = text.match(NUM_PAT);
                                    if (match) numbers.push(match[0]);
                                }
                                var all = root.querySelectorAll('*');
                                for (var i = 0; i < all.length; i++) {
                                    if (all[i].shadowRoot) walk(all[i].shadowRoot, depth + 1);
                                }
                            } catch(e) {}
                        }
                        walk(document, 0);
                        if (numbers.length === 0) return null;
                        if (numbers.length === 1) return numbers[0];
                        // Prefer non-IMS (the actual ticket) over IMS (the parent interaction)
                        var nonIms = numbers.filter(function(n) { return !n.startsWith('IMS'); });
                        return nonIms.length > 0 ? nonIms[nonIms.length - 1] : numbers[numbers.length - 1];
                    }

                    function prefixOf(number) {
                        var m = number.match(/^(SCTASK|CTASK|STASK|RITM|TASK|INC|IMS|REQ|CHG|PRB|KB)/);
                        return m ? m[1] : null;
                    }

                    // Get CSRF token
                    function getToken() {
                        if (typeof g_ck !== 'undefined' && g_ck) return g_ck;
                        if (window.g_ck) return window.g_ck;
                        if (window.NOW && window.NOW.csrf_token) return window.NOW.csrf_token;
                        try {
                            var meta = document.querySelector('meta[name="X-UserToken"]');
                            if (meta) return meta.getAttribute('content') || '';
                        } catch(e) {}
                        return '';
                    }

                    // Resolve a ticket number (e.g. INC06029522) to { table, sysId }
                    function resolveRecord(number) {
                        return new Promise(function(resolve, reject) {
                            var prefix = prefixOf(number);
                            var table = prefix ? TABLE_MAP[prefix] : null;
                            if (!table) { reject(new Error('Unknown prefix: ' + (prefix || number))); return; }

                            var token = getToken();
                            var url = '/api/now/table/' + table
                                + '?sysparm_query=number=' + encodeURIComponent(number)
                                + '&sysparm_fields=sys_id'
                                + '&sysparm_limit=1';
                            var xhr = new XMLHttpRequest();
                            xhr.open('GET', url, true);
                            xhr.setRequestHeader('Accept', 'application/json');
                            if (token) xhr.setRequestHeader('X-UserToken', token);
                            xhr.withCredentials = true;
                            xhr.onload = function() {
                                if (xhr.status < 200 || xhr.status >= 300) {
                                    reject(new Error('Lookup failed: HTTP ' + xhr.status));
                                    return;
                                }
                                try {
                                    var data = JSON.parse(xhr.responseText);
                                    if (data.result && data.result.length > 0 && data.result[0].sys_id) {
                                        resolve({ table: table, sysId: data.result[0].sys_id, number: number });
                                    } else {
                                        reject(new Error('No record found for ' + number));
                                    }
                                } catch(e) {
                                    reject(new Error('Bad response for ' + number));
                                }
                            };
                            xhr.onerror = function() { reject(new Error('Network error looking up ' + number)); };
                            xhr.send();
                        });
                    }

                    function uploadFile(file, customName, table, sysId) {
                        return new Promise(function(resolve, reject) {
                            var token = getToken();
                            var fileName = customName || file.name;
                            var url = '/api/now/attachment/file'
                                + '?table_name=' + encodeURIComponent(table)
                                + '&table_sys_id=' + sysId
                                + '&file_name=' + encodeURIComponent(fileName);
                            var xhr = new XMLHttpRequest();
                            xhr.open('POST', url, true);
                            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
                            xhr.setRequestHeader('Accept', 'application/json');
                            if (token) xhr.setRequestHeader('X-UserToken', token);
                            xhr.withCredentials = true;
                            xhr.onload = function() {
                                if (xhr.status >= 200 && xhr.status < 300) {
                                    resolve(fileName);
                                } else {
                                    reject(new Error(fileName + ': HTTP ' + xhr.status));
                                }
                            };
                            xhr.onerror = function() { reject(new Error(fileName + ': network error')); };
                            xhr.send(file);
                        });
                    }

                    // ---- Confirmation modal ----
                    var modal = null;

                    function fmtSize(bytes) {
                        if (bytes < 1024) return bytes + ' B';
                        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
                        return (bytes / 1048576).toFixed(1) + ' MB';
                    }

                    function getExtension(name) {
                        var i = name.lastIndexOf('.');
                        return i > 0 ? name.substring(i) : '';
                    }

                    function getBaseName(name) {
                        var i = name.lastIndexOf('.');
                        return i > 0 ? name.substring(0, i) : name;
                    }

                    function showConfirmModal(files, ticketNumber) {
                        if (modal) { try { modal.remove(); } catch(e) {} }

                        var backdrop = document.createElement('div');
                        backdrop.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999995;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);';

                        var box = document.createElement('div');
                        box.style.cssText = 'background:#111;border:1.5px solid #10b981;border-radius:12px;font-family:"JetBrains Mono",monospace;color:#e0e0ea;width:480px;max-width:calc(100vw - 40px);max-height:calc(100vh - 80px);overflow:hidden;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,0.6),0 0 24px rgba(16,185,129,0.2);';

                        // Header
                        var header = document.createElement('div');
                        header.style.cssText = 'padding:14px 18px;border-bottom:1px solid #222;display:flex;justify-content:space-between;align-items:center;';
                        header.innerHTML = '<div><div style="color:#10b981;font-size:13px;font-weight:700;letter-spacing:1px;">ATTACH FILES</div><div style="color:#55556e;font-size:11px;margin-top:3px;">Target: <span style="color:#a8aaff;font-weight:600;">' + ticketNumber + '</span></div></div><div id="sow-ad-close" style="cursor:pointer;color:#555;font-size:18px;padding:4px 8px;transition:color 0.15s;">✕</div>';
                        box.appendChild(header);

                        // File list
                        var list = document.createElement('div');
                        list.style.cssText = 'padding:12px 18px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:10px;';

                        var inputs = [];
                        for (var i = 0; i < files.length; i++) {
                            var f = files[i];
                            var ext = getExtension(f.name);
                            var base = getBaseName(f.name);

                            var row = document.createElement('div');
                            row.style.cssText = 'background:#1a1a1a;border:1px solid #222;border-radius:8px;padding:10px 12px;';

                            var sizeStr = fmtSize(f.size);
                            var typeStr = ext ? ext.toUpperCase().substring(1) : 'FILE';

                            row.innerHTML = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
                                '<div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:6px;padding:4px 8px;font-size:10px;font-weight:600;color:#10b981;letter-spacing:0.5px;">' + typeStr + '</div>' +
                                '<span style="color:#55556e;font-size:10px;">' + sizeStr + '</span></div>' +
                                '<div style="display:flex;align-items:center;gap:0;">' +
                                '<input class="sow-ad-name" type="text" value="" style="flex:1;background:#111;border:1px solid #333;border-right:none;border-radius:6px 0 0 6px;padding:6px 10px;font-family:\'JetBrains Mono\',monospace;font-size:12px;color:#e0e0ea;outline:none;transition:border-color 0.2s;" />' +
                                '<div style="background:#1a1a1a;border:1px solid #333;border-radius:0 6px 6px 0;padding:6px 10px;font-size:12px;color:#55556e;white-space:nowrap;">' + ext + '</div></div>';

                            list.appendChild(row);

                            var input = row.querySelector('.sow-ad-name');
                            input.value = base;
                            input.addEventListener('focus', (function(inp) { return function() { inp.style.borderColor = '#10b981'; }; })(input));
                            input.addEventListener('blur', (function(inp) { return function() { inp.style.borderColor = '#333'; }; })(input));
                            inputs.push({ input: input, ext: ext, file: f });
                        }
                        box.appendChild(list);

                        // Footer
                        var footer = document.createElement('div');
                        footer.style.cssText = 'padding:12px 18px;border-top:1px solid #222;display:flex;justify-content:flex-end;gap:10px;';

                        var cancelBtn = document.createElement('button');
                        cancelBtn.textContent = 'Cancel';
                        cancelBtn.style.cssText = 'background:transparent;border:1px solid #333;border-radius:6px;padding:8px 18px;font-family:"JetBrains Mono",monospace;font-size:12px;font-weight:600;color:#888;cursor:pointer;transition:all 0.15s;';
                        cancelBtn.addEventListener('mouseenter', function() { cancelBtn.style.borderColor = '#555'; cancelBtn.style.color = '#ccc'; });
                        cancelBtn.addEventListener('mouseleave', function() { cancelBtn.style.borderColor = '#333'; cancelBtn.style.color = '#888'; });

                        var confirmBtn = document.createElement('button');
                        confirmBtn.textContent = 'Upload ' + files.length + ' file' + (files.length > 1 ? 's' : '');
                        confirmBtn.style.cssText = 'background:#10b981;border:none;border-radius:6px;padding:8px 18px;font-family:"JetBrains Mono",monospace;font-size:12px;font-weight:700;color:#fff;cursor:pointer;transition:all 0.15s;letter-spacing:0.5px;';
                        confirmBtn.addEventListener('mouseenter', function() { confirmBtn.style.background = '#0ea271'; });
                        confirmBtn.addEventListener('mouseleave', function() { confirmBtn.style.background = '#10b981'; });

                        footer.appendChild(cancelBtn);
                        footer.appendChild(confirmBtn);
                        box.appendChild(footer);
                        backdrop.appendChild(box);
                        document.body.appendChild(backdrop);
                        modal = backdrop;

                        // Focus first input and select its text
                        if (inputs.length > 0) {
                            inputs[0].input.focus();
                            inputs[0].input.select();
                        }

                        // Close handler
                        var close = function() {
                            try { backdrop.remove(); } catch(e) {}
                            modal = null;
                        };

                        var closeBtn = header.querySelector('#sow-ad-close');
                        closeBtn.addEventListener('mouseenter', function() { closeBtn.style.color = '#ef4444'; });
                        closeBtn.addEventListener('mouseleave', function() { closeBtn.style.color = '#555'; });
                        closeBtn.addEventListener('click', close);
                        cancelBtn.addEventListener('click', close);
                        backdrop.addEventListener('click', function(ev) { if (ev.target === backdrop) close(); });

                        // Confirm handler
                        confirmBtn.addEventListener('click', function() {
                            // Collect final names
                            var uploadItems = inputs.map(function(item) {
                                var name = (item.input.value || '').trim();
                                if (!name) name = getBaseName(item.file.name);
                                return { file: item.file, name: name + item.ext };
                            });
                            close();
                            toast('Resolving ' + ticketNumber + '...', '#f59e0b');
                            resolveRecord(ticketNumber).then(function(record) {
                                toast('Uploading ' + uploadItems.length + ' file' + (uploadItems.length > 1 ? 's' : '') + ' to ' + ticketNumber + '...', '#f59e0b');
                                return Promise.all(uploadItems.map(function(item) {
                                    return uploadFile(item.file, item.name, record.table, record.sysId);
                                }));
                            }).then(function(uploaded) {
                                toast('Attached to ' + ticketNumber + ': ' + uploaded.join(', '), '#10b981', 3500);
                            }).catch(function(err) {
                                toast('Failed — ' + err.message, '#ef4444', 4000);
                            });
                        });

                        // Enter key to confirm
                        box.addEventListener('keydown', function(ev) {
                            if (ev.key === 'Enter') { ev.preventDefault(); confirmBtn.click(); }
                            if (ev.key === 'Escape') { ev.preventDefault(); close(); }
                        });
                    }

                    var hasFiles = function(e) {
                        return e.dataTransfer && e.dataTransfer.types && (e.dataTransfer.types.indexOf('Files') >= 0 || (e.dataTransfer.types.contains && e.dataTransfer.types.contains('Files')));
                    };

                    // Update overlay to show which ticket we'll attach to
                    function updateOverlayTarget() {
                        var num = getActiveTicketNumber();
                        var sub = document.getElementById('sow-ad-target');
                        if (sub) sub.textContent = num ? 'Attaching to ' + num : 'Files will be added to the ticket';
                    }

                    // Block iframes (Genesys etc.) from seeing drag events
                    function lockIframes() {
                        document.querySelectorAll('iframe').forEach(function(f) {
                            if (!f.dataset.sowPE) f.dataset.sowPE = f.style.pointerEvents || '';
                            f.style.pointerEvents = 'none';
                        });
                    }
                    function unlockIframes() {
                        document.querySelectorAll('iframe').forEach(function(f) {
                            f.style.pointerEvents = f.dataset.sowPE || '';
                            delete f.dataset.sowPE;
                        });
                    }

                    var dragenterHandler = function(e) {
                        if (!hasFiles(e)) return;
                        dragCount++;
                        e.preventDefault();
                        updateOverlayTarget();
                        overlay.style.display = 'flex';
                        overlay.style.pointerEvents = 'auto';
                        lockIframes();
                    };
                    var dragleaveHandler = function(e) {
                        dragCount--;
                        if (dragCount <= 0) { dragCount = 0; overlay.style.display = 'none'; overlay.style.pointerEvents = 'none'; unlockIframes(); }
                    };
                    var dragoverHandler = function(e) {
                        if (!hasFiles(e)) return;
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'copy';
                    };
                    var dropHandler = function(e) {
                        dragCount = 0;
                        overlay.style.display = 'none';
                        overlay.style.pointerEvents = 'none';
                        unlockIframes();
                        if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
                        e.preventDefault();
                        e.stopPropagation();

                        var number = getActiveTicketNumber();
                        if (!number) {
                            toast('Could not read ticket number from active tab', '#ef4444');
                            return;
                        }

                        var files = Array.prototype.slice.call(e.dataTransfer.files);
                        showConfirmModal(files, number);
                    };

                    document.addEventListener('dragenter', dragenterHandler, true);
                    document.addEventListener('dragleave', dragleaveHandler, true);
                    document.addEventListener('dragover', dragoverHandler, true);
                    document.addEventListener('drop', dropHandler, true);

                    // Also handle events directly on the overlay so nothing leaks through
                    overlay.addEventListener('dragover', function(e) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; });
                    overlay.addEventListener('drop', dropHandler);

                    return function() {
                        document.removeEventListener('dragenter', dragenterHandler, true);
                        document.removeEventListener('dragleave', dragleaveHandler, true);
                        document.removeEventListener('dragover', dragoverHandler, true);
                        document.removeEventListener('drop', dropHandler, true);
                        unlockIframes();
                        if (overlay) overlay.remove();
                        if (modal) { try { modal.remove(); } catch(e) {} }
                    };
                }
            },
            {
                name: 'Performance Boost', color: '#f59e0b', key: 'pb',
                on: function() {
                    // ==== 1. Block agentic_processing (fails with 400 every ~6s) ====
                    var origFetch = window.fetch;
                    window.fetch = function() {
                        var url = '';
                        try { url = typeof arguments[0] === 'string' ? arguments[0] : (arguments[0] && arguments[0].url) || ''; } catch(e) {}
                        if (url.indexOf('agentic_processing') >= 0) {
                            return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
                        }
                        return origFetch.apply(this, arguments);
                    };

                    // ==== 2. Kill CSS animations & transitions ====
                    var perfStyle = document.createElement('style');
                    perfStyle.id = 'sow-perf-boost';
                    perfStyle.textContent = '*, *::before, *::after { animation-duration: 0.001s !important; transition-duration: 0.001s !important; transition-delay: 0s !important; }';
                    document.head.appendChild(perfStyle);

                    return function() {
                        window.fetch = origFetch;
                        try { perfStyle.remove(); } catch(e) {}
                    };
                }
            },
            {
                name: 'Tooltip Blocker', color: '#ef4444', key: 'tb',
                on: function() {
                    var css = 'now-tooltip{display:none!important;visibility:hidden!important;pointer-events:none!important;height:0!important;overflow:hidden!important;}';
                    var sheet = null;
                    try { sheet = new CSSStyleSheet(); sheet.replaceSync(css); } catch(e) {}

                    function injectSheet(sr) {
                        if (!sr || !sheet) return;
                        try {
                            var s = Array.from(sr.adoptedStyleSheets);
                            if (s.indexOf(sheet) < 0) { s.push(sheet); sr.adoptedStyleSheets = s; }
                        } catch(e) {}
                    }

                    // Intercept attachShadow so every new shadow root gets the CSS immediately
                    var origAttach = Element.prototype.attachShadow;
                    Element.prototype.attachShadow = function(opts) {
                        var sr = origAttach.apply(this, arguments);
                        injectSheet(sr);
                        return sr;
                    };

                    // Sweep existing shadow roots on activation
                    function walk(root, depth) {
                        if (!root || depth > 25) return;
                        try {
                            if (root instanceof ShadowRoot) injectSheet(root);
                            if (root.querySelectorAll) {
                                root.querySelectorAll('*').forEach(function(e) {
                                    if (e.shadowRoot) { injectSheet(e.shadowRoot); walk(e.shadowRoot, depth + 1); }
                                });
                            }
                        } catch(e) {}
                    }
                    walk(document, 0);

                    // Re-sweep every 3s for shadow roots created before our attachShadow hook
                    var iv = setInterval(function() { walk(document, 0); }, 3000);

                    return function() {
                        Element.prototype.attachShadow = origAttach;
                        clearInterval(iv);
                    };
                }
            }
        ];

        var menu = document.createElement('div'); menu.id = 'sow-toolkit-menu';
        menu.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:999999;background:rgba(10,10,18,0.96);border:1px solid rgba(79,82,189,0.3);border-radius:16px;font-family:"JetBrains Mono","SF Mono",Consolas,monospace;font-size:12px;color:#ccc;width:340px;box-shadow:0 24px 80px rgba(0,0,0,0.6),0 0 0 1px rgba(79,82,189,0.1),0 0 60px rgba(79,82,189,0.08);overflow:hidden;backdrop-filter:blur(20px);';

        var hd = document.createElement('div'); hd.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:16px 20px 14px;';
        hd.innerHTML = '<div style="display:flex;align-items:center;gap:10px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C6FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg><div><div style="color:#e0e0ea;font-weight:700;font-size:13px;letter-spacing:0.5px;">SOW Toolkit</div></div></div><div style="display:flex;align-items:center;gap:10px;"><div id="sow-tk-version" style="display:flex;align-items:center;gap:6px;font-size:9px;letter-spacing:0.8px;padding:3px 10px;background:rgba(79,82,189,0.1);border:1px solid rgba(79,82,189,0.2);border-radius:100px;color:#55556e;transition:all 0.3s;cursor:default;"><span id="sow-tk-ver-dot" style="width:5px;height:5px;border-radius:50%;background:#55556e;transition:all 0.3s;flex-shrink:0;"></span><span id="sow-tk-ver-text">checking...</span></div><span id="sow-tk-close" style="cursor:pointer;color:#55556e;font-size:16px;transition:color 0.15s;padding:2px 4px;line-height:1;">✕</span></div>';
        menu.appendChild(hd);

        var sep = document.createElement('div'); sep.style.cssText = 'height:1px;background:linear-gradient(90deg,transparent,rgba(79,82,189,0.3),transparent);margin:0 20px;';
        menu.appendChild(sep);

        var toolList = document.createElement('div'); toolList.style.cssText = 'padding:8px 8px;display:flex;flex-direction:column;gap:2px;';
        menu.appendChild(toolList);

        tools.forEach(function(t) {
            var row = document.createElement('div');
            row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:10px;cursor:pointer;transition:background 0.15s;';
            row.addEventListener('mouseenter', function() { row.style.background = 'rgba(79,82,189,0.06)'; });
            row.addEventListener('mouseleave', function() { row.style.background = 'transparent'; });

            var left = document.createElement('div');
            left.style.cssText = 'display:flex;align-items:center;gap:10px;flex:1;min-width:0;';
            var indicator = document.createElement('div');
            indicator.style.cssText = 'width:6px;height:6px;border-radius:50%;background:#222;border:1px solid #333;flex-shrink:0;transition:all 0.3s;';
            var label = document.createElement('span');
            label.style.cssText = 'color:#888;font-size:12px;font-weight:500;letter-spacing:0.3px;transition:color 0.2s;';
            label.textContent = t.name;
            left.appendChild(indicator);
            left.appendChild(label);

            var toggle = document.createElement('div');
            toggle.style.cssText = 'width:36px;height:20px;border-radius:10px;background:#1a1a2a;border:1px solid #222;cursor:pointer;position:relative;transition:all 0.25s;flex-shrink:0;';
            var dot = document.createElement('div');
            dot.style.cssText = 'width:14px;height:14px;border-radius:50%;background:#333;position:absolute;top:2px;left:2px;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);';
            toggle.appendChild(dot);

            var isOn = false;

            function setOn() {
                if (isOn) return;
                isOn = true;
                toggle.style.background = t.color; toggle.style.borderColor = t.color;
                dot.style.left = '18px'; dot.style.background = '#fff';
                dot.style.boxShadow = '0 0 6px rgba(255,255,255,0.3)';
                indicator.style.background = t.color; indicator.style.borderColor = t.color;
                indicator.style.boxShadow = '0 0 8px ' + t.color;
                label.style.color = '#e0e0ea';
                state[t.key] = true; saveState(state);
                try { tk[t.key] = t.on(); } catch(e) { console.error(t.name, e); }
            }

            function setOff() {
                if (!isOn) return;
                isOn = false;
                toggle.style.background = '#1a1a2a'; toggle.style.borderColor = '#222';
                dot.style.left = '2px'; dot.style.background = '#333';
                dot.style.boxShadow = 'none';
                indicator.style.background = '#222'; indicator.style.borderColor = '#333';
                indicator.style.boxShadow = 'none';
                label.style.color = '#888';
                state[t.key] = false; saveState(state);
                if (tk[t.key]) { try { tk[t.key](); } catch(e) {} delete tk[t.key]; }
            }

            var clickHandler = function() { if (!isOn) setOn(); else setOff(); };
            toggle.addEventListener('click', clickHandler);
            row.addEventListener('click', function(e) { if (e.target !== toggle && !toggle.contains(e.target)) clickHandler(); });

            row.appendChild(left); row.appendChild(toggle); toolList.appendChild(row);

            if (state[t.key] && !tk[t.key]) setOn();
        });

        var footer = document.createElement('div'); footer.style.cssText = 'padding:10px 20px 14px;';
        var sep2 = document.createElement('div'); sep2.style.cssText = 'height:1px;background:linear-gradient(90deg,transparent,rgba(79,82,189,0.2),transparent);margin-bottom:10px;';
        footer.appendChild(sep2);
        var hint = document.createElement('div'); hint.style.cssText = 'font-size:10px;color:#333;line-height:1.5;letter-spacing:0.2px;'; hint.textContent = "if a tool doesn't activate, toggle it off and on — SOW is a big app :)"; footer.appendChild(hint);
        var updated = document.createElement('div'); updated.style.cssText = 'font-size:9px;color:#2a2a3a;letter-spacing:0.5px;margin-top:6px;display:flex;justify-content:space-between;align-items:center;'; updated.innerHTML = '<span>last updated ' + LAST_UPDATED + '</span><span style="color:#1a1a2a;">v' + CURRENT_VERSION + '</span>'; footer.appendChild(updated);
        menu.appendChild(footer);

        document.body.appendChild(menu);
        var closeEl = document.getElementById('sow-tk-close');
        closeEl.addEventListener('mouseenter', function() { closeEl.style.color = '#ef4444'; });
        closeEl.addEventListener('mouseleave', function() { closeEl.style.color = '#55556e'; });
        closeEl.addEventListener('click', function() { menu.style.display = 'none'; });


        // ---- Version Check (script-tag injection to bypass CSP connect-src) ----
        (function checkVersion() {
            var badge   = document.getElementById('sow-tk-version');
            var dotEl   = document.getElementById('sow-tk-ver-dot');
            var textEl  = document.getElementById('sow-tk-ver-text');
            if (!badge || !textEl || !dotEl) return;

            var pulseStyle = document.createElement('style');
            pulseStyle.id = 'sow-tk-vpulse';
            if (!document.getElementById('sow-tk-vpulse')) {
                pulseStyle.textContent = '@keyframes sow-vpulse{0%,100%{opacity:1}50%{opacity:0.35}}';
                document.head.appendChild(pulseStyle);
            }
            dotEl.style.animation = 'sow-vpulse 1s ease-in-out infinite';

            function cmpVer(a, b) {
                var pa = a.split('.').map(Number);
                var pb = b.split('.').map(Number);
                for (var i = 0; i < Math.max(pa.length, pb.length); i++) {
                    var na = pa[i] || 0, nb = pb[i] || 0;
                    if (na < nb) return -1;
                    if (na > nb) return 1;
                }
                return 0;
            }

            function setUpToDate() {
                dotEl.style.background = '#10b981';
                dotEl.style.boxShadow = '0 0 6px rgba(16,185,129,0.5)';
                dotEl.style.animation = 'none';
                badge.style.borderColor = 'rgba(16,185,129,0.25)';
                badge.style.background = 'rgba(16,185,129,0.06)';
                textEl.textContent = 'v' + CURRENT_VERSION;
                textEl.style.color = '#10b981';
            }

            function setError() {
                dotEl.style.animation = 'none';
                dotEl.style.background = '#55556e';
                dotEl.style.boxShadow = 'none';
                textEl.textContent = 'v' + CURRENT_VERSION;
                textEl.style.color = '#55556e';
            }

            function setUpdateAvailable(remote) {
                dotEl.style.background = '#f59e0b';
                dotEl.style.boxShadow = '0 0 8px rgba(245,158,11,0.6)';
                dotEl.style.animation = 'sow-vpulse 1.2s ease-in-out infinite';
                badge.style.borderColor = 'rgba(245,158,11,0.35)';
                badge.style.background = 'rgba(245,158,11,0.08)';
                badge.style.cursor = 'pointer';
                textEl.textContent = 'v' + remote + ' available';
                textEl.style.color = '#f59e0b';
                badge.title = 'Click to update to v' + remote;

                var updateHandler = function(e) {
                    e.stopPropagation();
                    badge.removeEventListener('click', updateHandler);

                    dotEl.style.animation = 'sow-vpulse 0.4s ease-in-out infinite';
                    dotEl.style.background = '#6C6FFF';
                    dotEl.style.boxShadow = '0 0 8px rgba(108,111,255,0.6)';
                    textEl.textContent = 'updating...';
                    textEl.style.color = '#6C6FFF';
                    badge.style.borderColor = 'rgba(108,111,255,0.35)';
                    badge.style.background = 'rgba(108,111,255,0.08)';
                    badge.style.cursor = 'default';
                    badge.title = '';

                    // Clean up all active tools before hot-swap
                    if (window._sowToolkit) {
                        Object.keys(window._sowToolkit).forEach(function(k) {
                            try { if (typeof window._sowToolkit[k] === 'function') window._sowToolkit[k](); } catch(ex) {}
                        });
                        window._sowToolkit = {};
                    }
                    var oldMenu = document.getElementById('sow-toolkit-menu');
                    if (oldMenu) oldMenu.remove();
                    var ps = document.getElementById('sow-tk-vpulse');
                    if (ps) ps.remove();

                    // Load new version via script tag
                    var us = document.createElement('script');
                    us.src = CDN_BASE + 'sow-toolkit.js?' + Date.now();
                    us.onload = function() { try { us.remove(); } catch(x) {} };
                    us.onerror = function() {
                        try { us.remove(); } catch(x) {}
                        // Reload the old version so user isn't left with nothing
                        var rs = document.createElement('script');
                        rs.src = CDN_BASE + 'sow-toolkit.js';
                        rs.onload = function() { try { rs.remove(); } catch(x) {} };
                        rs.onerror = function() { try { rs.remove(); } catch(x) {} };
                        document.head.appendChild(rs);
                    };
                    document.head.appendChild(us);
                };
                badge.addEventListener('click', updateHandler);
            }

            // Load version.js via script tag (sets window.__SOW_TK_LATEST)
            try {
                var vs = document.createElement('script');
                vs.src = CDN_BASE + 'version.js?' + Date.now();
                vs.onload = function() {
                    try { vs.remove(); } catch(x) {}
                    var remote = window.__SOW_TK_LATEST || '';
                    try { delete window.__SOW_TK_LATEST; } catch(x) {}
                    if (!remote) { setUpToDate(); return; }
                    if (cmpVer(CURRENT_VERSION, remote) < 0) {
                        setUpdateAvailable(remote);
                    } else {
                        setUpToDate();
                    }
                };
                vs.onerror = function() {
                    try { vs.remove(); } catch(x) {}
                    setError();
                };
                document.head.appendChild(vs);
            } catch(e) { setError(); }
        })();
})();
