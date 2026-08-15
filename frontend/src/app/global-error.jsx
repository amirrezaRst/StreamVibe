"use client";

import { useEffect } from "react";

/**
 * The last resort. This only renders when the root layout itself threw, which
 * means it replaces the entire document — so it ships its own <html> and
 * <body>, and cannot use anything the layout would have brought with it.
 *
 * That includes globals.css, the Tailwind build and the Manrope font, so every
 * rule here is inline and the type falls back through the system stack. It is
 * deliberately the plainest of the three pages: the more this one depends on,
 * the more ways it has to fail, and there is nothing behind it.
 */

const shell = {
    margin: 0,
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background: "#0F0F0F",
    color: "#E4E4E7",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    WebkitFontSmoothing: "antialiased",
};

const card = {
    width: "100%",
    maxWidth: "560px",
    textAlign: "center",
    border: "1px solid #262626",
    borderRadius: "20px",
    padding: "56px 28px",
    background: "radial-gradient(120% 90% at 50% 40%, #16181c 0%, #0d0e10 55%, #08090a 100%)",
};

const frame = {
    width: "104px",
    height: "117px",
    margin: "0 auto 30px",
    borderRadius: "3px",
    border: "1px dashed rgba(255,255,255,0.17)",
    background: "#050506",
    display: "grid",
    placeItems: "center",
    fontSize: "30px",
    fontWeight: 800,
    letterSpacing: "-0.04em",
    color: "#F7F7F8",
};

const heading = {
    margin: "0 0 12px",
    fontSize: "30px",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    color: "#F7F7F8",
};

const copy = {
    margin: "0 auto 26px",
    maxWidth: "44ch",
    fontSize: "15px",
    lineHeight: 1.6,
    color: "#999999",
};

const button = {
    display: "inline-block",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "14.5px",
    fontWeight: 600,
    background: "#E50000",
    color: "#ffffff",
    cursor: "pointer",
    fontFamily: "inherit",
};

const GlobalError = ({ error, reset }) => {
    useEffect(() => {
        console.error("Root layout error:", error?.digest ?? error);
    }, [error]);

    return (
        <html lang="en">
            <body style={shell}>
                <div style={card}>
                    <div style={frame} aria-hidden="true">500</div>
                    <h1 style={heading}>Reel Damaged</h1>
                    <p style={copy}>
                        StreamVibe failed to start up on this request. Reloading usually
                        clears it.
                    </p>
                    <button type="button" onClick={reset} style={button}>Try Again</button>
                </div>
            </body>
        </html>
    );
};

export default GlobalError;
