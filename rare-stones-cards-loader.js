(function () {
  console.log("cards-loader+filter start");

  // ================================
  //  HTMLカードを読み込んでからフィルタ初期化
  // ================================
  function loadCardsAndInit() {
    console.log("onReady called");

    var grid = document.getElementById("og-grid");
    if (!grid) {
      console.log("#og-grid が見つかりません");
      return;
    }

    var src = grid.getAttribute("data-cards-src");
    console.log("data-cards-src =", src);

    // data-cards-src が無い場合 → そのまま初期化
    if (!src) {
      initFilter(grid);
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", src, true);

    xhr.onload = function () {
      console.log("XHR onload status =", xhr.status);
      if (xhr.status >= 200 && xhr.status < 300) {
        grid.innerHTML = xhr.responseText;
        console.log(
          "カードHTMLを挿入しました length =",
          xhr.responseText.length
        );
        initFilter(grid); // ★ 読み込み後にフィルタをセット
      } else {
        console.log("カード読み込み失敗 status =", xhr.status);
      }
    };

    xhr.onerror = function () {
      console.log("XHR error で読み込み失敗");
    };

    xhr.send();
  }

  // ================================
  //  フィルタ・タブ・レア度チップの処理
  // ================================
  function initFilter(grid) {
    console.log("initFilter start");

    var root = document.querySelector(".og") || document;

    var cards = Array.prototype.slice.call(grid.querySelectorAll(".card"));
    if (!cards.length) {
      console.log("card が見つかりません");
      return;
    }

    // --- レア度順にソート（★5 → ★2、同じなら名前順） ---
    cards.sort(function (a, b) {
      var ra = Number(a.getAttribute("data-rare") || 0);
      var rb = Number(b.getAttribute("data-rare") || 0);
      if (ra !== rb) return rb - ra;

      var ha = a.querySelector("h3");
      var hb = b.querySelector("h3");
      var ta = ha ? ha.textContent.trim() : "";
      var tb = hb ? hb.textContent.trim() : "";
      return ta.localeCompare(tb, "ja");
    });
    cards.forEach(function (c) {
      grid.appendChild(c);
    });

    // 状態
    var currentTab = "all"; // all / rare / inquartz / meteor / ...
    var currentRare = null; // null = すべて, 2〜5 = 指定レア度

    var tabButtons = root.querySelectorAll(".tab-btn");
    var rareChips = root.querySelectorAll("#chips-rare .chip");
    var explainBlocks = root.querySelectorAll(".og-explain .explain-block");
    var rareSelector = document.getElementById("sel-rare");

    function updateExplain() {
      Array.prototype.forEach.call(explainBlocks, function (b) {
        var tab = b.getAttribute("data-tab");
        b.style.display = tab === currentTab ? "" : "none";
      });
    }

    function updateRareSelector() {
      if (!rareSelector) return;
      rareSelector.style.display = currentTab === "rare" ? "" : "none";
    }

    function applyFilter() {
      cards.forEach(function (card) {
        var vis = true;

        // --- タブによるグループフィルタ ---
        if (currentTab !== "all" && currentTab !== "rare") {
          var gAttr = card.getAttribute("data-group") || "";
          var groups = gAttr.split(/\s+/);
          vis = groups.indexOf(currentTab) !== -1;
        }

        // --- 「レア度」タブのときだけ★フィルタ ---
        if (vis && currentTab === "rare" && currentRare !== null) {
          var r = Number(card.getAttribute("data-rare") || 0);
          vis = r === currentRare;
        }

        card.style.display = vis ? "" : "none";
      });
    }

    // --- タブボタン（全て / レア度順 / InQuartz / …）---
    Array.prototype.forEach.call(tabButtons, function (btn) {
      btn.addEventListener("click", function () {
        var tab = btn.getAttribute("data-tab") || btn.dataset.tab;
        if (!tab || tab === currentTab) return;

        currentTab = tab;

        Array.prototype.forEach.call(tabButtons, function (b) {
          var t = b.getAttribute("data-tab") || b.dataset.tab;
          var active = t === currentTab;
          b.setAttribute("aria-selected", active ? "true" : "false");
          b.classList.toggle("is-active", active);
        });

        // レアタブ以外に移動したら★フィルタをリセット
        if (currentTab !== "rare") {
          currentRare = null;
          Array.prototype.forEach.call(rareChips, function (c) {
            var f = c.getAttribute("data-filter") || "*";
            c.classList.toggle("is-active", f === "*");
          });
        }

        updateExplain();
        updateRareSelector();
        applyFilter();
      });
    });

    // --- レア度チップ（★★★★★ / ★★★★ …） ---
    Array.prototype.forEach.call(rareChips, function (chip) {
      chip.addEventListener("click", function () {
        var filter = chip.getAttribute("data-filter") || "*";

        Array.prototype.forEach.call(rareChips, function (c) {
          c.classList.toggle("is-active", c === chip);
        });

        if (filter === "*") {
          currentRare = null;
        } else {
          // 例: [data-rare="5"] → 5 を取り出す
          var m = filter.match(/"(\d)"/);
          currentRare = m ? Number(m[1]) : null;
        }

        // レア度チップを触ったらタブも「レア度」に合わせる
        currentTab = "rare";
        Array.prototype.forEach.call(tabButtons, function (b) {
          var t = b.getAttribute("data-tab") || b.dataset.tab;
          var active = t === "rare";
          b.setAttribute("aria-selected", active ? "true" : "false");
          b.classList.toggle("is-active", active);
        });

        updateExplain();
        updateRareSelector();
        applyFilter();
      });
    });

    // 初期状態
    updateExplain();
    updateRareSelector();
    applyFilter();

    console.log("initFilter done");
  }

  // ================================
  //  DOM 準備できたら開始
  // ================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadCardsAndInit);
  } else {
    loadCardsAndInit();
  }
})();
