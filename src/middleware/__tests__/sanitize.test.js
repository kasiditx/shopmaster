const { sanitizeFileUpload } = require('../sanitize');

describe('Sanitize Middleware', () => {
  describe('sanitizeFileUpload', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        body: {},
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    it('should pass through when no files or images are present', () => {
      sanitizeFileUpload(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should pass through when images are already URLs', () => {
      req.body.images = [
        'https://example.com/image1.jpg',
        'http://example.com/image2.png',
      ];

      sanitizeFileUpload(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should validate base64 image format - JPEG', () => {
      req.body.images = [
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
      ];

      sanitizeFileUpload(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should validate base64 image format - PNG', () => {
      req.body.images = [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      ];

      sanitizeFileUpload(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid base64 image format', () => {
      req.body.images = [
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==',
      ];

      sanitizeFileUpload(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_IMAGE_FORMAT',
          message: 'Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed.',
        },
      });
    });

    it('should reject base64 images that are too large', () => {
      // Create a base64 string larger than 7MB
      const largeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(8 * 1024 * 1024);
      req.body.images = [largeBase64];

      sanitizeFileUpload(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'IMAGE_TOO_LARGE',
          message: 'Image size exceeds maximum allowed size of 5MB.',
        },
      });
    });

    it('should handle multipart file uploads - valid file', () => {
      req.file = {
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        originalname: 'test image.jpg',
      };

      sanitizeFileUpload(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.file.originalname).toBe('test_image.jpg');
    });

    it('should reject multipart file uploads - invalid mime type', () => {
      req.file = {
        mimetype: 'application/pdf',
        size: 1024 * 1024,
        originalname: 'document.pdf',
      };

      sanitizeFileUpload(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: expect.stringContaining('File type application/pdf is not allowed'),
        },
      });
    });

    it('should reject multipart file uploads - file too large', () => {
      req.file = {
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10MB
        originalname: 'large.jpg',
      };

      sanitizeFileUpload(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: expect.stringContaining('exceeds maximum allowed size'),
        },
      });
    });

    it('should sanitize filenames by removing special characters', () => {
      req.file = {
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'test@#$%^&*()image!!!.jpg',
      };

      sanitizeFileUpload(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.file.originalname).toBe('test_image_.jpg');
    });

    it('should handle multiple files in req.files', () => {
      req.files = {
        images: [
          {
            mimetype: 'image/jpeg',
            size: 1024,
            originalname: 'image1.jpg',
          },
          {
            mimetype: 'image/png',
            size: 2048,
            originalname: 'image2.png',
          },
        ],
      };

      sanitizeFileUpload(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
