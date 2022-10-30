const { ipcRenderer } = require("electron");

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

var tab1 = document.getElementById("tab1");
document.getElementById("back-button").addEventListener("click", () => {
	tab1.goBack();
});
document.getElementById("forward-button").addEventListener("click", () => {
	tab1.goForward();
});
document.getElementById("reload-button").addEventListener("click", () => {
	if (tab1.isLoading()) {
		tab1.stop();
	} else {
		tab1.reload();
	}
});

var favicon = "";

tab1.addEventListener("did-frame-navigate", () => {
	document.getElementById("tab1-title").innerText = tab1.getTitle();
	document.getElementById("url-input").value = tab1.getURL();
});
tab1.addEventListener("did-frame-finish-load", () => {
	document.getElementById("tab1-title").innerText = tab1.getTitle();
});

tab1.addEventListener("did-start-loading", () => {
	document.getElementById("favicon").setAttribute("src", "favicon/loading.gif");
	document.getElementById("reload-button").innerHTML = `
    <i class="fa-regular fa-xmark-large"></i>
    `;
});
tab1.addEventListener("did-stop-loading", () => {
	document.getElementById("favicon").setAttribute("src", favicon);
	document.getElementById("reload-button").innerHTML = `
    <i class="fa-regular fa-rotate-right"></i>
    `;
	if (tab1.canGoBack()) {
		document.getElementById("back-button").removeAttribute("disabled");
	} else {
		document.getElementById("back-button").setAttribute("disabled", "");
	}
	if (tab1.canGoForward()) {
		document.getElementById("forward-button").removeAttribute("disabled");
	} else {
		document.getElementById("forward-button").setAttribute("disabled", "");
	}
});

async function checkFavicon(url) {
	var valid = "";
	var request = new XMLHttpRequest();
	request.open("GET", url, true);
	request.send();
	request.onload = function () {
		status = request.status;
		if (request.status == 200) {
			document.getElementById("favicon").setAttribute("src", url);
		} else {
			document.getElementById("favicon").setAttribute("src", "https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2012/png/iconmonstr-globe-2.png&r=135&g=135&b=135");
		}
	};
	return valid;
}
tab1.addEventListener("page-favicon-updated", (e) => {
	favicon = e.favicons[0];
	checkFavicon(e.favicons[0]);
});

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
			tab1.loadURL(https_url);
		} else {
			tab1.loadURL("https://www.google.com/search?q=" + url);
		}
		document.getElementById("url-input").blur();
	}
});

document.getElementById("newtab-button").addEventListener("click", () => {
	var newtab_handle = document.createElement("div");
	document.getElementById("window-title").insertBefore(newtab_handle, document.getElementById("window-title").lastElementChild);
	newtab_handle.classList.add("tab");
	newtab_handle.innerHTML = `
	<div style="display: flex; flex-direction: row; align-items: center; justify-items: flex-start; overflow: hidden">
		<img src="" id="favicon" width="16" height="16" style="margin-right: 10px" />
		<p id="tab1-title" class="tab-title">Home</p>
	</div>
	<button class="control-buttons" onclick="this.parentElement.remove()">
		<i class="fa-regular fa-xmark"></i>
	</button>
    `;
});
