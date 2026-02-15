interface MusicNoteProps {
	size?: number;
	color?: string;
	className?: string;
}

const MusicNote = ({
	size = 32,
	className = "",
	color = "currentColor",
}: MusicNoteProps) => {
	return (
		<svg
			width={size}
			height={size}
			className={className}
			fill="none"
			stroke={color}
			viewBox="0 0 24 24"
			role="img"
			aria-label="Musical note placeholder"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={0.5}
				d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
			/>
		</svg>
	);
};

export default MusicNote;
