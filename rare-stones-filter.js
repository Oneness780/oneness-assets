(function () {
  // -----------------------------
  // 1) カード HTML を外部から読み込む
  // -----------------------------
  async function loadCards() {
    const grid = document.getElementById("og-grid");
    if (!grid) return;

    try {
      const res = await fetch(
        "https://cdn.jsdelivr.net/gh/Oneness780/oneness-assets@main/rare-stones-cards.html",
        { cache: "no-cache" }
      );
      if (!res.ok) throw new Error(res.statusText);
      const html = await res.text();
      grid.innerHTML = html;
    } catch (e) {
      console.error("レアストーンカードの読み込みに失敗しました", e);
    }
  }

  // -----------------------------
  // 2) フィルタ＆タブ処理を初期化
  // -----------------------------
  function initFilter() {
    const root = document.querySelector(".og");
    if (!root) return;

    const grid = root.querySelector("#og-grid");
    if (!grid) return;

    const tabs = root.querySelectorAll('.tab-btn[role="tab"]');
    const rareSelector = root.querySelector("#sel-rare");
    const explainBlocks = root.querySelectorAll(".og-explain .explain-block");

    // タブごとの説明文切り替え
    function setActiveExplain(tab) {
      if (!explainBlocks.length) return;
      explainBlocks.forEach((block) => {
        block.classList.toggle("is-active", block.dataset.tab === tab);
      });
    }

    // タブ → フィルタ条件
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

    // カードがフィルタにマッチするか判定
    function matchCard(card, filter) {
      if (!filter || filter === "*") return true;

      // [data-xxx="yyy"] 形式
      const m = filter.match(/^\[data-([^=]+)=\"?([^\]"]+)\"?\]$/);
      if (m) {
        const key = m[1];
        const val = m[2];
        const raw = (card.dataset && card.dataset[key]) || "";

        // カンマ・スペース区切り対応
        const tokens = raw
          .split(/[,\s、]+/)
          .map((t) => t.trim())
          .filter(Boolean);

        return tokens.length ? tokens.includes(val) : raw === val;
      }

      return false;
    }

    // よみの正規化（並び替え用）
    function normalizeYomi(str) {
      if (!str) return "";
      let s = String(str).toLowerCase();
      s = s.replace(/ー/g, "");
      return s;
    }

    // レア度タブ用：表示カードの並べ替え
    function sortVisibleCards(visible, tab, filter) {
      if (tab !== "rare") return;

      visible.sort((a, b) => {
        const ra = parseInt(a.dataset.rare || "0", 10);
        const rb = parseInt(b.dataset.rare || "0", 10);

        // 「すべて」は ★の高い順 → よみ順
        if (filter === "*" || !filter) {
          if (ra !== rb) return rb - ra;
        }

        const ya = normalizeYomi(a.dataset.yomi || "");
        const yb = normalizeYomi(b.dataset.yomi || "");
        return ya.localeCompare(yb, "ja");
      });

      visible.forEach((node) => grid.appendChild(node));
    }

    // カード表示/非表示＋ふわっとアニメ
    function showCards(filter, tab) {
      const cards = Array.from(grid.querySelectorAll(".card"));
      const visible = [];

      cards.forEach((card) => {
        if (matchCard(card, filter)) {
          card.style.display = "";
          visible.push(card);
        } else {
          card.style.display = "none";
        }
      });

      // rare タブでは並び替え
      sortVisibleCards(visible, tab, filter);

      // フェードリセット
      visible.forEach((card) => {
        card.style.transitionDelay = "";
        card.style.opacity = "0";
        card.style.transform = "translateY(8px)";
      });

      // ふわっと表示
      requestAnimationFrame(() => {
        visible.forEach((card, i) => {
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
        .forEach((c) => c.classList.remove("is-active"));
      const btn = rareSelector.querySelector(
        `.chip[data-filter="${filter}"]`
      );
      if (btn) btn.classList.add("is-active");
    }

    // タブのアクティブ状態
    function activateTab(tab) {
      tabs.forEach((btn) => {
        btn.setAttribute(
          "aria-selected",
          String(btn.dataset.tab === tab)
        );
      });

      // レア度タブのときだけセレクタ表示
      if (rareSelector) {
        rareSelector.classList.toggle("is-active", tab === "rare");
      }
    }

    // URL ハッシュ → 状態
    function parseHash() {
      const h = location.hash.replace(/^#/, "");
      const p = new URLSearchParams(h);
      return {
        tab: p.get("tab") || "all",
        filter: p.get("filter") || "*",
      };
    }

    // 状態 → URL ハッシュ
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

    // rare タブで入ってきた場合も、必ず「すべて」から
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
      rareSelector.addEventListener("click", (e) => {
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
    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
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
    window.addEventListener("hashchange", () => {
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

  // -----------------------------
  // 3) DOM 完了後に 実行
  // -----------------------------
  window.addEventListener("DOMContentLoaded", async () => {
    await loadCards();
    initFilter();
  });
})();
