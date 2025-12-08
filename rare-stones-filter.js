(function () {
  console.log("rare-stones-filter.js initialized (v5)");

  // ================================
  //  エントリーポイント
  // ================================
  function start() {
    console.log("rare-stones-filter: start()");

    var root = document.querySelector(".og");
    if (!root) {
      console.log("rare-stones-filter: .og が見つかりません");
      return;
    }

    var grid = root.querySelector("#og-grid") || document.getElementById("og-grid");
    if (!grid) {
      console.log("rare-stones-filter: #og-grid が見つかりません");
      return;
    }

    var src = grid.getAttribute("data-cards-src") || "";
    console.log("rare-stones-filter: data-cards-src =", src);

    // 外部HTMLからカードを取得
    if (src) {
      fetch(src, { cache: "no-cache" })
        .then(function (res) {
          console.log("rare-stones-filter: fetch status =", res.status);
          if (!res.ok) {
            throw new Error("HTTP status " + res.status);
          }
          return res.text();
        })
        .then(function (html) {
          console.log(
            "rare-stones-filter: カードHTML取得成功 length =",
            html.length
          );

          // 外部HTMLをそのまま差し込む
          grid.innerHTML = html;

          // 差し込んだカードを元にフィルタ初期化
          initRareStoneFilter(root, grid);
        })
        .catch(function (err) {
          console.error("rare-stones-filter: カードHTML読み込みエラー", err);
          // 失敗したら、もし直書きカードがあればそれで初期化
          initRareStoneFilter(root, grid);
        });
    } else {
      console.log("rare-stones-filter: data-cards-src なし → 直書きカードで初期化");
      initRareStoneFilter(root, grid);
    }
  }

  // DOM 読み込み状態に応じて start() を呼ぶ
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    // すでに DOM が出来上がっている場合はこちら
    start();
  }

  // ================================
  //  フィルタ本体
  // ================================
  function initRareStoneFilter(root, grid) {
    console.log("rare-stones-filter: initRareStoneFilter start");

    var cards = Array.prototype.slice.call(grid.querySelectorAll(".card"));
    if (!cards.length) {
      console.log("rare-stones-filter: カードが 0 件です");
      return;
    }

    var tabs = root.querySelectorAll('.tab-btn[role="tab"]');
    var rareSelector = root.querySelector("#sel-rare");
    var explainBlocks = root.querySelectorAll(".og-explain .explain-block");

    // タブごとのフィルタ種別
    var TAB_FILTER = {
      all:      { type: "all" },
      rare:     { type: "rare" }, // レア度チップで制御
      inquartz: { type: "group", value: "inquartz" },
      meteor:   { type: "group", value: "meteor" },
      rarecolor:{ type: "group", value: "rarecolor" },
      hq:       { type: "flag",  value: "hq" },
      star:     { type: "flag",  value: "star" },
      uv:       { type: "flag",  value: "uv" }
    };

    var activeTab = "all";
    var rareFilter = "*"; // rare タブ用（"*" or "5" "4" "3" "2"）

    // 説明文の表示切替
    function setActiveExplain(tab) {
      if (!explainBlocks.length) return;
      Array.prototype.forEach.call(explainBlocks, function (block) {
        var t = block.getAttribute("data-tab");
        block.classList.toggle("is-active", t === tab);
      });
    }

    // タブの aria-selected 切り替え
    function setActiveTabButton(tab) {
      Array.prototype.forEach.call(tabs, function (btn) {
        var isActive = btn.getAttribute("data-tab") === tab;
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
      });
    }

    // レア度チップの is-active 更新
    function setActiveRareChip(filter) {
      if (!rareSelector) return;
      var chips = rareSelector.querySelectorAll(".chip");
      Array.prototype.forEach.call(chips, function (chip) {
        var f = chip.getAttribute("data-filter") || "*";
        chip.classList.toggle("is-active", f === filter);
      });
    }

    // カードを表示するかどうか判定
    function shouldShowCard(card, tabConfig, rareFilterValue) {
      // rare タブ：レア度のみで判定
      if (tabConfig.type === "rare") {
        var r = card.getAttribute("data-rare") || "";
        if (rareFilterValue !== "*" && r !== rareFilterValue) return false;
        return true;
      }

      // other タブ（all / group / flag）
      if (tabConfig.type === "all") {
        return true;
      }

      if (tabConfig.type === "group") {
        var g = (card.getAttribute("data-group") || "").split(/\s+/);
        return g.indexOf(tabConfig.value) !== -1;
      }

      if (tabConfig.type === "flag") {
        var f = (card.getAttribute("data-flag") || "").split(/\s+/);
        return f.indexOf(tabConfig.value) !== -1;
      }

      return true;
    }

    // 実際にカードを表示・非表示
    function applyFilter() {
      var tabConfig = TAB_FILTER[activeTab] || TAB_FILTER.all;

      Array.prototype.forEach.call(cards, function (card) {
        var show = shouldShowCard(card, tabConfig, rareFilter);
        card.style.display = show ? "" : "none";
        card.classList.toggle("is-visible", show);
      });
    }

    // rare タブの時だけレア度セレクタを表示
    function updateRareSelectorVisibility() {
      if (!rareSelector) return;
      rareSelector.classList.toggle("is-active", activeTab === "rare");
    }

    // --- 初期状態 ---
    setActiveTabButton(activeTab);
    setActiveExplain(activeTab);
    updateRareSelectorVisibility();
    setActiveRareChip(rareFilter);
    applyFilter();

    // --- タブクリック ---
    Array.prototype.forEach.call(tabs, function (btn) {
      btn.addEventListener("click", function () {
        var tab = btn.getAttribute("data-tab");
        if (!tab || (!TAB_FILTER[tab] && tab !== "rare")) {
          tab = "all";
        }

        activeTab = tab;

        // rare タブに入ったときは、毎回「すべて（★5→★2順）」にリセット
        if (activeTab === "rare") {
          rareFilter = "*";
          setActiveRareChip(rareFilter);
        }

        setActiveTabButton(activeTab);
        setActiveExplain(activeTab);
        updateRareSelectorVisibility();
        applyFilter();
      });
    });

    // --- レア度チップクリック ---
    if (rareSelector) {
      rareSelector.addEventListener("click", function (e) {
        var chip = e.target.closest(".chip");
        if (!chip) return;
        if (activeTab !== "rare") return; // rare タブのときだけ反応

        var filter = chip.getAttribute("data-filter") || "*";
        rareFilter = filter;
        setActiveRareChip(rareFilter);
        applyFilter();
      });
    }

    console.log("rare-stones-filter: initRareStoneFilter done");
  }
})();
