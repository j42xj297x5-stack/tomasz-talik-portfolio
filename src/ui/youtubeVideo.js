const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function getConfiguredYouTubeVideo(video) {
  const videoId = String(video?.youtubeId ?? '').trim();
  if (!YOUTUBE_ID_PATTERN.test(videoId)) return null;

  const posterPath = String(video?.posterPath ?? '').trim();
  return {
    videoId,
    posterPath: posterPath || null,
    watchUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`
  };
}

export function loadYouTubeIframe(player, video, title) {
  const configuredVideo = getConfiguredYouTubeVideo(video);
  if (!player || !configuredVideo) return null;

  const iframe = document.createElement('iframe');
  iframe.src = configuredVideo.embedUrl;
  iframe.title = title;
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  player.replaceChildren(iframe);
  player.dataset.videoLoaded = 'true';
  return iframe;
}

export function releaseYouTubeIframe(player) {
  if (!player) return;
  player.querySelector('iframe')?.remove();
  delete player.dataset.videoLoaded;
}
