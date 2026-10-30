/** Safari iOS exposes neither HealthKit nor the Apple Watch. No universal step API: mode disabled. */
export const stepsStatus={available:false,reason:"Les pas ne sont pas lisibles depuis Safari (pas d'accès à Apple Santé ni à l'Apple Watch). Utilisez le GPS ou le mode durée."};
export const stepsDistanceKm=(steps:number,strideM:number)=>steps*strideM/1000;
