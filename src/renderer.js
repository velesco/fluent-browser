const { ipcRenderer } = require("electron");
const path = require("path");

document.getElementById("min-button").addEventListener("click", () => {
	ipcRenderer.send("minimize");
});
document.getElementById("max-button").addEventListener("click", () => {
	ipcRenderer.send("maximize");
});
document.getElementById("restore-button").addEventListener("click", () => {
	ipcRenderer.send("restore");
});
document.getElementById("close-button").addEventListener("click", () => {
	ipcRenderer.send("close");
});

document.getElementById("back-button").addEventListener("click", () => {
	document.querySelector(".webview.active-tab").goBack();
});
document.getElementById("forward-button").addEventListener("click", () => {
	document.querySelector(".webview.active-tab").goForward();
});
document.getElementById("reload-button").addEventListener("click", () => {
	if (document.querySelector(".webview.active-tab").isLoading()) {
		document.querySelector(".webview.active-tab").stop();
	} else {
		document.querySelector(".webview.active-tab").reload();
	}
});

var favicon = "";

async function checkFavicon(url, favicon) {
	var valid = "";
	var request = new XMLHttpRequest();
	request.open("GET", url, true);
	request.send();
	request.onload = function () {
		status = request.status;
		if (request.status == 200) {
			favicon.setAttribute("src", url);
		} else {
			favicon.setAttribute("src", "https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2012/png/iconmonstr-globe-2.png&r=135&g=135&b=135");
		}
	};
	return valid;
}

const isValidUrl = (urlString) => {
	var urlPattern = new RegExp(
		"^(https?:\\/\\/)?" + // validate protocol
			"((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
			"((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
			"(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
			"(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
			"(\\#[-a-z\\d_]*)?$",
		"i"
	); // validate fragment locator
	return !!urlPattern.test(urlString);
};

