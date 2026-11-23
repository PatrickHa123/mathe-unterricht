/* Prozentrechnung Jg. 7 – interaktive Bausteine (ohne externe Bibliotheken).
   Alle Eingaben bleiben im Browser. Die Selbsteinschätzung wird nur lokal
   auf diesem Gerät gespeichert (localStorage), falls der Browser das erlaubt. */
(function () {
  "use strict";

  /* ---------- Hilfsfunktionen ---------- */
  function num(str) {
    if (str == null) return NaN;
    var s = String(str).trim().replace(/\s/g, "").replace(/[€%]|kg|km|m|t|ha|g/gi, "");
    // deutsche Schreibweise: 1.234,56 -> 1234.56
    if (s.indexOf(",") > -1) s = s.replace(/\./g, "").replace(",", ".");
    return parseFloat(s);
  }
  function fmt(x, d) {
    if (d == null) d = 2;
    var r = Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
    return r.toLocaleString("de-DE", { maximumFractionDigits: d });
  }
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* nicht verfügbar */ } }
  };
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ---------- Prüf-Felder: <span class="check" data-a="25" data-tol="0.01" data-label="..."></span> ---------- */
  function initChecks(root) {
    root.querySelectorAll(".check[data-a]").forEach(function (box) {
      if (box.dataset.ready) return;
      box.dataset.ready = "1";
      var inp = el("input", { type: "text", inputmode: "decimal", autocomplete: "off",
        "aria-label": box.dataset.label || "Ergebnis eingeben" });
      var btn = el("button", { type: "button", class: "sec" }, "Prüfen");
      var fb = el("span", { class: "fb", "aria-live": "polite" });
      box.append(inp);
      if (box.dataset.unit) box.append(el("span", { class: "unit" }, box.dataset.unit));
      box.append(btn, fb);
      function pruefen() {
        var answers = box.dataset.a.split("|").map(num);
        var tol = box.dataset.tol ? parseFloat(box.dataset.tol) : 0.011;
        var v = num(inp.value);
        if (isNaN(v)) { fb.textContent = "Bitte eine Zahl eingeben."; fb.className = "fb bad"; return false; }
        var cands = [v];
        // "1.040" kann auch Tausenderpunkt bedeuten
        var raw = inp.value.trim().replace(/\s|€|%/g, "");
        if (/^\d{1,3}(\.\d{3})+$/.test(raw)) cands.push(parseFloat(raw.replace(/\./g, "")));
        var ok = answers.some(function (a) { return cands.some(function (c) { return Math.abs(a - c) <= tol; }); });
        inp.className = ok ? "ok" : "bad";
        fb.className = "fb " + (ok ? "ok" : "bad");
        fb.textContent = ok ? "✓ richtig" : (box.dataset.tipp ? "✗ " + box.dataset.tipp : "✗ noch nicht – prüfe deine Rechnung");
        return ok;
      }
      box._pruefen = pruefen;
      btn.addEventListener("click", pruefen);
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); pruefen(); } });
    });
  }

  /* ---------- Prozentstreifen ---------- */
  function initStreifen(root) {
    root.querySelectorAll(".streifen-widget").forEach(function (w) {
      var G = parseFloat(w.dataset.g || 400), p = parseFloat(w.dataset.p || 25);
      var unit = w.dataset.unit || "", pmax = parseFloat(w.dataset.pmax || 150);
      var ctrl = el("div", { class: "streifen-ctrl" });
      var gIn = el("input", { type: "number", min: "1", step: "any", value: G, "aria-label": "Grundwert G" });
      var pIn = el("input", { type: "range", min: "0", max: String(pmax), step: "1", value: p, "aria-label": "Prozentsatz p" });
      var pOut = el("span", { class: "P" });
      var lg = el("label", null, '<span class="G">G =</span>'); lg.append(gIn); if (unit) lg.append(" " + unit);
      var lp = el("label", null, '<span class="P">p =</span>'); lp.append(pIn, pOut);
      ctrl.append(lg, lp);
      var bar = el("div", { class: "streifen", role: "img" });
      var fill = el("div", { class: "fill" });
      var mark = el("div", { style: "position:absolute;top:0;bottom:0;width:3px;background:#1b5e20" });
      var lbl = el("div", { class: "lbl" });
      bar.append(fill, mark, lbl);
      var skala = el("div", { class: "skala" });
      var out = el("div", { class: "streifen-out", "aria-live": "polite" });
      w.append(ctrl, bar, skala, out);
      function draw() {
        var g = parseFloat(gIn.value) || 0, pp = parseFloat(pIn.value) || 0;
        var top = Math.max(100, pp);
        fill.style.width = (pp / top * 100) + "%";
        mark.style.left = "calc(" + (100 / top * 100) + "% - 2px)";
        mark.style.display = top > 100 ? "block" : "none";
        pOut.textContent = pp + " %";
        var W = g * pp / 100;
        lbl.innerHTML = '<span class="W">W = ' + fmt(W) + " " + unit + "</span>";
        bar.setAttribute("aria-label", "Prozentstreifen: " + pp + " Prozent von " + fmt(g) + " " + unit + " sind " + fmt(W) + " " + unit);
        var steps = [0, 25, 50, 75, 100]; if (top > 100) steps = [0, 50, 100, Math.round(top)];
        skala.innerHTML = steps.map(function (s) { return "<span>" + s + " %</span>"; }).join("");
        out.innerHTML = '<span class="W">W</span> = <span class="P">p</span> · <span class="G">G</span> = ' +
          fmt(pp / 100, 4) + " · " + fmt(g) + " = <b>" + fmt(W) + " " + unit + "</b>" +
          (pp > 100 ? " &nbsp;(mehr als der Grundwert!)" : "");
      }
      gIn.addEventListener("input", draw); pIn.addEventListener("input", draw);
      draw();
    });
  }

  /* ---------- Schritt-für-Schritt ---------- */
  function initSchritte(root) {
    root.querySelectorAll(".schritte").forEach(function (s) {
      var items = Array.prototype.slice.call(s.querySelectorAll(".schritt"));
      if (!items.length) return;
      items.forEach(function (it, i) { if (i > 0) it.hidden = true; });
      var shown = 1;
      var btn = el("button", { type: "button", class: "sec" }, "Nächster Schritt ▶");
      var reset = el("button", { type: "button", class: "sec", style: "margin-left:.4rem" }, "↺ Von vorn");
      btn.addEventListener("click", function () {
        if (shown < items.length) { items[shown].hidden = false; shown++; }
        btn.disabled = shown >= items.length;
      });
      reset.addEventListener("click", function () {
        items.forEach(function (it, i) { it.hidden = i > 0; }); shown = 1; btn.disabled = false;
      });
      var bar = el("p"); bar.append(btn, reset); s.append(bar);
    });
  }

  /* ---------- Selbsteinschätzung ---------- */
  var FACES = [["gut", "😀", "Ich kann das sicher"], ["mittel", "🙂", "Ich kann das teilweise"], ["schwach", "😟", "Ich kann das noch nicht"]];
  function initIch(root) {
    root.querySelectorAll("table.ich[data-key]").forEach(function (t) {
      var key = t.dataset.key;
      t.querySelectorAll("tr[data-id]").forEach(function (tr) {
        var id = "pr7-" + key + "-" + tr.dataset.id;
        var td = el("td"); var wrap = el("div", { class: "smileys", role: "radiogroup", "aria-label": "Selbsteinschätzung" });
        var saved = store.get(id);
        FACES.forEach(function (f) {
          var lab = el("label", { title: f[2] });
          var r = el("input", { type: "radio", name: id, value: f[0], "aria-label": f[2] });
          if (saved === f[0]) r.checked = true;
          r.addEventListener("change", function () { store.set(id, f[0]); });
          var sp = el("span", null, f[1]);
          lab.append(r, sp); wrap.append(lab);
        });
        td.append(wrap); tr.append(td);
      });
    });
    // Vergleich Check-in -> Check-out
    root.querySelectorAll("[data-vergleich]").forEach(function (box) {
      var key = box.dataset.vergleich;
      var ids = (box.dataset.ids || "").split(",");
      var map = { gut: "😀", mittel: "🙂", schwach: "😟" };
      var any = false;
      var html = ids.map(function (i) {
        var v = store.get("pr7-" + key + "-" + i.trim()); if (v) any = true;
        return v ? map[v] : "–";
      });
      box.querySelectorAll("[data-slot]").forEach(function (s, i) { s.textContent = html[i] || "–"; });
      if (!any) { var n = box.querySelector(".leer"); if (n) n.hidden = false; }
    });
  }

  /* ---------- Quiz / Selbsttest ---------- */
  function initQuiz(root) {
    root.querySelectorAll("form.quiz").forEach(function (f) {
      initChecks(f);
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var fr = f.querySelectorAll(".frage"), ok = 0;
        fr.forEach(function (q) {
          var right = false;
          if (q.dataset.a) {
            var sel = q.querySelector("input[type=radio]:checked");
            right = !!sel && sel.value === q.dataset.a;
          } else {
            var cs = q.querySelectorAll(".check");
            right = cs.length > 0 && Array.prototype.every.call(cs, function (c) { return c._pruefen && c._pruefen(); });
          }
          q.classList.toggle("richtig", right); q.classList.toggle("falsch", !right);
          var l = q.querySelector("details.loesung"); if (l) l.hidden = false;
          if (right) ok++;
        });
        var out = f.querySelector(".ergebnis");
        var anteil = Math.round(ok / fr.length * 100);
        var text = "Du hast " + ok + " von " + fr.length + " Aufgaben richtig – das sind " + anteil + " %. ";
        text += anteil >= 85 ? "Stark! Du bist fit für die Prozentrechnung." :
          anteil >= 60 ? "Gut! Schau dir die rot markierten Aufgaben mit den Lösungen noch einmal an." :
          "Arbeite die rot markierten Aufgaben mit dem Rückblick (Buch S. 116) noch einmal durch.";
        out.textContent = text; out.hidden = false;
        out.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      f.querySelectorAll("details.loesung").forEach(function (d) { d.hidden = true; });
    });
  }

  /* ---------- Zinseszins-Diagramm ---------- */
  function initZins(root) {
    root.querySelectorAll(".zz-widget").forEach(function (w) {
      var K0 = parseFloat(w.dataset.k || 1000);
      var ctrl = el("div", { class: "streifen-ctrl" });
      var kIn = el("input", { type: "number", min: "1", step: "any", value: K0, "aria-label": "Startkapital" });
      var pIn = el("input", { type: "range", min: "0", max: "10", step: "0.5", value: w.dataset.p || 3, "aria-label": "Zinssatz in Prozent" });
      var tIn = el("input", { type: "range", min: "1", max: "40", step: "1", value: w.dataset.t || 10, "aria-label": "Laufzeit in Jahren" });
      var pO = el("b"), tO = el("b");
      var l1 = el("label", null, "Startkapital"); l1.append(kIn, " €");
      var l2 = el("label", null, "Zinssatz"); l2.append(pIn, pO);
      var l3 = el("label", null, "Jahre"); l3.append(tIn, tO);
      ctrl.append(l1, l2, l3);
      var fig = el("figure"); var cap = el("figcaption");
      var out = el("div", { class: "streifen-out", "aria-live": "polite" });
      w.append(ctrl, fig, out);
      function draw() {
        var k = parseFloat(kIn.value) || 0, p = parseFloat(pIn.value) || 0, t = parseInt(tIn.value, 10);
        pO.textContent = fmt(p, 1) + " %"; tO.textContent = t;
        var q = 1 + p / 100, maxV = k * Math.pow(q, t);
        var W = 640, H = 260, pad = 46, bw = (W - pad - 10) / t;
        var svg = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Säulendiagramm: Kontostand mit Zinseszins im Vergleich zu einfachen Zinsen">';
        for (var g = 0; g <= 4; g++) {
          var yv = maxV * g / 4, y = H - 24 - (H - 40) * g / 4;
          svg += '<line x1="' + pad + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="#e0e3f0"/>';
          svg += '<text x="' + (pad - 4) + '" y="' + (y + 4) + '" font-size="11" text-anchor="end" fill="#565a78">' + fmt(yv, 0) + "</text>";
        }
        for (var i = 1; i <= t; i++) {
          var kc = k * Math.pow(q, i), ks = k * (1 + i * p / 100);
          var hc = (H - 40) * kc / maxV, hs = (H - 40) * ks / maxV, x = pad + (i - 1) * bw + 2;
          svg += '<rect x="' + x + '" y="' + (H - 24 - hc) + '" width="' + Math.max(bw - 4, 2) + '" height="' + hc + '" fill="#fb8c00"><title>Jahr ' + i + ": " + fmt(kc) + " € mit Zinseszins</title></rect>";
          svg += '<rect x="' + x + '" y="' + (H - 24 - hs) + '" width="' + Math.max(bw - 4, 2) + '" height="' + hs + '" fill="#7986cb"><title>Jahr ' + i + ": " + fmt(ks) + " € ohne Zinseszins</title></rect>";
          if (t <= 15 || i % 5 === 0) svg += '<text x="' + (x + bw / 2 - 2) + '" y="' + (H - 8) + '" font-size="11" text-anchor="middle" fill="#565a78">' + i + "</text>";
        }
        svg += "</svg>";
        fig.innerHTML = svg; cap.innerHTML = '<span style="color:#7986cb">■</span> Kontostand ohne Zinseszins (Zinsen werden jedes Jahr abgehoben) &nbsp; <span style="color:#fb8c00">■</span> zusätzlich durch Zinseszins – waagerecht: Jahre, senkrecht: €';
        fig.append(cap);
        var mit = k * Math.pow(q, t), ohne = k * (1 + t * p / 100);
        out.innerHTML = "Nach " + t + " Jahren: <b>K = " + fmt(q, 3) + "<sup>" + t + "</sup> · " + fmt(k) + " € = " + fmt(mit) + " €</b>. Ohne Zinseszins wären es " + fmt(ohne) + " €. Unterschied: " + fmt(mit - ohne) + " €.";
      }
      [kIn, pIn, tIn].forEach(function (x) { x.addEventListener("input", draw); });
      draw();
    });
  }

  /* ---------- Kärtchen-Zuordnung mit Lösungswort ---------- */
  function initZuordnung(root) {
    root.querySelectorAll(".zuordnung").forEach(function (z) {
      var sol = (z.dataset.loesung || "").toUpperCase();
      var inp = el("input", { type: "text", maxlength: String(sol.length + 2), "aria-label": "Lösungswort", style: "text-transform:uppercase;width:9rem;font:inherit;padding:.3rem .5rem;border:2px solid #c5cae9;border-radius:8px" });
      var btn = el("button", { type: "button", class: "sec" }, "Lösungswort prüfen");
      var fb = el("span", { class: "fb", "aria-live": "polite" });
      btn.addEventListener("click", function () {
        var ok = inp.value.trim().toUpperCase() === sol;
        fb.className = "fb " + (ok ? "ok" : "bad");
        fb.textContent = ok ? " ✓ Super, alles richtig zugeordnet!" : " ✗ Noch nicht – prüfe deine Zuordnungen.";
      });
      var p = el("p", null, "Lösungswort: "); p.append(inp, " ", btn, fb); z.append(p);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var r = document;
    initQuiz(r); initChecks(r); initStreifen(r); initSchritte(r); initIch(r); initZins(r); initZuordnung(r);
  });
})();
