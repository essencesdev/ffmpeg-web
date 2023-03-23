export class MediaDisplayElement extends HTMLElement {
	#_source: Blob | null = null;
	#_container: HTMLDivElement;
	#_mediaElement: HTMLMediaElement | HTMLImageElement | null = null;
	#_downloadLink: HTMLAnchorElement | null = null;
	#_name: string = "download";

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		const style = document.createElement("style");
		style.textContent = `
			.media-container {
				position: relative;
				display: flex;
				align-items: center;
				justify-content: center;
				height: 100%;
				width: 100%;
			}
			.media-container:empty::after {
				content: "No source detected";
			}
			.download-link {
				position: absolute;
				margin: 10px;
				top: 0;
				left: 0;
				display: none;
				background-color: white;
				border: 1px solid black;
				padding: 5px;
			}
			.media-container:hover > .download-link {
				display: block;
			}
			video, audio, img {
				max-width: 100%;
				max-height: 100%;
			}
		`;
		this.shadowRoot!.appendChild(style);
		this.#_container = document.createElement("div");
		this.#_container.classList.add("media-container");
		this.shadowRoot!.appendChild(this.#_container);
	}

	set name(name: string) {
		this.#_name = name;

		if (this.#_downloadLink !== null) {
			this.#_downloadLink.download = this.#_name;
			this.#_downloadLink.textContent = `Download ${this.#_name}`;
		}
	}

	get name() {
		return this.#_name;
	}

	set source(blob: Blob | null) {
		console.log("media-display", "set-source", blob);
		this.#_source = blob;
		this.refreshInnerElement();
	}

	get source(): Blob | null {
		return this.#_source;
	}

	refreshInnerElement() {
		if (this.#_mediaElement !== null) {
			this.#_container.removeChild(this.#_mediaElement);
			// why keep making urls? because it was too hard to figure out the
			// file type so we pass the blob instead of the url itself
			URL.revokeObjectURL(this.#_mediaElement.src);
			this.#_mediaElement = null;
		}

		if (this.#_downloadLink !== null) {
			this.#_container.removeChild(this.#_downloadLink);
			this.#_downloadLink = null;
		}

		if (this.#_source === null) {
			return;
		}

		if (this.#_source.type.startsWith("video/")) {
			this.#_mediaElement = document.createElement("video");
			this.#_mediaElement.controls = true;
			// this.#_mediaElement.videoWidth;
		} else if (this.#_source.type.startsWith("audio/")) {
			this.#_mediaElement = document.createElement("audio");
			this.#_mediaElement.controls = true;
		} else if (this.#_source.type.startsWith("image/")) {
			this.#_mediaElement = document.createElement("img");
			// this.#_mediaElement.naturalWidth;
		} else {
			console.log(`Unrecognized media type ${this.#_source.type}`);
			return;
		}

		const url = URL.createObjectURL(this.#_source);
		this.#_mediaElement.src = url;
		this.#_container.appendChild(this.#_mediaElement);
		this.#_downloadLink = document.createElement("a");
		this.#_downloadLink.classList.add("download-link");
		this.#_downloadLink.href = url;
		this.#_downloadLink.download = this.#_name;
		this.#_downloadLink.textContent = `Download ${this.#_name}`;
		this.#_container.appendChild(this.#_downloadLink);
	}
}

customElements.define("media-display", MediaDisplayElement);
