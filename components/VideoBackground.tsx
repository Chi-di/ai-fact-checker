export default function VideoBackground() {
  return (
    <>
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/butterflies.mp4"
      />
      <div className="absolute inset-0 bg-ink/65 z-[1]" />
    </>
  )
}
