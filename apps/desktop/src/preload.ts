/**
 * Preload — runs in an isolated context with limited Node access.
 *
 * Stage 0: nothing exposed to the renderer yet. Future stories
 * (PLANET-1481 local SDK, PLANET-1484 cloud sync) will use
 * `contextBridge.exposeInMainWorld` to surface a typed API.
 */
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('tally', {
  version: '0.1.0-rc.0',
  stage: 'PLANET-1470',
});
