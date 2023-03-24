export class ShadowedWithStylesheetElement extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		const styleSheet = document.createElement("link");
		styleSheet.rel = "stylesheet";
		styleSheet.href = "/colors.css";
		this.shadowRoot!.appendChild(styleSheet);
	}
}
