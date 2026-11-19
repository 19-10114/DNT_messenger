declare module 'docxtemplater-image-module-free' {
  export default class ImageModule {
    constructor(options: {
      centered?: boolean;
      getImage(value: string): Promise<ArrayBuffer>;
      getSize(value: string): [number, number];
    });
  }
}
