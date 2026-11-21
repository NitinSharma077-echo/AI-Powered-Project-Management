// Brand mark. The source image (public/image.png) has a lot of white
// space around the figures, so it is cropped in CSS to fill the tile.
export default function Logo({ size = "md", className = "" }) {
  return (
    <span className={`logo-mark logo-${size} ${className}`}>
      <img src="/image.png" alt="MeetFlow AI logo" draggable="false" />
    </span>
  );
}
