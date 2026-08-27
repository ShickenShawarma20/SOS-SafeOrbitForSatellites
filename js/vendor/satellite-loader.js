/* SOS — satellite.js browser loader
 *
 * satellite.js v7 is published as ESM-only.  This tiny module script imports it
 * from the esm.sh CDN and exposes it on `window.Satellite` so the rest of the
 * classic-script codebase (IIFE globals) can consume it without a bundler.
 *
 * Once `window.Satellite` is set, a `satellitjsready` event is dispatched on
 * `document` so dependent modules can start propagating.
 */
import * as Satellite from "https://esm.sh/satellite.js@7.1.0";

window.Satellite = Satellite;
document.dispatchEvent(new CustomEvent("satellitejsready", { detail: Satellite }));
