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
			window.location.href = "https://www.google.com/search?q=" + e.target.innerText;
		});
	}
}
document.getElementById("url-input").addEventListener("keyup", (e) => {
	getSuggestions(document.getElementById("url-input").value);
	if (e.key === "Enter") {
		e.preventDefault();
		window.location.href = "https://www.google.com/search?q=" + document.getElementById("url-input").value;
	}
});
document.getElementById("url-input").addEventListener("click", (e) => {
	getSuggestions(document.getElementById("url-input").value);
});
