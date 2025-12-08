(function () {
  'use strict';

  // ==================================
  //  カード読み込み → フィルタ初期化
  // ==================================

  // タブに応じて「説明ブロック」を切り替え
  function setActiveExplain(root, tab) {
    const blocks = root.querySelectorAll('.og-explain .explain-block');
    blocks.forEach((b) => {
      const t = b.getAttribute('data-tab');
      b.style.display = t === tab ? '' : 'none';
    });
  }

  function initRareStoneFilter(root, grid) {
    const tabButtons = Array.from(root.querySelectorAll('.tab-btn'));
    const chipsRare = Array.from(
      root.querySelectorAll('#chips-rare .chip')
    );
    const rareSelector = root.querySelector('#sel-rare');

    let currentTab = 'all';
    let currentRareFilter = '*';

    const cards = Array.from(grid.querySelectorAll('.card'));
    if (cards.length === 0) {
      console.warn('[rare-stones] カードが見つかりませんでした');
      return;
    }

    // 元の並び順を保持
    cards.forEach((card, idx) => {
      card.dataset._index = String(idx);
    });

    function applyFilter() {
      // レア度タブのときだけソート（★の大きい順）
      if (currentTab === 'rare') {
        const sorted = [...cards].sort((a, b) => {
          const ra = parseInt(a.dataset.rare || '0', 10);
          const rb = parseInt(b.dataset.rare || '0', 10);
          if (ra !== rb) return rb - ra; // ★多い順
          const ia = parseInt(a.dataset._index || '0', 10);
          const ib = parseInt(b.dataset._index || '0', 10);
          return ia - ib; // 元の並びを維持
        });
        sorted.forEach((card) => grid.appendChild(card));
      } else {
        // それ以外のタブでは元の順番
        const original = [...cards].sort(
          (a, b) =>
            parseInt(a.dataset._index || '0', 10) -
            parseInt(b.dataset._index || '0', 10)
        );
        original.forEach((card) => grid.appendChild(card));
      }

      // レア度のフィルタ値（[data-rare="5"] など）から数字だけ取り出し
      let rareTarget = null;
      if (currentTab === 'rare' && currentRareFilter !== '*') {
        const m = currentRareFilter.match(/"(\d)"/);
        rareTarget = m ? m[1] : null;
      }

      cards.forEach((card) => {
        const groups = (card.dataset.group || '')
          .split(/\s+/)
          .filter(Boolean);
        const rare = card.dataset.rare || '';

        let visible = true;

        // タブごとの絞り込み
        if (currentTab !== 'all' && currentTab !== 'rare') {
          visible = groups.includes(currentTab);
        }

        // レア度タブのときは★フィルタも適用
        if (visible && currentTab === 'rare' && rareTarget) {
          visible = rare === rareTarget;
        }

        card.style.display = visible ? '' : 'none';
      });

      // 説明テキストの切り替え
      setActiveExplain(root, currentTab);
    }

    // タブボタン
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.dataset.tab;
        if (!tab || tab === currentTab) return;

        currentTab = tab;

        tabButtons.forEach((b) =>
          b.setAttribute(
            'aria-selected',
            b === btn ? 'true' : 'false'
          )
        );

        if (rareSelector) {
          rareSelector.style.display =
            tab === 'rare' ? '' : 'none';
        }

        // レア度タブに入ったときは★フィルタをリセット
        if (tab === 'rare') {
          currentRareFilter = '*';
          chipsRare.forEach((chip) =>
            chip.classList.toggle(
              'is-active',
              chip.dataset.filter === '*'
            )
          );
        }

        applyFilter();
      });
    });

    // レア度チップ
    chipsRare.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const f = chip.dataset.filter || '*';
        currentRareFilter = f;
        chipsRare.forEach((c) =>
          c.classList.toggle('is-active', c === chip)
        );
        applyFilter();
      });
    });

    // 初期状態：タブ「全て」、説明も all を表示
    if (rareSelector) {
      rareSelector.style.display = 'none';
    }
    setActiveExplain(root, 'all');
    applyFilter();

    console.log(
      `[rare-stones] フィルタ初期化完了（カード数: ${cards.length}）`
    );
  }

function loadCardsAndInit() {
  // ルート（.og）とグリッド（#og-grid）を取得
  const root = document.querySelector(".og");
  if (!root) return;

  const grid = root.querySelector("#og-grid") || document.getElementById("og-grid");
  if (!grid) return;

  const src = grid.getAttribute("data-cards-src");

  // data-cards-src が無い場合 → そのままフィルタ初期化（従来通り）
  if (!src) {
    console.log("rare-stones-filter: data-cards-src なし → 直書きカードを使用");
    initRareStoneFilter(root, grid);
    return;
  }

  // 外部 HTML からカードを読み込む
  console.log("rare-stones-filter: カードHTMLを取得:", src);

  fetch(src, { cache: "no-cache" })
    .then((res) => {
      if (!res.ok) {
        throw new Error("HTTP status " + res.status);
      }
      return res.text();
    })
    .then((html) => {
      console.log("rare-stones-filter: カードHTML取得成功 / length=", html.length);

      // ★ 余計なことはせず、そのまま差し込む
      grid.innerHTML = html;

      // 差し込んだカードを元にフィルタ初期化
      initRareStoneFilter(root, grid);
    })
    .catch((err) => {
      console.error("rare-stones-filter: カードHTML読み込みエラー", err);

      // 失敗しても、もしページ内に直書きのカードがあればそれで動かす
      initRareStoneFilter(root, grid);
    });
}


    try {
      console.log(
        '[rare-stones] カードHTMLを取得:',
        src
      );
      const res = await fetch(src, { cache: 'no-cache' });
      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status} ${res.statusText}`
        );
      }
      const html = await res.text();
      const doc = new DOMParser().parseFromString(
        html,
        'text/html'
      );
      const cards = doc.querySelectorAll('.card');

      grid.innerHTML = '';
      cards.forEach((card) => grid.appendChild(card));

      console.log(
        `[rare-stones] カード読み込み完了: ${cards.length}件`
      );
      initRareStoneFilter(root, grid);
    } catch (e) {
      console.error(
        '[rare-stones] カードHTMLの読み込みに失敗しました',
        e
      );
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCardsAndInit);
  } else {
    loadCardsAndInit();
  }
})();
