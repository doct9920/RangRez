const announcements = [
  'Free Shipping on Orders above ₹2500',
  'Authentic Hand Block Prints',
];

export default function AnnouncementBar() {
  // The track is duplicated so the marquee can loop seamlessly.
  const track = [...announcements, ...announcements];

  return (
    <div className="bg-gray-900 text-white text-xs md:text-sm overflow-hidden">
      <div className="marquee py-2">
        <div className="marquee-track">
          {track.map((message, index) => (
            <span
              key={`${message}-${index}`}
              className="inline-flex items-center whitespace-nowrap px-6"
            >
              <span className="mr-6 text-amber-300" aria-hidden="true">
                &#9670;
              </span>
              {message}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
