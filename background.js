const session = (() => {
    const arr = new Uint32Array(8);
    crypto.getRandomValues(arr);
    return Array.from(arr)
        .map((n) => n.toString(32))
        .join("");
})();

cleanup(session);

const messaged = (message, sender) => {
    switch (message.messageName) {
    case "get-session":
        return async () => {
            return { session };
        };
    }
};

browser.runtime.onMessage.addListener(messaged);

browser.browserAction.onClicked.addListener(() => {
    browser.tabs.create({ url: "/a.html", active: false });
});
