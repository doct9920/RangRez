
const announcements = [
  'DISCOVER YOUR SIGNATURE STYLE',
  'ELEGANCE IN EVERY DETAIL',
  'YOUR STYLE, YOUR STORY',
];

export default function AnnouncementBar() {
  // Duplicate messages for a seamless scrolling loop.
  const track = [...announcements, ...announcements];

  return (
    <div className="bg-gray-900 text-white text-xs md:text-sm overflow-hidden">
      {/* Static top line */}
      <div className="py-2 text-center">
        <span className="text-amber-300 mr-2" aria-hidden="true">
          &#9670;
        </span>
        <span className="text-amber-300 font-medium tracking-wide">
          RANGREZ
        </span>
        <span className="mx-2 text-amber-300" aria-hidden="true">
          ✦
        </span>
        <span>STYLE THAT TELLS A STORY</span>
        <span className="text-amber-300 ml-2" aria-hidden="true">
          &#9670;
        </span>
      </div>

      {/* Only this bottom line scrolls */}
      <div className="marquee py-2 border-t border-gray-700">
        <div className="marquee-track">
          {track.map((message, index) => (
            <span
              key={`${message}-${index}`}
              className="inline-flex items-center whitespace-nowrap px-6"
            >
              <span className="mr-3 text-amber-300" aria-hidden="true">
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
