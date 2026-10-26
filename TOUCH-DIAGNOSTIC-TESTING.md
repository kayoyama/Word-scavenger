# Word Scavenger Touch Diagnostic Build

Build: v3.06-touch-diagnostic (based on Word Scavenger v3.06).

## Purpose
This temporary build records the actual browser pointer samples for ordinary letter-selection gestures and draws those samples as a separate red trail. It does not change tile-selection or trajectory-resolution behavior. The red path is independent of the existing selection trail.

## How to test
1. Extract the ZIP and open `index.html` through your normal local server (for example VS Code Live Server).
2. Start a round. Perform several gestures: one slow horizontal drag, one slow diagonal drag, one fast drag across multiple tiles, and one drag where the selected letters seem wrong. Lift your finger after each gesture.
3. The red raw-pointer trail remains visible for about two seconds after release. A red circle marks the start; a white circle with red outline marks the end.
4. Pause the game and choose **Download Touch Diagnostics**. The browser downloads a JSON file named `word-scavenger-touch-diagnostics-....json`. On Android, check the browser's Downloads folder.
5. Upload that JSON file in the chat. If possible, also tell us which gesture number felt wrong and what letters you intended to select.

## Data captured
Each ordinary selection gesture records raw pointerdown/move/up or cancel events, event timestamps, CSS-pixel coordinates, board-relative coordinates, pointer type, pointer ID, pressure, viewport/screen dimensions, and the selected tile indices at each sample. The red path uses only raw coordinate samples; selected tile indices are included separately for comparison. Up to 100 recent gestures are retained in memory and exported only when you press the download button.

The JSON also includes browser user-agent information for diagnosing device/browser differences. It does not record names, account details, or game statistics.

## Limitations
- This build records pointer events delivered by the browser; it cannot recover physical finger movement that the browser never reports.
- The red line connects recorded samples for visibility; use the sample timestamps and coordinates to identify sparse event delivery.
- Automated tests and syntax checks do not replace real Android touchscreen testing.
