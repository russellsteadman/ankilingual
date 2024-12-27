import Browser from "webextension-polyfill";

if (typeof chrome !== "undefined" && typeof chrome.sidePanel !== "undefined") {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(console.error);
} else {
  Browser.action.onClicked.addListener((tab) => {
    Browser.sidebarAction.toggle();
  });
}

console.log(
  "test",
  Browser.i18n.getMessage("contextMenuItemGetImage"),
  Browser.i18n.getMessage("extName")
);

Browser.contextMenus.create(
  {
    id: "get-image",
    title: Browser.i18n.getMessage("contextMenuItemGetImage"),
    contexts: ["image"],
  },
  () => void Browser.runtime.lastError
);

Browser.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "get-image") {
    const blob = await fetch(info.srcUrl!).then((r) => r.blob());

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result;
      Browser.runtime.sendMessage({ type: "image", image: base64data });
    };
    reader.readAsDataURL(blob);
  }

  console.log(info);
});
