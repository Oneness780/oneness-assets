(function () {
  // ← まずここが出るかどうかを見る
  console.log("cards-loader start");

  function onReady() {
    console.log("onReady called");

    var grid = document.getElementById("og-grid");
    if (!grid) {
      console.log("grid(#og-grid) が見つかりません");
      return;
    }

    var src = grid.getAttribute("data-cards-src");
    console.log("data-cards-src =", src);
    if (!src) {
      console.log("data-cards-src が空です");
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
      } else {
        console.log("カード読み込み失敗 status =", xhr.status);
      }
    };

    xhr.onerror = function () {
      console.log("XHR error で読み込み失敗");
    };

    xhr.send();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
})();
