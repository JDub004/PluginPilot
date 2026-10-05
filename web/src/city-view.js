// Share-link loader for /city/view. The city input lives in the URL fragment (#d=base64url JSON),
// which is never sent to the server; it is POSTed once to /city/api/build and not stored.
(function () {
  function msg(t) { var p = document.getElementById('panel'); if (p) { p.textContent = ''; var h = document.createElement('p'); h.textContent = t; p.appendChild(h); } }
  var m = location.hash.match(/^#d=([A-Za-z0-9_-]+)$/);
  if (!m) { msg('Kein Stadt-Link gefunden. Bitte den vollständigen Teilen-Link öffnen.'); return; }
  var b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
  var input;
  try {
    var bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    input = JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) { msg('Der Link ist beschädigt.'); return; }
  fetch('/city/api/build', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) })
    .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'Fehler'); return j; }); })
    .then(function (j) {
      document.title = 'Software-Stadt: ' + j.city.company;
      window.__startCity(j.city);
      var a = document.createElement('a');
      a.textContent = 'Bericht herunterladen';
      a.className = 'report-btn';
      a.download = 'software-bericht.md';
      a.href = URL.createObjectURL(new Blob([j.report], { type: 'text/markdown' }));
      document.body.appendChild(a);
    })
    .catch(function (e) { msg('Stadt konnte nicht gebaut werden: ' + e.message); });
})();
