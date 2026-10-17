/* 結の葉司法書士事務所（制作サンプル） main.js
   - 文字の大きさの切り替え（標準／大）
   - ハンバーガーメニューの開閉
   - ふわっと現れる控えめな動き（1回だけ・動きを減らす設定では動かない）
   - スマホ画面下の固定ボタンの表示切り替え
   - 電話をかけるボタン（サンプルのため発信しない）
   - お問い合わせフォームの入力チェックとダミー送信（どこにも送信しない）
   外部ライブラリは使いません。 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 文字の大きさの切り替え ---------- */
  // 保存するのは「standard」か「large」の1語だけ（個人を特定する情報は入れない）
  var SIZE_KEY = 'yuinoha-text-size';
  var sizeBar = document.querySelector('.text-size-bar');
  var sizeStatus = document.getElementById('text-size-status');

  function readSize() {
    try {
      return window.localStorage.getItem(SIZE_KEY) === 'large' ? 'large' : 'standard';
    } catch (e) {
      return root.getAttribute('data-text-size') === 'large' ? 'large' : 'standard';
    }
  }

  function applySize(size, announce) {
    var large = size === 'large';
    root.setAttribute('data-text-size', large ? 'large' : 'standard');
    document.querySelectorAll('[data-text-size-btn]').forEach(function (btn) {
      var pressed = btn.getAttribute('data-text-size-btn') === (large ? 'large' : 'standard');
      btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    });
    try {
      window.localStorage.setItem(SIZE_KEY, large ? 'large' : 'standard');
    } catch (e) { /* 保存できない端末でも、このページの中では切り替わる */ }
    if (announce && sizeStatus) {
      sizeStatus.textContent = large ? '文字を大きくしました' : '文字を標準に戻しました';
    }
  }

  if (sizeBar) {
    applySize(readSize(), false);
    sizeBar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-text-size-btn]');
      if (!btn) return;
      // 読んでいた位置がずれないよう、押す前に見えていた要素を覚えておく
      var anchor = sizeBar;
      applySize(btn.getAttribute('data-text-size-btn'), true);
      anchor.scrollIntoView({ block: 'start' });
    });
  }

  /* ---------- 印刷：よくある質問の答えを開いて印刷し、終わったら元に戻す ---------- */
  var openedForPrint = [];
  window.addEventListener('beforeprint', function () {
    if (document.body.classList.contains('is-printing-checklist')) return;
    document.querySelectorAll('details:not([open])').forEach(function (d) {
      d.open = true;
      openedForPrint.push(d);
    });
  });
  window.addEventListener('afterprint', function () {
    openedForPrint.forEach(function (d) { d.open = false; });
    openedForPrint = [];
  });

  /* ---------- ページ内リンクで来たとき、閉じている早見表などを開く ---------- */
  function openHashTarget() {
    if (!location.hash) return;
    var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!el) return;
    var parent = el.closest('details');
    if (parent) parent.open = true;
    if (el.tagName === 'DETAILS') el.open = true;
    el.querySelectorAll('details.deadline-table__details').forEach(function (d) { d.open = true; });
  }
  openHashTarget();
  window.addEventListener('hashchange', openHashTarget);

  /* ---------- ハンバーガーメニュー ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('global-nav');
  var pcQuery = window.matchMedia('(min-width: 1024px)');

  function setMenu(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('is-menu-open', open);
    // 開いている間は、後ろの本文やフッターにフォーカスや読み上げが移らないようにする
    document.querySelectorAll('main, .site-footer, .text-size-bar, .consult-bar, .skip-link').forEach(function (el) {
      if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
    if (open) {
      // パネルが表示に切り替わってから、最初の項目へフォーカスを移す
      window.setTimeout(function () {
        var firstLink = nav.querySelector('a');
        if (firstLink && nav.classList.contains('is-open')) firstLink.focus();
      }, 60);
    }
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    nav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || toggle.getAttribute('aria-expanded') !== 'true') return;
      var links = nav.querySelectorAll('a');
      var last = links[links.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        toggle.focus();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
    pcQuery.addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* ---------- ふわっと現れる動き（控えめ・1回だけ） ---------- */
  var revealTargets = document.querySelectorAll('.reveal, .photo--reveal');
  if (revealTargets.length && !reduceMotion.matches && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- トップの見出しを1文字ずつ浮かばせる（読み上げは元の文のまま） ---------- */
  var heroTitle = document.querySelector('.hero__title');
  if (heroTitle && !reduceMotion.matches) {
    var fullText = heroTitle.textContent;
    var visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    var index = 0;
    var group = document.createElement('span');
    group.className = 'char-group';
    var flush = function () {
      if (group.childNodes.length) visual.appendChild(group);
      group = document.createElement('span');
      group.className = 'char-group';
    };
    Array.prototype.slice.call(heroTitle.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        Array.prototype.forEach.call(node.textContent, function (ch) {
          var span = document.createElement('span');
          span.className = 'char';
          span.style.setProperty('--i', index++);
          span.textContent = ch;
          group.appendChild(span);
        });
      } else if (node.nodeName === 'BR') {
        flush();
        visual.appendChild(document.createElement('br'));
      } else if (node.nodeName === 'WBR') {
        // 文節の切れ目：ここで改行してよいので、まとまりを分ける
        flush();
      }
    });
    flush();
    var label = document.createElement('span');
    label.className = 'visually-hidden';
    label.textContent = fullText;
    heroTitle.textContent = '';
    heroTitle.appendChild(label);
    heroTitle.appendChild(visual);
    heroTitle.classList.add('is-split');
  }

  /* ---------- 相続の流れ（PC）：いま読んでいる手順を、左の大きな数字と線で示す ---------- */
  var stepsNow = document.querySelector('[data-steps-now]');
  var stepsBar = document.querySelector('[data-steps-bar]');
  var stepItems = document.querySelectorAll('.steps-layout .steps__item');
  if (stepsNow && stepItems.length && 'IntersectionObserver' in window) {
    var setCurrent = function (i) {
      stepItems.forEach(function (el, j) { el.classList.toggle('is-current', j === i); });
      stepsNow.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
      if (stepsBar) stepsBar.style.setProperty('--progress', i + 1);
    };
    var stepObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setCurrent(Array.prototype.indexOf.call(stepItems, entry.target));
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    stepItems.forEach(function (el) { stepObserver.observe(el); });
    setCurrent(0);
  }

  /* ---------- トップ：固定ボタンの表示切り替え ---------- */
  var fixedCta = document.querySelector('.consult-bar[data-hide-on-hero]');
  var hero = document.querySelector('.hero');
  if (fixedCta && hero && 'IntersectionObserver' in window) {
    var heroObserver = new IntersectionObserver(function (entries) {
      fixedCta.classList.toggle('is-hidden', entries[0].isIntersecting);
    });
    heroObserver.observe(hero);
  }

  /* ---------- 画面下の相談バー：閉じるボタン（閉じた状態は保存しない） ---------- */
  document.querySelectorAll('[data-consult-bar-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var bar = btn.closest('[data-consult-bar]');
      if (!bar) return;
      bar.classList.add('is-closed');
      document.body.classList.add('is-consult-bar-closed');
      // フォーカスが消えないよう、本文の先頭へ移す
      var main = document.getElementById('main');
      if (main) main.focus({ preventScroll: true });
    });
  });

  /* ---------- 電話をかけるボタン（サンプルのため発信しない） ---------- */
  // 実際のサイトでは <a href="tel:..."> にして、タップで発信の画面が開くようにする
  var SAMPLE_TEL_MESSAGE = 'このサイトは​制作​サンプルのため、​電話は​かかりません。​実際のサイトでは、​ここを​タップすると​電話をかける​画面が​開きます。';
  document.querySelectorAll('[data-sample-tel]').forEach(function (button) {
    button.addEventListener('click', function () {
      var telStatus = document.getElementById(button.getAttribute('aria-describedby'));
      if (telStatus) telStatus.textContent = SAMPLE_TEL_MESSAGE;
    });
  });

  /* ---------- 必要書類チェックリスト（見本：保存しない） ---------- */
  document.querySelectorAll('[data-checklist]').forEach(function (list) {
    var checks = list.querySelectorAll('.checklist__check');
    var countEl = list.querySelector('[data-checklist-count]');
    function update() {
      var n = 0;
      checks.forEach(function (c) { if (c.checked) n++; });
      if (countEl) countEl.textContent = String(n);
    }
    list.addEventListener('change', update);
    var resetBtn = list.querySelector('[data-checklist-reset]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        checks.forEach(function (c) { c.checked = false; });
        update();
      });
    }
    var printBtn = list.querySelector('[data-checklist-print]');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        // チェックリストだけを印刷する（印刷が終わったら元に戻す）
        document.body.classList.add('is-printing-checklist');
        window.print();
      });
    }
    // 再読み込みでブラウザがチェックを復元しないよう、表示のたびに外す（保存しない見本のため）
    window.addEventListener('pageshow', function () {
      checks.forEach(function (c) { c.checked = false; });
      update();
    });
    update();
  });
  window.addEventListener('afterprint', function () {
    document.body.classList.remove('is-printing-checklist');
  });

  /* ---------- 費用の目安の計算（見本：保存も送信もしない） ---------- */
  // 金額はすべて架空の事務所の「目安」。報酬は税込、実費は非課税。登録免許税は 2026年10月時点の税率。
  var estimator = document.getElementById('estimator');
  var estimatorResult = document.getElementById('estimator-result');
  if (estimator && estimatorResult) {
    var yen = function (n) { return n.toLocaleString('ja-JP') + '円'; };
    // 相続登記の登録免許税：評価額（1,000円未満切り捨て）× 0.4%、100円未満切り捨て、1,000円未満は1,000円
    var inheritTax = function (value) {
      var base = Math.floor(value / 1000) * 1000;
      var tax = Math.floor(base * 4 / 1000 / 100) * 100;
      return Math.max(tax, 1000);
    };
    var PROCS = {
      inherit: { name: '相続登記の申請', fee: function (v) { return 77000 + (v.count - 1) * 11000; },
        cost: function (v) {
          if (v.value > 0) return { min: inheritTax(v.value), text: '登録免許税（評価額の0.4%。評価額100万円以下の土地は、かからない場合があります）' };
          return { min: 0, text: '登録免許税：評価額の0.4%（評価額を入れると計算します）', open: true };
        } },
      koseki: { name: '戸籍の収集・相続関係説明図の作成', fee: function () { return 33000; },
        cost: function () { return { min: 3000, text: '戸籍などの取得費用（1通450〜750円。通数によります）', open: true }; } },
      bunkatsu: { name: '遺産分割協議書の作成', fee: function () { return 33000; },
        cost: function () { return { min: 0, text: '印鑑証明書の取得費用（相続人の方ごと）', open: true }; } },
      houtei: { name: '法定相続情報一覧図の取得', fee: function () { return 16500; },
        cost: function () { return { min: 0, text: '法務局での交付は無料（郵送費は別）' }; } },
      houki: { name: '相続放棄の申述書類の作成', fee: function (v) { return 44000 * v.people; },
        cost: function (v) { return { min: 800 * v.people, text: '収入印紙（1人800円）と郵便切手', open: true }; } },
      massho: { name: '抵当権の抹消', fee: function () { return 16500; },
        cost: function (v) { return { min: 1000 * v.count, text: '登録免許税（不動産1つにつき1,000円）' }; } },
      zouyo: { name: '贈与による名義変更', fee: function () { return 55000; },
        cost: function () { return { min: 0, text: '登録免許税：評価額の2%（お見積もりで計算します）', open: true }; } },
      jusho: { name: '住所・氏名の変更登記', fee: function () { return 16500; },
        cost: function (v) { return { min: 1000 * v.count, text: '登録免許税（不動産1つにつき1,000円）' }; } },
      kk: { name: '株式会社の設立', fee: function () { return 110000; },
        cost: function () { return { min: 180000, text: '登録免許税（最低15万円）と定款認証の手数料（3万円〜）', open: true }; } },
      godo: { name: '合同会社の設立', fee: function () { return 77000; },
        cost: function () { return { min: 60000, text: '登録免許税（最低6万円）', open: true }; } },
      yakuin: { name: '役員の変更', fee: function () { return 22000; },
        cost: function () { return { min: 10000, text: '登録免許税（資本金1億円以下は1万円、それより多い会社は3万円）', open: true }; } },
      honten: { name: '本店の移転', fee: function () { return 33000; },
        cost: function () { return { min: 30000, text: '登録免許税（同じ法務局の管内は3万円、管外は6万円）', open: true }; } },
      kosei: { name: '公正証書遺言の作成サポート', fee: function () { return 88000; },
        cost: function () { return { min: 0, text: '公証人の手数料（財産の額によります）・証人の費用', open: true }; } },
      jihitsu: { name: '自筆証書遺言の作成サポート', fee: function () { return 44000; },
        cost: function () { return { min: 0, text: '法務局の保管制度を使う場合は手数料3,900円', open: true }; } }
    };
    var intVal = function (id, min, max, fallback) {
      var n = parseInt(document.getElementById(id).value, 10);
      if (isNaN(n)) return fallback;
      return Math.min(Math.max(n, min), max);
    };
    var renderEstimate = function () {
      var picked = Array.prototype.slice.call(estimator.querySelectorAll('input[name="proc"]:checked')).map(function (c) { return c.value; });
      if (!picked.length) {
        estimatorResult.innerHTML = '<p class="estimator__empty">手続きを選ぶと、ここに目安が表示されます。</p>';
        return;
      }
      var v = {
        count: intVal('e-count', 1, 20, 1),
        value: intVal('e-value', 0, 100000000000, 0),
        people: intVal('e-people', 1, 10, 1)
      };
      var feeSum = 0, costSum = 0, open = false, rows = '';
      picked.forEach(function (key) {
        var p = PROCS[key];
        if (!p) return;
        var fee = p.fee(v), c = p.cost(v);
        feeSum += fee; costSum += c.min; if (c.open) open = true;
        rows += '<tr><th scope="row">' + p.name + '</th><td class="estimator__yen">' + yen(fee) + '〜</td>' +
          '<td>' + (c.min > 0 ? '<span class="estimator__yen">' + yen(c.min) + (c.open ? '〜' : '') + '</span>' : '') +
          '<span class="estimator__cost-text">' + c.text + '</span></td></tr>';
      });
      estimatorResult.innerHTML =
        '<p class="estimator__total-label">合計の目安</p>' +
        '<p class="estimator__total"><span class="estimator__total-num">' + yen(feeSum + costSum) + '〜</span></p>' +
        '<p class="estimator__breakdown">報酬 ' + yen(feeSum) + '〜 ＋ 実費 ' + yen(costSum) + '〜' + (open ? '（金額が決まらない実費は含みません）' : '') + '</p>' +
        '<div class="estimator__table-wrap"><table class="table estimator__table"><caption class="visually-hidden">選んだ手続きごとの費用の目安</caption>' +
        '<thead><tr><th scope="col">手続き</th><th scope="col">報酬の目安（税込）</th><th scope="col">実費の目安</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p class="estimator__again">あくまで目安です。実際の費用は、無料相談のあとのお見積もりでお伝えします。</p>';
    };
    estimator.addEventListener('change', renderEstimate);
    estimator.addEventListener('input', renderEstimate);
    estimator.addEventListener('submit', function (e) { e.preventDefault(); });
    // 再表示のときにブラウザが前の入力を戻さないよう、毎回まっさらにする（保存しない見本のため）
    window.addEventListener('pageshow', function () { estimator.reset(); renderEstimate(); });
  }

  /* ---------- かんたん相談予約（見本：送らない・保存しない） ---------- */
  var booking = document.querySelector('[data-booking]');
  if (booking) {
    var bForm = document.getElementById('booking-form');
    var steps = booking.querySelectorAll('[data-step]');
    var progressItems = booking.querySelectorAll('[data-progress]');
    var backBtn = booking.querySelector('[data-booking-back]');
    var nextBtn = booking.querySelector('[data-booking-next]');
    var restartBtn = booking.querySelector('[data-booking-restart]');
    var current = 1;
    var LAST = 5;
    var WEEK = ['日', '月', '火', '水', '木', '金', '土'];

    var radioValue = function (name) {
      var r = bForm.querySelector('input[name="' + name + '"]:checked');
      return r ? r.value : '';
    };
    var setErr = function (id, msg, els) {
      var el = document.getElementById(id);
      el.textContent = msg;
      el.hidden = !msg;
      els.forEach(function (x) {
        if (msg) x.setAttribute('aria-invalid', 'true'); else x.removeAttribute('aria-invalid');
      });
      return !msg;
    };
    var toLocalDate = function (str) {
      var p = str.split('-');
      return new Date(+p[0], +p[1] - 1, +p[2]);
    };
    var today = function () {
      var d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var dateInput = document.getElementById('b-date');
    var timeSelect = document.getElementById('b-time');
    // 明日から選べるようにする
    var tmr = today(); tmr.setDate(tmr.getDate() + 1);
    dateInput.min = tmr.getFullYear() + '-' + pad(tmr.getMonth() + 1) + '-' + pad(tmr.getDate());

    var validate = function (step) {
      if (step === 1) {
        return setErr('b-topic-error', radioValue('b-topic') ? '' : 'ご相談の内容を選んでください',
          Array.prototype.slice.call(bForm.querySelectorAll('input[name="b-topic"]')));
      }
      if (step === 2) {
        var okDate = true, msg = '';
        if (!dateInput.value) msg = 'ご希望の日を選んでください';
        else {
          var d = toLocalDate(dateInput.value);
          if (d <= today()) msg = '明日以降の日を選んでください';
          else if (d.getDay() === 0) msg = '日曜日はお休みです。ほかの日を選んでください';
        }
        okDate = setErr('b-date-error', msg, [dateInput]);
        var tmsg = '';
        if (!timeSelect.value) tmsg = 'ご希望の時間を選んでください';
        else if (okDate && dateInput.value && toLocalDate(dateInput.value).getDay() === 6 &&
          (timeSelect.value === '9:00〜' || timeSelect.value === '17:00〜')) {
          tmsg = '土曜日は 10:00〜16:00 の間に始まる時間を選んでください';
        } else if (timeSelect.value === '17:00〜' && okDate && dateInput.value && toLocalDate(dateInput.value).getDay() !== 6) {
          tmsg = '';
        }
        var okTime = setErr('b-time-error', tmsg, [timeSelect]);
        return okDate && okTime;
      }
      if (step === 3) {
        return setErr('b-method-error', radioValue('b-method') ? '' : 'ご相談の方法を選んでください',
          Array.prototype.slice.call(bForm.querySelectorAll('input[name="b-method"]')));
      }
      if (step === 4) {
        // お名前は必須。電話番号とメールアドレスは「どちらか一方は必須」（ボスの回答 R-10）
        var nameEl = document.getElementById('b-name');
        var telEl = document.getElementById('b-tel');
        var mailEl = document.getElementById('b-email');
        var okName = setErr('b-name-error', nameEl.value.trim() ? '' : 'お名前を入力してください', [nameEl]);
        var tel = telEl.value.trim();
        var mail = mailEl.value.trim();
        var okContact = setErr('b-contact-error', (tel || mail) ? '' : '電話番号かメールアドレスのどちらかを入力してください', (tel || mail) ? [] : [telEl, mailEl]);
        var digits = tel.replace(/[^0-9０-９]/g, '');
        var okTel = setErr('b-tel-error', (tel && (digits.length < 10 || digits.length > 11)) ? '電話番号は、数字10〜11けたで入力してください' : '', tel ? [telEl] : []);
        var okMail = setErr('b-email-error', (mail && mailEl.validity.typeMismatch) ? 'メールアドレスを正しい形で入力してください' : '', mail ? [mailEl] : []);
        if (okContact && !tel) telEl.removeAttribute('aria-invalid');
        if (okContact && !mail) mailEl.removeAttribute('aria-invalid');
        return okName && okContact && okTel && okMail;
      }
      return true;
    };

    var fillSummary = function () {
      var d = dateInput.value ? toLocalDate(dateInput.value) : null;
      var dateText = d ? (d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日（' + WEEK[d.getDay()] + '）') : '';
      var map = {
        topic: radioValue('b-topic'),
        datetime: dateText + ' ' + timeSelect.value,
        method: radioValue('b-method'),
        name: document.getElementById('b-name').value.trim(),
        tel: document.getElementById('b-tel').value.trim() || '（入力なし）',
        email: document.getElementById('b-email').value.trim() || '（入力なし）'
      };
      Object.keys(map).forEach(function (k) {
        var el = booking.querySelector('[data-summary="' + k + '"]');
        if (el) el.textContent = map[k];
      });
    };

    var show = function (step, moveFocus) {
      current = step;
      steps.forEach(function (el) {
        var s = el.getAttribute('data-step');
        el.hidden = String(step) !== s;
      });
      progressItems.forEach(function (li) {
        var n = +li.getAttribute('data-progress');
        if (step !== 'done' && n === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
        li.classList.toggle('is-done', step === 'done' || n < step);
      });
      backBtn.hidden = step === 1 || step === 'done';
      nextBtn.hidden = step === 'done';
      nextBtn.textContent = step === LAST ? '予約する（見本）' : '次へ';
      if (step === LAST) fillSummary();
      if (moveFocus) {
        var target = booking.querySelector('[data-step="' + step + '"] .booking__legend');
        if (target) {
          target.focus({ preventScroll: true });
          booking.scrollIntoView({ block: 'start' });
        }
      }
    };

    var clearAll = function () {
      bForm.reset();
      bForm.querySelectorAll('.form-error').forEach(function (e) { e.textContent = ''; e.hidden = true; });
      bForm.querySelectorAll('[aria-invalid]').forEach(function (e) { e.removeAttribute('aria-invalid'); });
    };

    nextBtn.addEventListener('click', function () {
      if (current === LAST) {
        // 見本のため、どこにも送らず、保存もしない。入力内容は画面からも消す
        clearAll();
        show('done', true);
        return;
      }
      if (!validate(current)) {
        var bad = booking.querySelector('[data-step="' + current + '"] [aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      show(current + 1, true);
    });
    backBtn.addEventListener('click', function () {
      if (typeof current === 'number' && current > 1) show(current - 1, true);
    });
    booking.querySelectorAll('[data-goto]').forEach(function (b) {
      b.addEventListener('click', function () { show(+b.getAttribute('data-goto'), true); });
    });
    restartBtn.addEventListener('click', function () { clearAll(); show(1, true); });
    // Enter キーで送信されないようにする（どこにも送らない見本のため）
    bForm.addEventListener('submit', function (e) { e.preventDefault(); nextBtn.click(); });
    // 入力を直したら、その項目のエラー表示を消す
    bForm.addEventListener('change', function () { if (typeof current === 'number' && current < LAST) {
      var errs = booking.querySelectorAll('[data-step="' + current + '"] .form-error:not([hidden])');
      if (errs.length) validate(current);
    } });
    window.addEventListener('pageshow', function () { clearAll(); show(1, false); });
    show(1, false);
  }

  /* ---------- 期限の目安の計算（見本：保存も送信もしない） ---------- */
  // 期限の決まり（2026-10-08 に法務省・国税庁の資料で確認）
  //  相続放棄：知った時から3か月／相続税：知った日の翌日から10か月目の日（例 1/6 → 11/6）
  //  相続登記：知った日から3年。2024-04-01 より前に知った相続は 2027-03-31 まで
  //  住所・氏名の変更登記：変更日から2年。2026-04-01 より前の変更は 2028-03-31 まで
  var dc = document.querySelector('[data-deadline-calc]');
  if (dc) {
    var dcDate = dc.querySelector('#dc-date');
    var dcLabel = dc.querySelector('[data-dc-label]');
    var dcResult = dc.querySelector('[data-dc-result]');
    var WEEKDAY = ['日', '月', '火', '水', '木', '金', '土'];
    var ymd = function (y, m, d) { return new Date(y, m, d); };
    var addMonths = function (date, n) {
      var y = date.getFullYear(), m = date.getMonth() + n, d = date.getDate();
      var last = new Date(y, m + 1, 0).getDate();
      return ymd(y, m, Math.min(d, last));
    };
    var fmt = function (date) {
      return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日（' + WEEKDAY[date.getDay()] + '）';
    };
    var todayDate = function () { var t = new Date(); return ymd(t.getFullYear(), t.getMonth(), t.getDate()); };
    var kind = function () {
      var r = dc.querySelector('input[name="dc-kind"]:checked');
      return r ? r.value : 'inherit';
    };
    var rowHtml = function (name, due, extra) {
      var days = Math.round((due - todayDate()) / 86400000);
      var left = days >= 0
        ? '<span class="deadline-calc__left">今日から あと約' + days.toLocaleString('ja-JP') + '日</span>'
        : '<span class="deadline-calc__left deadline-calc__left--over">目安の期限を過ぎています。今からでも手続きできます。お早めにご相談ください</span>';
      return '<li><span class="deadline-calc__name">' + name + '</span><span class="deadline-calc__due">' + fmt(due) + '<span class="nowrap">ごろまで</span></span>' + left + (extra ? '<span class="deadline-calc__extra">' + extra + '</span>' : '') + '</li>';
    };
    var render = function () {
      dcLabel.textContent = kind() === 'inherit' ? '亡くなったこと（相続したこと）を知った日' : '住所・氏名が変わった日';
      if (!dcDate.value) { dcResult.innerHTML = ''; return; }
      var p = dcDate.value.split('-');
      var d = ymd(+p[0], +p[1] - 1, +p[2]);
      if (isNaN(d.getTime())) { dcResult.innerHTML = ''; return; }
      if (d > todayDate()) {
        dcResult.innerHTML = '<p class="deadline-calc__msg">今日より後の日付です。日付をご確認ください。</p>';
        return;
      }
      var html = '<ul class="deadline-calc__list">';
      if (kind() === 'inherit') {
        html += rowHtml('相続放棄・限定承認', addMonths(d, 3));
        html += rowHtml('相続税の申告・納税', addMonths(d, 10), '相続税がかかる場合だけ。税理士の業務です');
        var reg = d < ymd(2024, 3, 1) ? ymd(2027, 2, 31) : addMonths(d, 36);
        html += rowHtml('相続登記', reg, d < ymd(2024, 3, 1) ? '2024年4月1日より前に知った相続のため' : '');
      } else {
        var addr = d < ymd(2026, 3, 1) ? ymd(2028, 2, 31) : addMonths(d, 24);
        html += rowHtml('住所・氏名の変更登記', addr, d < ymd(2026, 3, 1) ? '2026年4月1日より前の変更のため' : '');
      }
      html += '</ul>';
      dcResult.innerHTML = html;
    };
    dc.addEventListener('change', render);
    dc.addEventListener('input', render);
    dc.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); });
    window.addEventListener('pageshow', function () { dc.querySelector('form').reset(); render(); });
    dcDate.max = (function () { var t = todayDate(); return t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2); })();
  }

  /* ---------- お問い合わせフォーム ---------- */
  var form = document.getElementById('contact-form');
  if (!form) return;

  var statusBox = document.getElementById('form-status');
  var SAMPLE_MESSAGE = 'このサイトは​制作​サンプルのため、​入力内容は​送信されません。​実際の​お問い合わせは​できませんので​ご了承ください。';

  function showError(errorId, message, invalidEls) {
    var el = document.getElementById(errorId);
    el.textContent = message;
    el.hidden = false;
    invalidEls.forEach(function (input) { input.setAttribute('aria-invalid', 'true'); });
  }

  function clearError(errorId, invalidEls) {
    var el = document.getElementById(errorId);
    el.textContent = '';
    el.hidden = true;
    invalidEls.forEach(function (input) { input.removeAttribute('aria-invalid'); });
  }

  var nameInput = document.getElementById('f-name');
  var telInput = document.getElementById('f-tel');
  var emailInput = document.getElementById('f-email');
  var typeSelect = document.getElementById('f-type');
  var messageInput = document.getElementById('f-message');
  var methodRadios = Array.prototype.slice.call(form.querySelectorAll('input[name="method"]'));
  var privacyCheck = document.getElementById('f-privacy-check');

  var checks = [
    function () {
      if (nameInput.value.trim() === '') {
        showError('f-name-error', 'お名前を入力してください', [nameInput]);
        return nameInput;
      }
      clearError('f-name-error', [nameInput]);
    },
    function () {
      var tel = telInput.value.trim();
      var email = emailInput.value.trim();
      if (tel === '' && email === '') {
        clearError('f-email-error', []);
        showError('f-contact-error', '電話番号かメールアドレスのどちらかを入力してください', [telInput, emailInput]);
        return telInput;
      }
      clearError('f-contact-error', [telInput, emailInput]);
      if (email !== '' && emailInput.validity.typeMismatch) {
        showError('f-email-error', 'メールアドレスを正しい形で入力してください', [emailInput]);
        return emailInput;
      }
      clearError('f-email-error', [emailInput]);
    },
    function () {
      if (typeSelect.value === '') {
        showError('f-type-error', 'ご相談内容の種類を選択してください', [typeSelect]);
        return typeSelect;
      }
      clearError('f-type-error', [typeSelect]);
    },
    function () {
      var checked = methodRadios.some(function (r) { return r.checked; });
      if (!checked) {
        showError('f-method-error', 'ご希望の相談方法を選択してください', methodRadios);
        return methodRadios[0];
      }
      clearError('f-method-error', methodRadios);
    },
    function () {
      if (messageInput.value.trim() === '') {
        showError('f-message-error', 'ご相談内容を入力してください', [messageInput]);
        return messageInput;
      }
      clearError('f-message-error', [messageInput]);
    },
    function () {
      if (!privacyCheck.checked) {
        showError('f-privacy-error', '個人情報の取扱いへの同意にチェックを入れてください', [privacyCheck]);
        return privacyCheck;
      }
      clearError('f-privacy-error', [privacyCheck]);
    }
  ];

  var submitted = false;

  function validateAll() {
    var first = null;
    checks.forEach(function (check) {
      var bad = check();
      if (bad && !first) first = bad;
    });
    return first;
  }

  form.addEventListener('submit', function (e) {
    // サンプルのため、どこにも送信しない
    e.preventDefault();
    submitted = true;
    statusBox.textContent = '';
    var firstError = validateAll();
    if (firstError) {
      var target = firstError.closest('.form-field, .form-group') || firstError;
      target.scrollIntoView({ block: 'start' });
      firstError.focus({ preventScroll: true });
      return;
    }
    statusBox.textContent = SAMPLE_MESSAGE;
    statusBox.scrollIntoView({ block: 'center' });
  });

  form.addEventListener('input', function () { if (submitted) validateAll(); });
  form.addEventListener('change', function () { if (submitted) validateAll(); });
})();
