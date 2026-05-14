(() => {
  // Guard: don't re-initialize if already injected
  if (window.__AUTOSHAKE_INITIALIZED__) {
    console.log("[AutoShake] inject.js already running, skipping re-init");
    return;
  }
  window.__AUTOSHAKE_INITIALIZED__ = true;

  console.log("[AutoShake] inject.js initializing");

  window.__AUTOSHAKE_GRAPHQL_RESPONSES__ = [];
  window.__AUTOSHAKE_CLICKED_JOBS__ = [];

  const origFetch = window.fetch;

  window.fetch = async (...args) => {
    const res = await origFetch(...args);
    const clone = res.clone();

    clone.json().then((data) => {
      if (data?.data || data?.errors) {
        window.__AUTOSHAKE_GRAPHQL_RESPONSES__.push({
          url: args[0],
          data: JSON.stringify(data),
          timestamp: new Date().toISOString(),
        });
        console.log("[AutoShake] Intercepted GraphQL response", window.__AUTOSHAKE_GRAPHQL_RESPONSES__.length);
        window.postMessage({
          type: "AUTOSHAKE_GRAPHQL_UPDATE",
          responses: window.__AUTOSHAKE_GRAPHQL_RESPONSES__,
        }, "*");
      }
    }).catch(() => {});

    return res;
  };

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data.type === "AUTOSHAKE_GET_DATA") {
      window.postMessage({
        type: "AUTOSHAKE_DATA_RESPONSE",
        graphqlResponses: window.__AUTOSHAKE_GRAPHQL_RESPONSES__,
        clickedJobs: window.__AUTOSHAKE_CLICKED_JOBS__,
      }, "*");
    }
  });
})();