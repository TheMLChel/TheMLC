// ==UserScript==
// @name         MV Nav+
// @namespace    https://themlchel.github.io/TheMLC/
// @version      1.0
// @description  Better MultVerse Navigation Bar.
// @match        http://www.multverse.ru/*
// @match        https://www.multverse.ru/*
// @match        http://multverse.ru/*
// @match        https://multverse.ru/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const OLD_RE = /nav3\.swf(\?.*)?$/i;
    const NEW_URL = 'https://themlchel.github.io/TheMLC/other/navplus.swf';
    const BASE = location.origin + '/';

    // Принудительные настройки Ruffle (перекрывают конфиг сайта)
    const FORCED = {
        base: BASE,
        allowScriptAccess: true,
        allowNetworking: 'all',
        openUrlMode: 'allow',
        warnOnUnsupportedContent: false,
        autoplay: 'on',
        unmuteOverlay: 'hidden'
    };

    // 1. Перехватываем присвоение window.RufflePlayer.config
    let cfg = Object.assign({}, FORCED);
    const RP = window.RufflePlayer = window.RufflePlayer || {};
    try {
        Object.defineProperty(RP, 'config', {
            configurable: true,
            enumerable: true,
            get() { return cfg; },
            set(v) { cfg = Object.assign({}, v || {}, FORCED); }
        });
    } catch (e) {
        RP.config = cfg;
    }

    // 2. Подмена embed/object до запуска Ruffle
    function patchEmbed(el) {
        if (el.dataset && el.dataset.navplus) return;
        const src = el.getAttribute('src') || el.getAttribute('data');
        if (!src || !OLD_RE.test(src)) return;

        el.dataset.navplus = '1';
        const attr = el.hasAttribute('src') ? 'src' : 'data';
        el.setAttribute(attr, NEW_URL);
        el.setAttribute('base', BASE);
        el.setAttribute('allowscriptaccess', 'always');
        el.setAttribute('allownetworking', 'all');
    }

    // 3. Если Ruffle уже заменил embed на свой плеер — перезагружаем его
    function patchRufflePlayer(el) {
        if (el.dataset.navplus) return;
        const src = el.getAttribute('src') || el.getAttribute('data') || '';
        if (!OLD_RE.test(src)) return;
        el.dataset.navplus = '1';
        el.setAttribute('base', BASE);
        el.setAttribute('allowscriptaccess', 'always');
        el.setAttribute('allownetworking', 'all');
        const reload = () => {
            if (typeof el.load === 'function') {
                el.load(Object.assign({ url: NEW_URL }, FORCED));
            } else {
                setTimeout(reload, 100);
            }
        };
        reload();
    }

    function scan(root) {
        root.querySelectorAll('embed, object').forEach(patchEmbed);
        root.querySelectorAll('ruffle-embed, ruffle-object, ruffle-player').forEach(patchRufflePlayer);
    }

    new MutationObserver(muts => {
        for (const m of muts) {
            for (const n of m.addedNodes) {
                if (n.nodeType !== 1) continue;
                const tag = n.tagName.toLowerCase();
                if (tag === 'embed' || tag === 'object') patchEmbed(n);
                else if (tag.startsWith('ruffle-')) patchRufflePlayer(n);
                else if (n.querySelectorAll) scan(n);
            }
        }
    }).observe(document, { childList: true, subtree: true });

    document.addEventListener('DOMContentLoaded', () => scan(document));
    window.addEventListener('load', () => scan(document));
})();