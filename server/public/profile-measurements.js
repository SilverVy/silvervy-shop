(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.SilverVyMeasurements = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const keys = ['chestCm', 'waistCm', 'hipCm', 'heightCm', 'inseamCm', 'shoulderCm', 'armLengthCm', 'handLengthCm'];
    function mergeProfile(current, profile, edited = new Set()) {
        const merged = { ...current };
        for (const key of keys) {
            const value = profile?.[key];
            if (!edited.has(key) && value !== '' && value != null && Number.isFinite(Number(value))) merged[key] = String(value);
        }
        return merged;
    }
    return { keys, mergeProfile };
});
