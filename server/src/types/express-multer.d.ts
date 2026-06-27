declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    }
  }
}

declare module 'multer' {
  interface StorageEngine {
    _handleFile(
      req: unknown,
      file: Express.Multer.File,
      callback: (error?: Error | null, info?: Partial<Express.Multer.File>) => void,
    ): void;
    _removeFile(req: unknown, file: Express.Multer.File, callback: (error: Error | null) => void): void;
  }

  interface Options {
    storage?: StorageEngine;
    limits?: { fileSize?: number };
  }

  function memoryStorage(): StorageEngine;

  function multer(options?: Options): {
    single(fieldname: string): unknown;
  };

  export { memoryStorage, multer };
  export default multer;
}
