/*
 * Shoe Forge embed SDK. No dependencies.
 * <div id="configurator"></div>
 * <script src="https://YOUR-SITE/embed.js"></script>
 * <script>
 *   const cfg = ShoeForge.mount(document.getElementById("configurator"), { product: "forge-runner", theme: "light" });
 *   cfg.on("change", (e) => console.log(e.price));
 *   cfg.getDesign().then((d) => console.log(d));
 * </script>
 */
(function () {
  var script = document.currentScript;
  var base = script ? new URL(script.src).origin : window.location.origin;

  function mount(el, options) {
    if (!el) throw new Error("ShoeForge.mount: container element is required");
    var opts = options || {};
    if (!opts.product) throw new Error("ShoeForge.mount: options.product is required");
    var params = new URLSearchParams();
    params.set("origin", window.location.origin);
    if (opts.theme) params.set("theme", opts.theme);
    if (opts.accent) params.set("accent", String(opts.accent).replace("#", ""));

    var frame = document.createElement("iframe");
    frame.src = base + "/embed/" + encodeURIComponent(opts.product) + "?" + params.toString();
    frame.title = "Shoe configurator";
    frame.loading = "lazy";
    frame.allow = "clipboard-write; fullscreen; xr-spatial-tracking";
    frame.style.cssText = "width:100%;height:" + (opts.height || "620px") + ";border:0;border-radius:20px;";
    el.appendChild(frame);

    var listeners = {};
    var pending = {};
    var seq = 0;

    function emit(name, payload) {
      (listeners[name] || []).forEach(function (cb) { cb(payload); });
    }

    function onMessage(e) {
      if (e.source !== frame.contentWindow || e.origin !== base) return;
      var m = e.data || {};
      if (m.type === "sf:change") emit("change", { design: m.design, price: m.price });
      else if (m.type === "sf:ready") emit("ready", {});
      else if (m.type === "sf:error") emit("error", { message: m.message });
      else if (m.type === "sf:design" && pending[m.requestId]) {
        pending[m.requestId](m.design);
        delete pending[m.requestId];
      }
    }
    window.addEventListener("message", onMessage);

    function send(msg) {
      if (frame.contentWindow) frame.contentWindow.postMessage(msg, base);
    }

    return {
      setPart: function (partId, change) {
        send(Object.assign({ type: "sf:setPart", partId: partId }, change || {}));
      },
      getDesign: function () {
        return new Promise(function (resolve) {
          var requestId = "r" + ++seq;
          pending[requestId] = resolve;
          send({ type: "sf:getDesign", requestId: requestId });
        });
      },
      on: function (name, cb) {
        (listeners[name] = listeners[name] || []).push(cb);
      },
      destroy: function () {
        window.removeEventListener("message", onMessage);
        el.removeChild(frame);
      },
    };
  }

  window.ShoeForge = { mount: mount };
})();
