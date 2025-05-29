declare module 'exif' {
  interface ExifData {
    image?: {
      Make?: string;
      Model?: string;
      XResolution?: number;
      YResolution?: number;
      ResolutionUnit?: number;
      Software?: string;
      ModifyDate?: string;
      ExifOffset?: number;
    };
    thumbnail?: {
      Compression?: number;
      XResolution?: number;
      YResolution?: number;
      ResolutionUnit?: number;
      JPEGInterchangeFormat?: number;
      JPEGInterchangeFormatLength?: number;
    };
    exif?: {
      ExposureTime?: number;
      FNumber?: number;
      ExposureProgram?: number;
      ISO?: number;
      ExifVersion?: Buffer;
      DateTimeOriginal?: string;
      DateTimeDigitized?: string;
      ComponentsConfiguration?: Buffer;
      CompressedBitsPerPixel?: number;
      ShutterSpeedValue?: number;
      ApertureValue?: number;
      ExposureBias?: number;
      MaxApertureValue?: number;
      MeteringMode?: number;
      LightSource?: number;
      Flash?: number;
      FocalLength?: number;
      SubSecTime?: string;
      SubSecTimeOriginal?: string;
      SubSecTimeDigitized?: string;
      FlashpixVersion?: Buffer;
      ColorSpace?: number;
      PixelXDimension?: number;
      PixelYDimension?: number;
      InteroperabilityOffset?: number;
      SensingMethod?: number;
      FileSource?: Buffer;
      SceneType?: Buffer;
      CVAPattern?: Buffer;
      CustomRendered?: number;
      ExposureMode?: number;
      WhiteBalance?: number;
      DigitalZoomRatio?: number;
      FocalLengthIn35mmFilm?: number;
      SceneCaptureType?: number;
      GainControl?: number;
      Contrast?: number;
      Saturation?: number;
      Sharpness?: number;
      SubjectDistanceRange?: number;
      LensModel?: string;
    };
    gps?: {
      GPSVersionID?: Buffer;
      GPSLatitudeRef?: string;
      GPSLatitude?: number[];
      GPSLongitudeRef?: string;
      GPSLongitude?: number[];
      GPSAltitudeRef?: number;
      GPSAltitude?: number;
      GPSTimeStamp?: number[];
      GPSSatellites?: string;
      GPSStatus?: string;
      GPSMeasureMode?: string;
      GPSDOP?: number;
      GPSSpeedRef?: string;
      GPSSpeed?: number;
      GPSTrackRef?: string;
      GPSTrack?: number;
      GPSImgDirectionRef?: string;
      GPSImgDirection?: number;
      GPSMapDatum?: string;
      GPSDestLatitudeRef?: string;
      GPSDestLatitude?: number[];
      GPSDestLongitudeRef?: string;
      GPSDestLongitude?: number[];
      GPSDestBearingRef?: string;
      GPSDestBearing?: number;
      GPSDestDistanceRef?: string;
      GPSDestDistance?: number;
      GPSProcessingMethod?: Buffer;
      GPSAreaInformation?: Buffer;
      GPSDateStamp?: string;
      GPSDifferential?: number;
    };
    interoperability?: {
      InteroperabilityIndex?: string;
    };
  }
  interface ExifError {
    code: string;
    message: string;
  }

  class ExifImage {
    constructor(buffer: Buffer, callback: (error: ExifError | null, exifData?: ExifData) => void);
  }

  export = ExifImage;
}
