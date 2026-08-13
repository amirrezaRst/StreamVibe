"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
    Forward10Icon, FullscreenExitIcon, FullscreenIcon, MutedIcon, PauseSvg,
    PlaySvg, QualityGearIcon, Replay10Icon, VolumeIcon,
} from "@/assets/Svgs";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { isQualityWithinPlan, QUALITY_LADDER } from "@/constants/PlanAccess";

const IDLE_MS = 2600;

//! `qualities[].url` is stored as a bare filename (the download endpoint on
//! the backend resolves it straight off disk, so it never needed a host) —
//! but a <video src> is a browser request, not a server-side file read, so
//! it needs the backend's public host in front of it the same way poster/
//! trailer URLs already get. `src` itself is left alone: it already arrives
//! either fully-qualified (trailer playback) or as a Next.js /public path
//! (the placeholder clip), neither of which should be touched here.
const resolveQualityUrl = (url) => (url ? `${process.env.NEXT_PUBLIC_IMAGE_URL}/${url}` : url);

const fmt = (seconds) => {
    if (!isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
};

const spoken = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m ? `${m} minute${m === 1 ? "" : "s"} ` : ""}${s} second${s === 1 ? "" : "s"}`;
};

/**
 * StreamVibe's own chrome over a native <video> — replaces the browser
 * default bar the whole catalogue used to play through.
 *
 * `qualities`, when given, is the title's real `files` array
 * ([{quality, url}, ...]). Entries above `maxQuality` — the plan ceiling
 * already resolved server-side into `entitlement.capabilities` — render
 * locked rather than hidden, the same way the download rows do. When no
 * qualities are given (true for the whole catalogue today, since no title
 * has more than the one placeholder source yet) the quality button doesn't
 * render at all: there is nothing real to switch between.
 */
const StreamVibePlayer = ({ src, poster, qualities, maxQuality, title, autoPlay = false }) => {
    const reducedMotion = usePrefersReducedMotion();
    const playerRef = useRef(null);
    const videoRef = useRef(null);
    const scrubRef = useRef(null);
    const idleTimer = useRef(null);
    const scrubbingRef = useRef(false);

    const [playing, setPlaying] = useState(false);
    const [buffering, setBuffering] = useState(false);
    const [idle, setIdle] = useState(false);
    const [current, setCurrent] = useState(0);
    const [duration, setDuration] = useState(0);
    const [bufferedPct, setBufferedPct] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [scrubbing, setScrubbing] = useState(false);
    const [preview, setPreview] = useState(null); // { pct, time } | null
    const [fullscreen, setFullscreen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeQuality, setActiveQuality] = useState(qualities?.[0]?.quality ?? null);
    const [activeSrc, setActiveSrc] = useState(() => {
        const initial = qualities?.find((q) => q.quality === (qualities?.[0]?.quality ?? null));
        return initial ? resolveQualityUrl(initial.url) : src;
    });

    const playedPct = duration ? (current / duration) * 100 : 0;

    //! chrome stays open while paused (a paused player is being read, not
    //! watched) and hides itself a couple of seconds after the pointer
    //! settles while playing — any movement or focus brings it straight back
    const wake = useCallback(() => {
        setIdle(false);
        clearTimeout(idleTimer.current);
        if (playing) idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
    }, [playing]);

    useEffect(() => { wake(); }, [playing, wake]);
    useEffect(() => () => clearTimeout(idleTimer.current), []);

    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        video.paused ? video.play() : video.pause();
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        //! the big play button unmounts the instant playback starts (it's
        //! conditional on !playing) — losing a focused element resets focus to
        //! <body>, not to its parent, so without this, every keyboard shortcut
        //! goes dead the moment someone presses play by clicking that button
        const onPlay = () => { setPlaying(true); playerRef.current?.focus(); };
        const onPause = () => setPlaying(false);
        const onWaiting = () => setBuffering(true);
        const onPlaying = () => setBuffering(false);
        const onCanPlay = () => setBuffering(false);
        const onLoadedMeta = () => setDuration(video.duration);
        const onTimeUpdate = () => { if (!scrubbingRef.current) setCurrent(video.currentTime); };
        const onProgress = () => {
            if (!video.buffered.length || !video.duration) return;
            setBufferedPct((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
        };
        const onVolumeChange = () => { setVolume(video.volume); setMuted(video.muted); };

        video.addEventListener("play", onPlay);
        video.addEventListener("pause", onPause);
        video.addEventListener("waiting", onWaiting);
        video.addEventListener("playing", onPlaying);
        video.addEventListener("canplay", onCanPlay);
        video.addEventListener("loadedmetadata", onLoadedMeta);
        video.addEventListener("timeupdate", onTimeUpdate);
        video.addEventListener("progress", onProgress);
        video.addEventListener("volumechange", onVolumeChange);
        return () => {
            video.removeEventListener("play", onPlay);
            video.removeEventListener("pause", onPause);
            video.removeEventListener("waiting", onWaiting);
            video.removeEventListener("playing", onPlaying);
            video.removeEventListener("canplay", onCanPlay);
            video.removeEventListener("loadedmetadata", onLoadedMeta);
            video.removeEventListener("timeupdate", onTimeUpdate);
            video.removeEventListener("progress", onProgress);
            video.removeEventListener("volumechange", onVolumeChange);
        };
    }, [activeSrc]);

    useEffect(() => {
        const onFsChange = () => setFullscreen(document.fullscreenElement === playerRef.current);
        document.addEventListener("fullscreenchange", onFsChange);
        return () => document.removeEventListener("fullscreenchange", onFsChange);
    }, []);

    const seekBy = (delta) => {
        const video = videoRef.current;
        if (!video || !video.duration) return;
        video.currentTime = Math.min(Math.max(video.currentTime + delta, 0), video.duration);
    };

    const seekToRatio = (ratio) => {
        const video = videoRef.current;
        if (!video || !video.duration) return;
        const time = Math.min(Math.max(ratio, 0), 1) * video.duration;
        video.currentTime = time;
        setCurrent(time);
    };

    const ratioFromEvent = (e) => {
        const rect = scrubRef.current.getBoundingClientRect();
        return (e.clientX - rect.left) / rect.width;
    };

    const onScrubPointerDown = (e) => {
        scrubbingRef.current = true;
        setScrubbing(true);
        scrubRef.current.setPointerCapture(e.pointerId);
        seekToRatio(ratioFromEvent(e));
    };
    const onScrubPointerMove = (e) => {
        const ratio = ratioFromEvent(e);
        setPreview({ pct: Math.min(Math.max(ratio, 0), 1) * 100, time: ratio * (duration || 0) });
        if (scrubbingRef.current) seekToRatio(ratio);
    };
    const endScrub = () => { scrubbingRef.current = false; setScrubbing(false); };

    const toggleMute = () => { videoRef.current.muted = !videoRef.current.muted; };
    const changeVolume = (v) => {
        const video = videoRef.current;
        video.volume = v;
        video.muted = v === 0;
    };

    const toggleFullscreen = () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else playerRef.current?.requestFullscreen?.();
    };

    //! switching quality swaps the source but keeps the moment and the
    //! play state the viewer was in — a quality change should feel like a
    //! setting, not a restart
    const selectQuality = (q) => {
        if (!isQualityWithinPlan(q.quality, maxQuality)) return;
        const video = videoRef.current;
        const resumeAt = video.currentTime;
        const wasPlaying = playing;
        setActiveQuality(q.quality);
        setActiveSrc(resolveQualityUrl(q.url));
        setMenuOpen(false);
        requestAnimationFrame(() => {
            video.currentTime = resumeAt;
            if (wasPlaying) video.play();
        });
    };

    const onKeyDown = (e) => {
        if (e.target === scrubRef.current) return;
        const k = e.key.toLowerCase();
        if (e.key === " " || k === "k") { e.preventDefault(); togglePlay(); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); seekBy(-10); }
        else if (e.key === "ArrowRight") { e.preventDefault(); seekBy(10); }
        else if (e.key === "ArrowUp") { e.preventDefault(); changeVolume(Math.min(1, (videoRef.current.muted ? 0 : volume) + 0.05)); }
        else if (e.key === "ArrowDown") { e.preventDefault(); changeVolume(Math.max(0, (videoRef.current.muted ? 0 : volume) - 0.05)); }
        else if (k === "m") toggleMute();
        else if (k === "f") toggleFullscreen();
        else if (e.key === "Escape") setMenuOpen(false);
        wake();
    };

    const onScrubKeyDown = (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); seekBy(-10); }
        if (e.key === "ArrowRight") { e.preventDefault(); seekBy(10); }
    };

    const spin = !reducedMotion;

    return (
        <div
            ref={playerRef}
            tabIndex={0}
            role="region"
            aria-label={title ? `Video player: ${title}` : "Video player"}
            onKeyDown={onKeyDown}
            onPointerMove={wake}
            onPointerLeave={() => { if (playing) setIdle(true); }}
            onClick={(e) => {
                //! a click anywhere in the player — the video, a control that
                //! doesn't handle its own focus, or empty chrome space — should
                //! leave keyboard control here, the same way clicking anywhere
                //! in a native <video> element would
                playerRef.current?.focus();
                if (e.target === videoRef.current) togglePlay();
            }}
            className={`group/player relative w-full h-full bg-black select-none outline-none
                focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white
                ${idle && playing ? "cursor-none" : ""}`}
        >
            <video
                ref={videoRef}
                src={activeSrc}
                poster={poster}
                autoPlay={autoPlay}
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
            />

            {/* top scrim + watermark */}
            <div
                className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 to-transparent pointer-events-none
                    duration-300 ${idle && playing ? "opacity-0" : "opacity-100"}`}
                aria-hidden="true"
            />
            <div
                className={`absolute top-4 right-4 z-10 opacity-80 pointer-events-none duration-300
                    ${idle && playing ? "opacity-0" : "opacity-80"}`}
                aria-hidden="true"
            >
                <img
                    src="/images/logo-white.png"
                    alt=""
                    className="h-4 w-auto"
                    style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,.6))" }}
                />
            </div>

            {/* centre stage: big play / buffering mark */}
            <div className="absolute inset-0 z-[6] grid place-items-center pointer-events-none">
                {buffering ? (
                    <img
                        src="/images/logo-vector.png"
                        alt=""
                        aria-hidden="true"
                        className={`w-11 h-11 ${spin ? "animate-sv-spin" : ""}`}
                        style={{ filter: "drop-shadow(0 2px 10px rgba(0,0,0,.7))" }}
                    />
                ) : !playing ? (
                    <button
                        type="button"
                        onClick={togglePlay}
                        aria-label="Play"
                        className="pointer-events-auto w-[76px] h-[76px] rounded-full border border-white/20
                            bg-black/45 backdrop-blur-sm grid place-items-center text-white
                            duration-200 hover:scale-105 hover:bg-c-red-45 hover:border-transparent
                            focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                    >
                        <PlaySvg className="w-7 h-7 ml-1" />
                    </button>
                ) : null}
            </div>

            {/* bottom chrome */}
            <div
                className={`absolute inset-x-0 bottom-0 z-10 px-3 pb-2.5 pt-11 duration-300
                    bg-gradient-to-t from-black/90 via-black/55 via-[55%] to-transparent
                    ${idle && playing ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
                {/* scrubber */}
                <div
                    ref={scrubRef}
                    role="slider"
                    tabIndex={0}
                    aria-label="Seek"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(playedPct)}
                    aria-valuetext={spoken(current)}
                    onPointerDown={onScrubPointerDown}
                    onPointerMove={onScrubPointerMove}
                    onPointerUp={endScrub}
                    onPointerCancel={endScrub}
                    onMouseLeave={() => setPreview(null)}
                    onKeyDown={onScrubKeyDown}
                    className="group/scrub relative h-4 flex items-center cursor-pointer outline-none"
                >
                    <div className={`relative w-full rounded-full bg-white/25 duration-150
                        ${scrubbing ? "h-[5px]" : "h-[3px] group-hover/scrub:h-[5px] group-focus-visible/scrub:h-[5px]"}`}>
                        <div className="absolute inset-y-0 left-0 rounded-full bg-white/40" style={{ width: `${bufferedPct}%` }} />
                        <div className="absolute inset-y-0 left-0 rounded-full bg-c-red-45" style={{ width: `${playedPct}%` }} />
                        <div
                            className={`absolute top-1/2 w-3 h-3 rounded-full bg-white shadow-[0_1px_5px_rgba(0,0,0,.6)]
                                duration-150 ${scrubbing ? "scale-100" : "scale-0 group-hover/scrub:scale-100 group-focus-visible/scrub:scale-100"}`}
                            style={{ left: `${playedPct}%`, transform: "translate(-50%,-50%)" }}
                        />
                    </div>
                    {preview && (
                        <div
                            className="absolute bottom-5 -translate-x-1/2 bg-black/95 border border-c-black-20 text-white
                                text-[11px] font-bold py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap tabular-nums"
                            style={{ left: `${preview.pct}%` }}
                        >
                            {fmt(preview.time)}
                        </div>
                    )}
                </div>

                {/* button row */}
                <div className="flex items-center gap-1 mt-1">
                    <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}
                        className="p-1.5 rounded text-white hover:bg-white/15 active:scale-90 duration-150
                            focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                        {playing ? <PauseSvg className="w-[19px] h-[19px]" /> : <PlaySvg className="w-[17px] h-[17px]" />}
                    </button>

                    <button type="button" onClick={() => seekBy(-10)} aria-label="Back 10 seconds"
                        className="p-1.5 rounded text-white hover:bg-white/15 active:scale-90 duration-150
                            focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                        <Replay10Icon className="w-[19px] h-[19px]" />
                    </button>
                    <button type="button" onClick={() => seekBy(10)} aria-label="Forward 10 seconds"
                        className="p-1.5 rounded text-white hover:bg-white/15 active:scale-90 duration-150
                            focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                        <Forward10Icon className="w-[19px] h-[19px]" />
                    </button>

                    {/* volume: slider expands on hover/focus so the resting bar stays uncluttered */}
                    <div className="group/vol flex items-center">
                        <button type="button" onClick={toggleMute} aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
                            className="p-1.5 rounded text-white hover:bg-white/15 active:scale-90 duration-150
                                focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                            {muted || volume === 0
                                ? <MutedIcon className="w-[19px] h-[19px]" />
                                : <VolumeIcon className="w-[19px] h-[19px]" />}
                        </button>
                        <div className="w-0 group-hover/vol:w-[68px] group-focus-within/vol:w-[68px] overflow-hidden
                            duration-200 flex items-center">
                            <input
                                type="range" min={0} max={1} step={0.05}
                                value={muted ? 0 : volume}
                                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                                aria-label="Volume"
                                className="w-[68px] accent-c-red-45 cursor-pointer"
                            />
                        </div>
                    </div>

                    <span className="text-[12.5px] font-semibold text-white/65 tabular-nums ml-1.5 whitespace-nowrap">
                        <b className="text-white font-bold">{fmt(current)}</b> / {fmt(duration)}
                    </span>

                    <span className="flex-1" />

                    {qualities?.length > 0 && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setMenuOpen((o) => !o)}
                                aria-haspopup="true"
                                aria-expanded={menuOpen}
                                aria-label="Quality settings"
                                className="p-1.5 rounded text-white hover:bg-white/15 active:scale-90 duration-150
                                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                            >
                                <QualityGearIcon className="w-[19px] h-[19px]" />
                            </button>

                            {menuOpen && (
                                <div
                                    role="menu"
                                    aria-label="Quality"
                                    className="absolute bottom-[calc(100%+10px)] right-0 min-w-[176px] bg-[#0e0e0e]/[.97]
                                        border border-c-black-20 rounded-[10px] p-1.5 shadow-[0_18px_40px_-14px_rgba(0,0,0,.9)]"
                                >
                                    <div className="text-[9.5px] font-extrabold tracking-[.15em] uppercase text-c-grey-60
                                        px-2 pt-1 pb-1.5 mb-1 border-b border-c-black-15">
                                        Quality
                                    </div>
                                    {QUALITY_LADDER.filter((q) => qualities.some((f) => f.quality === q)).reverse().map((q) => {
                                        const locked = !isQualityWithinPlan(q, maxQuality);
                                        const file = qualities.find((f) => f.quality === q);
                                        return (
                                            <button
                                                key={q}
                                                type="button"
                                                role="menuitem"
                                                disabled={locked}
                                                aria-disabled={locked}
                                                onClick={() => selectQuality(file)}
                                                className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md text-[12.5px] font-semibold
                                                    ${locked ? "text-c-grey-55 cursor-not-allowed" : "text-c-grey-97 hover:bg-white/10"}`}
                                            >
                                                <span className="w-3.5 text-c-red-60">
                                                    {q === activeQuality && (
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}
                                                            strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </span>
                                                {q}
                                                {locked && (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                                                        strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 ml-auto text-[#E8B663]">
                                                        <rect x="4" y="10.5" width="16" height="10.5" rx="2" />
                                                        <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
                                                    </svg>
                                                )}
                                            </button>
                                        );
                                    })}
                                    {maxQuality !== "4K" && (
                                        <div className="border-t border-c-black-15 mt-1.5 pt-2 px-2 pb-1 text-[11px] text-c-grey-60 leading-relaxed">
                                            Higher qualities are included in Premium.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit full screen" : "Full screen"}
                        className="p-1.5 rounded text-white hover:bg-white/15 active:scale-90 duration-150
                            focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                        {fullscreen ? <FullscreenExitIcon className="w-[19px] h-[19px]" /> : <FullscreenIcon className="w-[19px] h-[19px]" />}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default StreamVibePlayer;
