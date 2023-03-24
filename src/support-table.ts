import { ffmpeg } from "./ffmpeg.js";

const supportedFeaturesTable = document.getElementById(
	"supported-features"
) as HTMLTableSectionElement;

// query for supported features
(() => {
	ffmpeg(
		{ arguments: ["-codecs"] },
		{
			output: (data) => {
				const codecRow =
					/^ [D.][E.][VAS.][I.][L.][S.] [^=].+?\s+.+?/g.test(data);
				if (!codecRow) return;

				const [, support, abbreviation, ...name] = data.split(/ +/);
				// check support length?
				const decodingSupport = support[0] === "D";
				const encodingSupport = support[1] === "E";
				if (!decodingSupport && !encodingSupport) return;
				const codecType =
					support[2] === "V"
						? "video"
						: support[2] === "A"
						? "audio"
						: support[2] === "S"
						? "subtitle"
						: "unknown";
				const intraFrameOnly = support[3] === "I";
				const lossyCompression = support[4] === "L";
				const losslessCompression = support[5] === "S";

				const row = document.createElement("tr");
				for (const value of [
					abbreviation,
					codecType,
					name.join(" "),
					decodingSupport,
					encodingSupport,
					intraFrameOnly,
					lossyCompression,
					losslessCompression,
				]) {
					const column = document.createElement("td");
					column.textContent =
						typeof value === "string"
							? value
							: value // assume it's a boolean
							? "Yes"
							: "No";
					column.setAttribute("data-value", String(value));

					row.appendChild(column);
				}
				supportedFeaturesTable.appendChild(row);
			}
		})
})();
