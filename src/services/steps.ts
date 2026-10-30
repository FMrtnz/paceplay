/** Safari iOS n'expose ni HealthKit ni l'Apple Watch. Aucune API de pas universelle : mode désactivé. */
export const stepsStatus={available:false,reason:"Les pas ne sont pas lisibles depuis Safari (pas d'accès à Apple Santé ni à l'Apple Watch). Utilisez le GPS ou le mode durée."};
export const stepsDistanceKm=(steps:number,strideM:number)=>steps*strideM/1000;
