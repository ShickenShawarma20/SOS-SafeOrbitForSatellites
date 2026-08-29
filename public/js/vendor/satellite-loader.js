/* SOS — satellite.js browser loader
 *
 * Loads satellite.js (v7, ESM) from the local bundled copy under
 * /js/vendor/satellite.js/ (sourced from node_modules/satellite.js/dist).
 * Serving locally avoids CDN tracking-prevention blocks and network
 * dependencies.  Once loaded, it is exposed on `window.Satellite` and a
 * `satellitejsready` event is dispatched so dependent modules can start.
 */
import * as Satellite from "/js/vendor/satellite.js/index.js";

window.Satellite = Satellite;
document.dispatchEvent(new CustomEvent("satellitejsready", { detail: Satellite }));