document.getElementById("url-input").addEventListener("keypress", (e) => {
	if (e.key === "Enter") {
		e.preventDefault();
		var url = document.getElementById("url-input").value;
		url = url.replace(/https?:\/\//, "");
		https_url = "https://" + url;
		if (isValidUrl(https_url)) {
			document.querySelector(".webview.active-tab").loadURL(https_url);
		} else {
			document.querySelector(".webview.active-tab").loadURL("https://www.google.com/search?q=" + url);
		}
		document.getElementById("url-input").blur();
	}
});

var currentTabID = 0;

function createNewTab(url) {
	var newtab_handle = document.createElement("div");
	var tabID = currentTabID;
	document.getElementById("window-title").appendChild(newtab_handle);
	newtab_handle.classList.add("tab");
	newtab_handle.innerHTML =
		`
	<div style="display: flex; flex-direction: row; align-items: center; justify-items: flex-start; overflow: hidden">
		<img src="" id="favicon` +
		tabID +
		`" width="16" height="16" style="margin-right: 10px" />
		<p id="tab` +
		tabID +
		`-title" class="tab-title">Home</p>
	</div>
	<button class="control-buttons" id="tabclose` +
		tabID +
		`">
		<i class="fa-regular fa-xmark"></i>
	</button>
	`;
	newtab_handle.id = "tabHandle" + tabID;

	var newtab_view = document.createElement("webview");
	document.getElementById("main").appendChild(newtab_view);
	newtab_view.classList.add("webview");
	newtab_view.id = "tab" + tabID;
	newtab_view.setAttribute("src", url || path.join(__dirname, "pages", "home", "index.html"));

	newtab_handle.addEventListener("click", () => {
		Array.from(document.getElementsByClassName("tab")).forEach((tab) => {
			tab.classList.remove("active-tab");
		});
		newtab_handle.classList.add("active-tab");

		Array.from(document.getElementsByClassName("webview")).forEach((tab) => {
			tab.classList.remove("active-tab");
		});
		newtab_view.classList.add("active-tab");

		if (newtab_view.getURL() == "file:///" + path.join(__dirname, "pages", "settings", "index.html").replace(/\\/g, "/")) {
			document.getElementById("url-input").value = "browser://settings";
		} else {
			document.getElementById("url-input").value = newtab_view.getURL();
		}

		if (newtab_view.isLoading()) {
			document.getElementById("reload-button").innerHTML = `
			<i class="fa-regular fa-xmark-large"></i>
			`;
		} else {
			document.getElementById("reload-button").innerHTML = `
			<i class="fa-regular fa-rotate-right"></i>
			`;
		}

		if (newtab_view.canGoBack()) {
			document.getElementById("back-button").removeAttribute("disabled");
		} else {
			document.getElementById("back-button").setAttribute("disabled", "");
		}
		if (newtab_view.canGoForward()) {
			document.getElementById("forward-button").removeAttribute("disabled");
		} else {
			document.getElementById("forward-button").setAttribute("disabled", "");
		}
	});

	newtab_handle.click();

	newtab_view.addEventListener("did-frame-navigate", () => {
		document.getElementById("tab" + tabID + "-title").innerText = newtab_view.getTitle();

		if (newtab_view.getURL() == "file:///" + path.join(__dirname, "pages", "settings", "index.html").replace(/\\/g, "/")) {
			document.getElementById("url-input").value = "browser://settings";
		} else if (newtab_view.getURL() == "file:///" + path.join(__dirname, "pages", "home", "index.html").replace(/\\/g, "/")) {
			document.getElementById("url-input").value = "";
		} else {
			document.getElementById("url-input").value = newtab_view.getURL();
		}
	});
	newtab_view.addEventListener("did-frame-finish-load", () => {
		document.getElementById("tab" + tabID + "-title").innerText = newtab_view.getTitle();
	});

	newtab_view.addEventListener("did-start-loading", () => {
		document.getElementById("favicon" + tabID).setAttribute("src", "favicon/loading.gif");
		document.getElementById("reload-button").innerHTML = `
		<i class="fa-regular fa-xmark-large"></i>
		`;
	});
	newtab_view.addEventListener("did-stop-loading", () => {
		document.getElementById("favicon" + tabID).setAttribute("src", favicon);
		document.getElementById("reload-button").innerHTML = `
		<i class="fa-regular fa-rotate-right"></i>
		`;
		if (newtab_view.canGoBack()) {
			document.getElementById("back-button").removeAttribute("disabled");
		} else {
			document.getElementById("back-button").setAttribute("disabled", "");
		}
		if (newtab_view.canGoForward()) {
			document.getElementById("forward-button").removeAttribute("disabled");
		} else {
			document.getElementById("forward-button").setAttribute("disabled", "");
		}
	});

	newtab_view.addEventListener("page-favicon-updated", (e) => {
		favicon = e.favicons[0];
		checkFavicon(e.favicons[0], document.getElementById("favicon" + tabID));
	});

	document.getElementById("tabclose" + tabID).addEventListener("click", () => {
		document.getElementById("tab" + tabID).remove();
		ipcRenderer.send("tab-close");
		document.getElementById("tabHandle" + tabID).remove();
	});

	newtab_view.addEventListener("new-window", (event) => {
		event.preventDefault();
		createNewTab(event.url);
	});

	currentTabID++;
}

createNewTab();

document.getElementById("newtab-button").addEventListener("click", () => {
	createNewTab();
});

function toggleFullscreen() {
	if (!document.fullscreenElement) {
		document.getElementById("main").requestFullscreen();
	} else {
		document.exitFullscreen();
	}
}

// search suggestions
async function getSuggestions(text) {
	var suggestions = await (await fetch("https://google.com/complete/search?output=toolbar&q=" + text)).text();
	var json_sugg = $.xml2json(suggestions);
	json_sugg = json_sugg.CompleteSuggestion;
	document.getElementById("suggestions").outerHTML = `<div id="suggestions"></div>`;
	for (let i = 0; i < json_sugg.length; i++) {
		var suggestion_div = document.createElement("div");
		document.getElementById("suggestions").appendChild(suggestion_div);
		suggestion_div.classList.add("suggestion-li");
		suggestion_div.innerText = json_sugg[i].suggestion.data;
		suggestion_div.addEventListener("click", (e) => {
			document.querySelector(".webview.active-tab").loadURL("https://www.google.com/search?q=" + e.target.innerText);
		});
	}
}
document.getElementById("url-input").addEventListener("keyup", (e) => {
	getSuggestions(document.getElementById("url-input").value);
	if (e.key === "Enter") {
		e.preventDefault();
		document.querySelector(".webview.active-tab").loadURL("https://www.google.com/search?q=" + document.getElementById("url-input").value);
	}
});
document.getElementById("url-input").addEventListener("click", (e) => {
	getSuggestions(document.getElementById("url-input").value);
});
