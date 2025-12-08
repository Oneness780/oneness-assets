(function () {
  // ================================
  //  カードを読み込んでからフィルタ初期化
  // ================================
  function loadCardsAndInit() {
    const root = document.querySelector(".og");
    if (!root) return;

    const grid =
      root.getElementById?.("og-grid") || document.getElementById("og-grid");
    if (!grid) return;

    const src = grid.getAttribute("data-cards-src");

    // data-cards-src が無い場合 → そのまま初期化（従来通り）
    if (!src) {
      initRareStoneFilter(root, grid);
      return;
    }

    // 外部HTMLを読み込み
    fetch(src, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (html) {
        grid.innerHTML = html; // カードを差し込む
        initRareStoneFilter(root, grid); // そのあとフィルタ起動
      })
      .catch(function (err) {
        console.error("カードHTMLの読み込みに失敗しました:", err);
      });
  }

  // ================================
  //  レアストーン絞り込みロジック本体
  //  （もともとのスクリプトを関数化したもの）
  // ================================
  function initRareStoneFilter(root, grid) {
    if (!root || !grid) return;

    const tabs = root.querySelectorAll('.tab-btn[role="tab"]');
    const rareSelector = root.querySelector("#sel-rare");

    // 説明ブロック
    const explainBlocks = root.querySelectorAll(
      ".og-explain .explain-block"
    );

    function setActiveExplain(tab) {
      if (!explainBlocks.length) return;
      explainBlocks.forEach(function (block) {
        block.classList.toggle("is-active", block.dataset.tab === tab);
      });
    }

    // タブごとのフィルタ定義
    const TAB_FILTER = {
      all: "*",
      inquartz: '[data-group="inquartz"]',
      meteor: '[data-group="meteor"]',
      rare: "*",
      rarecolor: '[data-group="rarecolor"]',
      hq: '[data-flag="hq"]',
      star: '[data-flag="star"]',
      uv: '[data-flag="uv"]',
    };

    // --- カードがフィルタにマッチするか ---
    function matchCard(card, filter) {
      if (!filter || filter === "*") return true;

      // .class 指定（今回は使っていないが一応残す）
      if (filter[0] === ".") {
        return card.classList.contains(filter.slice(1));
      }

      // [data-xxx="yyy"] 形式
      const m = filter.match(/^\[data-([^=]+)="?([^\]"]+)"?\]$/);
      if (m) {
        const key = m[1];
        const val = m[2];
        const raw = (card.dataset && card.dataset[key]) || "";

        const tokens = raw
          .split(/[,\s、]+/)
          .map(function (t) {
            return t.trim();
          })
          .filter(Boolean);

        return tokens.length ? tokens.includes(val) : raw === val;
      }
      return false;
    }

    // 並び替え用：よみを正規化
    function normalizeYomi(str) {
      if (!str) return "";
      var s = String(str).toLowerCase();
      s = s.replace(/ー/g, "");
      return s;
    }

    // 表示カードの並べ替え（レアタブ専用）
    function sortVisibleCards(visible, tab, filter) {
      if (tab !== "rare") return;

      visible.sort(function (a, b) {
        const ra = parseInt(a.dataset.rare || "0", 10);
        const rb = parseInt(b.dataset.rare || "0", 10);

        // 「すべて」の時は ★の高い順 → よみ順
        if (filter === "*" || !filter) {
          if (ra !== rb) return rb - ra;
        }

        const ya = normalizeYomi(a.dataset.yomi || "");
        const yb = normalizeYomi(b.dataset.yomi || "");
        return ya.localeCompare(yb, "ja");
      });

      visible.forEach(function (node) {
        grid.appendChild(node);
      });
    }

    // カード表示/非表示＋ふわっとアニメ
    function showCards(filter, tab) {
      const cards = Array.prototype.slice.call(grid.querySelectorAll(".card"));
      const visible = [];

      cards.forEach(function (card) {
        if (matchCard(card, filter)) {
          card.style.display = "";
          visible.push(card);
        } else {
          card.style.display = "none";
        }
      });

      // レア度タブでは並べ替え
      sortVisibleCards(visible, tab, filter);

      // フェードリセット
      visible.forEach(function (card) {
        card.style.transitionDelay = "";
        card.style.opacity = "0";
        card.style.transform = "translateY(8px)";
      });

      // ふわっと表示
      requestAnimationFrame(function () {
        visible.forEach(function (card, i) {
          card.style.transitionDelay = i * 40 + "ms";
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
        });
      });
    }

    // レア度チップのアクティブ状態
    function setActiveRareChip(filter) {
      if (!rareSelector) return;
      rareSelector
        .querySelectorAll(".chip")
        .forEach(function (c) {
          c.classList.remove("is-active");
        });
      const btn = rareSelector.querySelector(
        '.chip[data-filter="' + filter + '"]'
      );
      if (btn) btn.classList.add("is-active");
    }

    // タブのアクティブ状態
    function activateTab(tab) {
      tabs.forEach(function (btn) {
        btn.setAttribute(
          "aria-selected",
          String(btn.dataset.tab === tab)
        );
      });

      if (rareSelector) {
        rareSelector.classList.toggle("is-active", tab === "rare");
      }
    }

    // URLハッシュ → 状態
    function parseHash() {
      const h = location.hash.replace(/^#/, "");
      const p = new URLSearchParams(h.replace(/&/g, "&"));
      return {
        tab: p.get("tab") || "all",
        filter: p.get("filter") || "*",
      };
    }

    // 状態 → URLハッシュ
    function setHash(tab, filter, replace) {
      const hash =
        "#tab=" +
        encodeURIComponent(tab) +
        "&filter=" +
        encodeURIComponent(filter);
      if (replace) {
        history.replaceState(null, "", hash);
      } else {
        location.hash = hash;
      }
    }

    // ===== 初期状態 =====
    let state = parseHash();
    if (!TAB_FILTER[state.tab] && state.tab !== "rare") {
      state.tab = "all";
      state.filter = "*";
    }

    // rareタブで入ってきた場合も、一旦「すべて」から
    if (state.tab === "rare") {
      state.filter = "*";
    }

    activateTab(state.tab);
    setActiveExplain(state.tab);

    let initialFilter = state.filter;
    if (state.tab !== "rare") {
      initialFilter = TAB_FILTER[state.tab] || "*";
    }

    showCards(initialFilter, state.tab);
    if (state.tab === "rare") setActiveRareChip(state.filter);
    if (!location.hash) setHash(state.tab, state.filter, true);

    // レア度チップクリック
    if (rareSelector) {
      rareSelector.addEventListener("click", function (e) {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        if (state.tab !== "rare") return;

        state.filter = chip.dataset.filter || "*";
        showCards(state.filter, state.tab);
        setActiveRareChip(state.filter);
        setHash(state.tab, state.filter, false);
      });
    }

    // タブクリック
    tabs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const tab = btn.dataset.tab;
        state.tab = tab;

        if (tab === "rare") {
          state.filter = "*";
        } else {
          state.filter = TAB_FILTER[tab] || "*";
        }

        activateTab(state.tab);
        setActiveExplain(state.tab);

        const filterToUse =
          tab === "rare" ? "*" : TAB_FILTER[tab] || "*";

        showCards(filterToUse, state.tab);

        if (tab === "rare") {
          setActiveRareChip("*");
        }
        setHash(state.tab, state.filter, false);
      });
    });

    // 戻る/進むボタン対応
    window.addEventListener("hashchange", function () {
      state = parseHash();
      if (!TAB_FILTER[state.tab] && state.tab !== "rare") {
        state.tab = "all";
        state.filter = "*";
      }

      activateTab(state.tab);
      setActiveExplain(state.tab);

      const filterToUse =
        state.tab === "rare"
          ? state.filter
          : TAB_FILTER[state.tab] || "*";

      showCards(filterToUse, state.tab);
      if (state.tab === "rare") {
        setActiveRareChip(state.filter);
      }
    });
  }

  // ================================
  //  DOM 準備できたら起動
  // ================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadCardsAndInit);
  } else {
    loadCardsAndInit();
  }
})();
