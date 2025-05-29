declare module 'exif-parser' {
  interface ExifParserResult {
    tags?: {
      [key: string]: any;
      ISO?: number;
      ExposureTime?: number;
      FNumber?: number;
      FocalLength?: number;
      Make?: string;
      Model?: string;
      LensModel?: string;
      DateTimeOriginal?: number;
      ShutterSpeedValue?: number;
      GPSLatitude?: number;
      GPSLongitude?: number;
      GPSAltitude?: number;
      GPSLatitudeRef?: string;
      GPSLongitudeRef?: string;
    };
    imageSize?: {
      height: number;
      width: number;
    };
    thumbnailOffset?: number;
    thumbnailLength?: number;
    thumbnailType?: number;
    app1Offset?: number;
  }

  interface ExifParser {
    parse(): ExifParserResult;
    enableBinaryFields(enable: boolean): ExifParser;
    enableImageSize(enable: boolean): ExifParser;
    enableReturnTags(enable: boolean): ExifParser;
    enableSimpleValues(enable: boolean): ExifParser;
  }

  interface ExifParserStatic {
    create(buffer: Buffer | ArrayBuffer | Uint8Array): ExifParser;
  }

  const ExifParser: ExifParserStatic;
  export = ExifParser;
}
