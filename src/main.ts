import { ffmpeg, FileData } from "./ffmpeg.js";
import { MediaDisplayElement } from "./media-display-element.js";

const fileUpload = document.getElementById("file-upload") as HTMLInputElement;
const executeButton = document.getElementById(
	"execute-ffmpeg"
) as HTMLButtonElement;
const commandInput = document.getElementById(
	"ffmpeg-command"
) as HTMLInputElement;
const originalMedia = document.getElementById(
	"original-media"
) as MediaDisplayElement;
const processedMedia = document.getElementById(
	"processed-media"
) as MediaDisplayElement;
const progressBar = document.getElementById(
	"progress-bar"
) as HTMLProgressElement;
const output = document.getElementById("output") as HTMLPreElement;

let fileData: { name: string; data: FileData; type: string };


function bootlegPopup(text: string) {
	const popup = document.createElement("div");
	popup.classList.add("popup");
	popup.textContent = text;
	document.body.appendChild(popup);
	popup.onclick = () => document.body.removeChild(popup);
	setTimeout(() => document.body.removeChild(popup), 6000);
}

fileUpload.onchange = () => {
	if (fileUpload.files?.[0]) {
		const { type, name } = fileUpload.files[0];
		const reader = new FileReader();
		reader.readAsArrayBuffer(fileUpload.files[0]);
		reader.onloadend = () => {
			if (reader.result !== null) {
				fileData = { name, data: reader.result, type };
				originalMedia.source = new Blob([reader.result], { type });
				originalMedia.name = name;
			}
		};
	}
};

executeButton.onclick = () => {
	progressBar.removeAttribute("value");
	const obj = {
		MEMFS: [fileData],
		// what about quotes for filters?
		arguments: commandInput.value
			.trim()
			.split(/\s+/)
			.map((arg) => arg.replace(/^['"]|['"]$/g, "")),
	};

	let success = false;
	const warnOnProblem = (code: unknown) => {
		if (typeof code !== "number") return;
		// it may exit(1) after exit(0) but we can ignore that... probably
		success ||= code === 0;
		if (!success) {
			progressBar.value = 0;
			bootlegPopup("There was an issue running FFmpeg, check the output");
		}
	};

	ffmpeg(obj, {
		done: (output) => {
			if (output.MEMFS[0]) {
				const fileInput = document.createElement("input");
				fileInput.type = "file";
				processedMedia.source = new Blob([output.MEMFS[0].data], {
					// figure out the type properly
					type: fileData.type,
				});
				processedMedia.name = output.MEMFS[0].name;
				progressBar.value = progressBar.max;
			}
		},
		exit: warnOnProblem,
		error: warnOnProblem,
		abort: warnOnProblem,
		output: (data) => {
			const matched = data.match(
				/Duration: (\d+):(\d\d):(\d\d)\.(\d\d), start: .*?, bitrate: .*?/
			);
			if (matched !== null) {
				const [, hours, minutes, seconds, ms] = matched.map(Number);
				let totalProgress =
					((hours * 60 + minutes) * 60 + seconds) * 100 + ms;
				progressBar.max = totalProgress;
				return;
			}

			const timeMatch = data.match(/time=(\d+):(\d\d):(\d\d)\.(\d\d)/);
			if (timeMatch !== null) {
				const [, hours, minutes, seconds, ms] = timeMatch.map(Number);
				let currentProgress =
					((hours * 60 + minutes) * 60 + seconds) * 100 + ms;
				progressBar.value = currentProgress;
			}
			output.textContent += data + "\n";
			output.scrollTop = output.scrollHeight;
		},
	});
};
