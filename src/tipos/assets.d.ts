// Metro convierte cada imagen o fuente importada en un identificador numérico de asset
declare module '*.png' {
  const asset: number;
  export default asset;
}

declare module '*.ttf' {
  const asset: number;
  export default asset;
}
