import addFolderSvg from "@/assets/icons/add_folder.svg"
import closedFolderSvg from "@/assets/icons/closed_folder.svg"
import openFolderSvg from "@/assets/icons/open_folder.svg"
import musicFileIconSvg from "@/assets/icons/music_file_icon.svg"

export function ClosedFolderIcon({ className }: { className?: string }) {
	return <img src={closedFolderSvg.src} alt="" className={className} draggable={false} />
}

export function OpenFolderIcon({ className }: { className?: string }) {
	return <img src={openFolderSvg.src} alt="" className={className} draggable={false} />
}

export function MusicFileIcon({ className }: { className?: string }) {
	return <img src={musicFileIconSvg.src} alt="" className={className} draggable={false} />
}

export function ChevronIcon({ expanded, className }: { expanded: boolean; className?: string }) {
	return (
		<svg
			width="10"
			height="10"
			viewBox="0 0 10 10"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			style={{ transform: expanded ? "rotate(90deg)" : undefined, transition: "transform 150ms" }}
		>
			<path d="M2 1L8 5L2 9" stroke="black" strokeWidth="2" strokeLinecap="square" />
		</svg>
	)
}

export function UploadIcon({ className }: { className?: string }) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<path d="M8 2V11" stroke="black" strokeWidth="2" strokeLinecap="square" />
			<path d="M4 6L8 2L12 6" stroke="black" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
			<path d="M2 13H14" stroke="black" strokeWidth="2" strokeLinecap="square" />
		</svg>
	)
}

export function NewFolderIcon({ className }: { className?: string }) {
	return <img src={addFolderSvg.src} alt="" className={className} draggable={false} />
}

export function DeleteIcon({ className }: { className?: string }) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<path d="M3 4H13" stroke="black" strokeWidth="2" strokeLinecap="square" />
			<path d="M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4" stroke="black" strokeWidth="2" />
			<path d="M4 4L5 14H11L12 4" stroke="black" strokeWidth="2" strokeLinejoin="miter" />
			<path d="M6.5 7V11" stroke="black" strokeWidth="2" strokeLinecap="square" />
			<path d="M9.5 7V11" stroke="black" strokeWidth="2" strokeLinecap="square" />
		</svg>
	)
}

export function RenameIcon({ className }: { className?: string }) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="black" strokeWidth="2" strokeLinejoin="miter" />
			<path d="M10 4L12 6" stroke="black" strokeWidth="2" />
		</svg>
	)
}

export function CutIcon({ className }: { className?: string }) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<circle cx="4" cy="12" r="2" stroke="black" strokeWidth="2" />
			<circle cx="12" cy="12" r="2" stroke="black" strokeWidth="2" />
			<path d="M5.5 10.5L11 4" stroke="black" strokeWidth="2" strokeLinecap="square" />
			<path d="M10.5 10.5L5 4" stroke="black" strokeWidth="2" strokeLinecap="square" />
		</svg>
	)
}

export function PasteIcon({ className }: { className?: string }) {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<path d="M5 2H11V4H5V2Z" stroke="black" strokeWidth="2" strokeLinejoin="miter" />
			<path d="M3 4H13V14H3V4Z" stroke="black" strokeWidth="2" strokeLinejoin="miter" />
		</svg>
	)
}
