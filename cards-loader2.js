;(function () {
  console.log("rare-stones cards-loader v3 start");

  // ================================
  //  初期処理：カードHTMLを読み込んでからフィルタ初期化
  // ================================
  function init() {
    var grid = document.getElementById("og-grid");
    if (!grid) {
      console.log("#og-grid not found");
      return;
    }

    var src = grid.getAttribute("data-cards-src");
    console.log("data-cards-src =", src);

    // data-cards-src がない場合 → そのままフィルタだけ
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
        console.log("カードHTMLを挿入しました length =", xhr.responseText.length);
        initFilter(grid);
      } else {
        console.log("カード読み込み失敗 status =", xhr.status);
      }
    };

    xhr.onerror = function () {
      console.log("XHR error");
    };

    xhr.send();
  }

  // ================================
  //  フィルタ処理（タブ＋レア度チップ）
  // ================================
  function initFilter(grid) {
    console.log("initFilter start");

    var root = document.querySelector(".og") || document;
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".card"));
    if (!cards.length) {
      console.log("カードがありません");
      return;
    }

    // ★5 → ★2、同じ★なら名前順で並び替え
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

    var tabButtons = root.querySelectorAll(".tab-btn");
    var rareChips = root.querySelectorAll("#chips-rare .chip");
    var explainBlocks = root.querySelectorAll(".og-explain .explain-block");
    var rareSelector = document.getElementById("sel-rare");

    var currentTab = "all";   // all / rare / inquartz / meteor / ...
    var currentRare = null;   // null = すべて, 2〜5 = 特定レア度

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
        var show = true;

        // タブ（インクォーツ系・隕石系など）
        if (currentTab !== "all" && currentTab !== "rare") {
          var gAttr = card.getAttribute("data-group") || "";
          var groups = gAttr.split(/\s+/);
          show = groups.indexOf(currentTab) !== -1;
        }

        // 「レア度順」タブのときだけ★フィルタ
        if (show && currentTab === "rare" && currentRare !== null) {
          var r = Number(card.getAttribute("data-rare") || 0);
          show = r === currentRare;
        }

        card.style.display = show ? "" : "none";
      });
    }

    // タブボタン（全て／レア度順／インクォーツ系…）
    Array.prototype.forEach.call(tabButtons, function (btn) {
      btn.addEventListener("click", function () {
        var tab = btn.getAttribute("data-tab") || btn.dataset.tab;
        if (!tab || tab === currentTab) return;

        currentTab = tab;

        Array.prototype.forEach.call(tabButtons, function (b) {
          var t = b.getAttribute("data-tab") || b.dataset.tab;
          var active = t === currentTab;
          b.setAttribute("aria-selected", active ? "true" : "false");
          if (active) b.classList.add("is-active");
          else b.classList.remove("is-active");
        });

        // 「レア度順」以外に移動したら★フィルタ解除
        if (currentTab !== "rare") {
          currentRare = null;
          Array.prototype.forEach.call(rareChips, function (c) {
            var f = c.getAttribute("data-filter") || "*";
            if (f === "*") c.classList.add("is-active");
            else c.classList.remove("is-active");
          });
        }

        updateExplain();
        updateRareSelector();
        applyFilter();
      });
    });

    // レア度チップ（★★★★★～★★）
    Array.prototype.forEach.call(rareChips, function (chip) {
      chip.addEventListener("click", function () {
        var filter = chip.getAttribute("data-filter") || "*";

        Array.prototype.forEach.call(rareChips, function (c) {
          if (c === chip) c.classList.add("is-active");
          else c.classList.remove("is-active");
        });

        if (filter === "*") {
          currentRare = null;
        } else {
          var m = filter.match(/"(\d)"/);
          currentRare = m ? Number(m[1]) : null;
        }

        // チップを押したらタブも「レア度順」に
        currentTab = "rare";
        Array.prototype.forEach.call(tabButtons, function (b) {
          var t = b.getAttribute("data-tab") || b.dataset.tab;
          var active = t === "rare";
          b.setAttribute("aria-selected", active ? "true" : "false");
          if (active) b.classList.add("is-active");
          else b.classList.remove("is-active");
        });

        updateExplain();
        updateRareSelector();
        applyFilter();
      });
    });

    // 初期表示
    updateExplain();
    updateRareSelector();
    applyFilter();

    console.log("initFilter done");
  }

  // ================================
  //  DOM 準備完了後に init 実行
  // ================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
