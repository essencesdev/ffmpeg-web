import { ffmpeg } from "./ffmpeg.js";
import { ShadowedWithStylesheetElement } from "./shadowed-with-stylesheet-element.js";

interface Configuration {
	arguments: string[];
	regex: RegExp;
	// takes the list of matches and determines if we want to continue or not
	filter: (x: string[]) => boolean;
	// column name and processor, also should match regex group order
	columns: [string, (v: string) => boolean | string][];
	// order of column indices
	columnOrder: number[];
}

type Type = "codecs" | "filters";

function validateType(type: string): type is Type {
	return ["codecs", "filters"].includes(type);
}

const configurations: Record<Type, Configuration> = {
	filters: {
		arguments: ["-filters"],
		regex: / ([T.])([S.])([C.]) ([^=].*?)\s+([AVN]+\->[AVN]+)\s+(.+)/,
		filter: () => true,
		columns: [
			["Timeline Support", (s) => s === "T"],
			["Slice Threading", (s) => s === "S"],
			["Command Support", (s) => s === "C"],
			["Filter Name", (s) => s],
			["Transform", (s) => s],
			["Description", (s) => s],
		],
		columnOrder: [3, 5, 4, 0, 1, 2],
	},
	codecs: {
		arguments: ["-codecs"],
		regex: / ([D.])([E.])([VAS.])([I.])([L.])([S.]) ([^=].*?)\s+(.+)/,
		filter: (matches: string[]) => matches[1] !== "." || matches[2] !== ".",
		columns: [
			["Can Decode", (s) => s === "D"],
			["Can Encode", (s) => s === "E"],
			[
				"Codec Type",
				(s) =>
					s === "V"
						? "Video"
						: s === "A"
						? "Audio"
						: s === "S"
						? "Subtitles"
						: "Unknown",
			],
			["Intra Frame-Only Codec", (s) => s === "I"],
			["Lossy Compression", (s) => s === "L"],
			["Lossless Compression", (s) => s === "S"],
			["Short Name", (s) => s],
			["Description", (s) => s],
		],
		columnOrder: [6, 7, 0, 1, 2, 3, 4, 5],
	},
};

class SupportTableElement extends ShadowedWithStylesheetElement {
	constructor() {
		super();

		const style = document.createElement("style");
		style.innerHTML = `
			table {
				min-width: 100%;
			}
			tr, th, td {
				border: 1px solid var(--grey-2);
				padding: 5px;
			}
			td[data-value="true"] {
				color: var(--grey-1);
				background-color: var(--green-1);
			}
			td[data-value="false"] {
				color: var(--grey-1);
				background-color: var(--red-1);
			}
		`;
		this.shadowRoot!.appendChild(style);

		const type = this.getAttribute("data-type") ?? "";

		if (!validateType(type)) {
			throw new Error(`support table with invalid type ${type} found`);
		}

		this.queryFfmpeg(configurations[type]);
	}

	queryFfmpeg(config: Configuration) {
		const table = document.createElement("table");
		const headerRow = document.createElement("tr");

		for (const index of config.columnOrder) {
			const [name] = config.columns[index];
			const header = document.createElement("th");
			header.textContent = name;
			headerRow.appendChild(header);
		}

		table.appendChild(headerRow);
		this.shadowRoot!.appendChild(table);

		ffmpeg(
			{ arguments: config.arguments },
			{
				output: (data) => {
					const match = data.match(config.regex);
					if (match === null) return;
					if (!config.filter(match)) return;

					const row = document.createElement("tr");

					for (const index of config.columnOrder) {
						const [, processor] = config.columns[index];
						const groupIndex = index + 1; // skip match's full match

						const value = processor(match[groupIndex]).toString();

						const cell = document.createElement("td");
						cell.textContent = value;
						cell.setAttribute("data-value", value);
						row.appendChild(cell);
					}

					table.appendChild(row);
				},
			}
		);
	}
}

customElements.define("support-table", SupportTableElement);
