export function CampaignImageGrid({ urls }: { urls: string[] }) {
  if (!urls || urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <div className="mb-2 max-w-full rounded-lg overflow-hidden border border-slate-100/10 bg-slate-50/5 shadow-inner">
        <a href={urls[0]} target="_blank" rel="noopener noreferrer">
          <img
            src={urls[0]}
            alt="Hình ảnh tin nhắn"
            className="max-h-[260px] max-w-full object-contain mx-auto hover:opacity-95 transition duration-200 cursor-zoom-in"
          />
        </a>
      </div>
    );
  }

  if (urls.length === 2) {
    return (
      <div className="mb-2 grid grid-cols-2 gap-1 max-w-[360px] rounded-lg overflow-hidden border border-slate-100/10 shadow-inner">
        {urls.map((url, index) => (
          <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-square bg-slate-50/5">
            <img src={url} alt={`Hình ảnh ${index + 1}`} className="h-full w-full object-cover hover:opacity-95 transition duration-200 cursor-zoom-in" />
          </a>
        ))}
      </div>
    );
  }

  if (urls.length === 3) {
    return (
      <div className="mb-2 grid grid-cols-3 gap-1 max-w-[380px] rounded-lg overflow-hidden border border-slate-100/10 shadow-inner">
        <a href={urls[0]} target="_blank" rel="noopener noreferrer" className="col-span-2 aspect-[4/3] bg-slate-50/5">
          <img src={urls[0]} alt="Hình ảnh 1" className="h-full w-full object-cover hover:opacity-95 transition duration-200 cursor-zoom-in" />
        </a>
        <div className="flex flex-col gap-1 col-span-1">
          {urls.slice(1).map((url, index) => (
            <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="relative flex-1 aspect-square bg-slate-50/5">
              <img src={url} alt={`Hình ảnh ${index + 2}`} className="absolute inset-0 h-full w-full object-cover hover:opacity-95 transition duration-200 cursor-zoom-in" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  const displayUrls = urls.slice(0, 4);
  const remainingCount = urls.length - 4;

  return (
    <div className="mb-2 grid grid-cols-2 gap-1 max-w-[380px] rounded-lg overflow-hidden border border-slate-100/10 shadow-inner">
      {displayUrls.map((url, index) => {
        const isLast = index === 3 && remainingCount > 0;
        return (
          <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-square bg-slate-50/5">
            <img src={url} alt={`Hình ảnh ${index + 1}`} className="h-full w-full object-cover hover:opacity-95 transition duration-200 cursor-zoom-in" />
            {isLast && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                <span className="text-white text-base font-black">+{remainingCount}</span>
              </div>
            )}
          </a>
        );
      })}
    </div>
  );
}
