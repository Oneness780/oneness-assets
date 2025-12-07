(function () {
  'use strict';

  const root = document.querySelector('.og');
  if (!root) return;
  const grid = root.querySelector('#og-grid');
  if (!grid) return;

  const tabs = root.querySelectorAll('.tab-btn[role="tab"]');
  const rareSelector = root.querySelector('#sel-rare');
  const explainBlocks = root.querySelectorAll('.og-explain .explain-block');

  // タブ → フィルタ
  const TAB_FILTER = {
    all: '*',
    inquartz: '[data-group="inquartz"]',
    meteor: '[data-group="meteor"]',
    rare: '*',
    rarecolor: '[data-group="rarecolor"]',
    hq: '[data-flag="hq"]',
    star: '[data-flag="star"]',
    uv: '[data-flag="uv"]'
  };

  // 説明ブロックの切り替え
  function setActiveExplain(tab) {
    if (!explainBlocks.length) return;
    explainBlocks.forEach(function (block) {
      block.classList.toggle('is-active', block.dataset.tab === tab);
    });
  }

  // [data-xxx="yyy"] 判定 & data-xxx に複数値対応
  function matchCard(card, filter) {
    if (!filter || filter === '*') return true;

    // .class 指定（今回は使っていないが一応）
    if (filter.charAt(0) === '.') {
      return card.classList.contains(filter.slice(1));
    }

    // [data-xxx="yyy"] 形式
    const m = filter.match(/^\[data-([^=]+)="?([^\]"]+)"?\]$/);
    if (m) {
      const key = m[1];
      const val = m[2];
      const raw = (card.dataset && card.dataset[key]) || '';

      const tokens = raw
        .split(/[,\s、]+/)
        .map(function (t) { return t.trim(); })
        .filter(Boolean);

      return tokens.length ? tokens.indexOf(val) !== -1 : raw === val;
    }
    return false;
  }

  // 並び替え用よみ正規化
  function normalizeYomi(str) {
    if (!str) return '';
    var s = String(str).toLowerCase();
    s = s.replace(/ー/g, '');
    return s;
  }

  // レアタブ時の並べ替え（★ → よみ）
  function sortVisibleCards(visible, tab, filter) {
    if (tab !== 'rare') return;

    visible.sort(function (a, b) {
      var ra = parseInt(a.dataset.rare || '0', 10);
      var rb = parseInt(b.dataset.rare || '0', 10);

      // 「すべて（★5→★2順）」のときは星優先
      if (!filter || filter === '*') {
        if (ra !== rb) return rb - ra;
      }

      var ya = normalizeYomi(a.dataset.yomi || '');
      var yb = normalizeYomi(b.dataset.yomi || '');
      return ya.localeCompare(yb, 'ja');
    });

    visible.forEach(function (node) {
      grid.appendChild(node);
    });
  }

  // カード表示・非表示 ＋ ふわっとアニメ
  function showCards(filter, tab) {
    const cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
    const visible = [];

    cards.forEach(function (card) {
      if (matchCard(card, filter)) {
        card.style.display = '';
        visible.push(card);
      } else {
        card.style.display = 'none';
      }
    });

    // レア度タブでは並べ替え
    sortVisibleCards(visible, tab, filter);

    // アニメ初期化
    visible.forEach(function (card) {
      card.style.transitionDelay = '';
      card.style.opacity = '0';
      card.style.transform = 'translateY(8px)';
    });

    requestAnimationFrame(function () {
      visible.forEach(function (card, i) {
        card.style.transitionDelay = (i * 40) + 'ms';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      });
    });
  }

  // レア度チップのON/OFF
  function setActiveRareChip(filter) {
    if (!rareSelector) return;
    rareSelector.querySelectorAll('.chip').forEach(function (c) {
      c.classList.remove('is-active');
    });
    const btn = rareSelector.querySelector('.chip[data-filter="' + filter + '"]');
    if (btn) btn.classList.add('is-active');
  }

  // タブのON/OFF
  function activateTab(tab) {
    tabs.forEach(function (btn) {
      btn.setAttribute('aria-selected', String(btn.dataset.tab === tab));
    });
    if (rareSelector) {
      rareSelector.classList.toggle('is-active', tab === 'rare');
    }
  }

  // ハッシュ → 状態
  function parseHash() {
    const h = location.hash.replace(/^#/, '');
    const params = new URLSearchParams(h.replace(/&/g, '&'));
    return {
      tab: params.get('tab') || 'all',
      filter: params.get('filter') || '*'
    };
  }

  // 状態 → ハッシュ
  function setHash(tab, filter, replace) {
    const hash = '#tab=' + encodeURIComponent(tab) +
                 '&filter=' + encodeURIComponent(filter);
    if (replace) {
      history.replaceState(null, '', hash);
    } else {
      location.hash = hash;
    }
  }

  // ===== 初期化 =====
  let state = parseHash();
  if (!TAB_FILTER[state.tab] && state.tab !== 'rare') {
    state.tab = 'all';
    state.filter = '*';
  }

  // rare タブに直接来た場合も、とにかく「すべて」から
  if (state.tab === 'rare') {
    state.filter = '*';
  }

  activateTab(state.tab);
  setActiveExplain(state.tab);

  let initialFilter = (state.tab === 'rare')
    ? '*'
    : (TAB_FILTER[state.tab] || '*');

  showCards(initialFilter, state.tab);
  if (state.tab === 'rare') {
    setActiveRareChip('*');
  }
  if (!location.hash) {
    setHash(state.tab, state.filter, true);
  }

  // レア度チップクリック
  if (rareSelector) {
    rareSelector.addEventListener('click', function (e) {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      if (state.tab !== 'rare') return;

      state.filter = chip.dataset.filter || '*';
      showCards(state.filter, state.tab);
      setActiveRareChip(state.filter);
      setHash(state.tab, state.filter, false);
    });
  }

  // タブクリック
  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const tab = btn.dataset.tab;
      state.tab = tab;

      if (tab === 'rare') {
        state.filter = '*';
      } else {
        state.filter = TAB_FILTER[tab] || '*';
      }

      activateTab(state.tab);
      setActiveExplain(state.tab);

      const filterToUse = (tab === 'rare')
        ? '*'
        : (TAB_FILTER[tab] || '*');

      showCards(filterToUse, state.tab);

      if (tab === 'rare') {
        setActiveRareChip('*');
      }
      setHash(state.tab, state.filter, false);
    });
  });

  // 戻る/進むボタン対応
  window.addEventListener('hashchange', function () {
    state = parseHash();
    if (!TAB_FILTER[state.tab] && state.tab !== 'rare') {
      state.tab = 'all';
      state.filter = '*';
    }

    if (state.tab === 'rare' && !state.filter) {
      state.filter = '*';
    }

    activateTab(state.tab);
    setActiveExplain(state.tab);

    const filterToUse = (state.tab === 'rare')
      ? (state.filter || '*')
      : (TAB_FILTER[state.tab] || '*');

    showCards(filterToUse, state.tab);
    if (state.tab === 'rare') {
      setActiveRareChip(state.filter || '*');
    }
  });

  console.log('rare-stones-filter.js initialized');

})();
