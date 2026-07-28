export async function detectVrCapability({
  secureContext = globalThis.isSecureContext,
  xr = globalThis.navigator?.xr
} = {}) {
  if (!secureContext) {
    return { supported: false, reason: 'insecure-context' };
  }

  if (!xr || typeof xr.isSessionSupported !== 'function') {
    return { supported: false, reason: 'webxr-unavailable' };
  }

  try {
    const supported = await xr.isSessionSupported('immersive-vr');
    return { supported: Boolean(supported), reason: supported ? null : 'immersive-vr-unsupported' };
  } catch (error) {
    return {
      supported: false,
      reason: 'capability-check-failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
