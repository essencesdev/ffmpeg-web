type FfmpegMessage =
	| ReadyMessage
	| RunMessage
	| StdoutMessage
	| StderrMessage
	| ExitMessage
	| DoneMessage
	| ErrorMessage
	| AbortMessage;

interface ReadyMessage {
	type: "ready";
}

interface RunMessage {
	type: "run";
}

interface StdoutMessage {
	type: "stdout";
	data: string;
}

interface StderrMessage {
	type: "stderr";
	data: string;
}

interface ExitMessage {
	type: "exit";
	data: number;
}

interface DoneMessage {
	type: "done";
	data: { MEMFS: Memfs };
}

interface ErrorMessage {
	type: "error";
	data: string;
}

interface AbortMessage {
	type: "abort";
	data: string;
}

interface JobMessage {
	arguments?: string[];
	MEMFS?: Memfs;
}

type Memfs = { name: string; data: FileData }[];
export type FileData = ArrayBufferView | ArrayBuffer | string;

interface WorkerListeners {
	exit: (exitCode: number) => void;
	done: (data: { MEMFS: Memfs }) => void;
	error: (data: unknown) => void;
	abort: (data: unknown) => void;
	output: (output: string) => void;
}

export function ffmpeg(
	message: JobMessage,
	listeners: Partial<WorkerListeners>
) {
	const worker = new Worker("ffmpeg-worker-mp4.js");
	worker.onmessage = (e: { data: FfmpegMessage }) => {
		switch (e.data.type) {
			case "ready":
				worker.postMessage({ type: "run", ...message });
				return;
			case "run":
				return;
			case "stdout":
			case "stderr":
				// seems to always output to stderr instead of stdout
				listeners.output?.(e.data.data);
				return;
			case "exit":
				listeners.exit?.(e.data.data);
				return;
			case "done":
				listeners.done?.(e.data.data);
				return;
			case "error":
				listeners.error?.(e.data.data);
				return;
			case "abort":
				listeners.abort?.(e.data.data);
				return;
		}
	};
}
