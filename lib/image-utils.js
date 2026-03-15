/**
 * Image utility functions
 * Supports client-side image validation, base64 conversion, and metadata extraction
 */

// Supported image formats
export const SUPPORTED_IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

// Maximum file size (5MB)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Validate an image file
 * @param {File} file - Image file
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateImage(file) {
  if (!Object.keys(SUPPORTED_IMAGE_TYPES).includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported format. Supported formats: ${Object.values(SUPPORTED_IMAGE_TYPES).join(', ')}`
    };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return {
      isValid: false,
      error: `Image must be smaller than ${Math.round(MAX_IMAGE_SIZE / 1024 / 1024)}MB`
    };
  }

  return { isValid: true };
}

/**
 * Convert an image file to base64
 * @param {File} file - Image file
 * @returns {Promise<string>} base64 string (without data: prefix)
 */
export function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      // Strip the data:image/xxx;base64, prefix and return the raw base64 data
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get a base64 preview URL for an image file
 * @param {File} file - Image file
 * @returns {Promise<string>} Full data URL
 */
export function getImagePreviewUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error('Failed to generate image preview'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const dimensions = {
        width: img.width,
        height: img.height
      };
      URL.revokeObjectURL(url);
      resolve(dimensions);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image dimensions'));
    };

    img.src = url;
  });
}

/**
 * Format a file size for display
 * @param {number} bytes - Byte count
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get the file extension for a given image file
 * @param {File} file - File object
 * @returns {string} File extension
 */
export function getFileExtension(file) {
  return SUPPORTED_IMAGE_TYPES[file.type] || 'unknown';
}

/**
 * Create an image object for API calls
 * @param {File} file - Image file
 * @returns {Promise<Object>} { data: string, mimeType: string }
 */
export async function createImageObject(file) {
  const validation = validateImage(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  try {
    const [base64Data, dimensions] = await Promise.all([
      convertToBase64(file),
      getImageDimensions(file)
    ]);

    return {
      data: base64Data,
      mimeType: file.type,
      dimensions,
      size: file.size,
      name: file.name
    };
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
}

/**
 * Generate an image analysis prompt
 * @param {string} chartType - Chart type
 * @returns {string} Prompt for the image
 */
export function generateImagePrompt(chartType) {
  const chartTypeText = chartType && chartType !== 'auto'
    ? `Convert the image content into an Excalidraw diagram of type: ${getChartTypeName(chartType)}.`
    : 'Analyze the image content and choose an appropriate diagram type to convert it into an Excalidraw diagram.';

  return `${chartTypeText}

Please carefully analyze the following elements in the image:
1. Text content and labels
2. Graphical elements and structure
3. Flow or connection relationships
4. Layout and hierarchical relationships
5. Data or numerical information

Based on your analysis, create a clear and accurate Excalidraw diagram that:
- Retains all key information from the image
- Uses an appropriate diagram type to present the content
- Preserves logical relationships and structure
- Includes necessary text annotations

Convert the image content to an Excalidraw diagram.`;
}

/**
 * Get the display name for a chart type
 * @param {string} chartType - Chart type code
 * @returns {string} Chart type display name
 */
function getChartTypeName(chartType) {
  const typeNames = {
    flowchart: 'Flowchart',
    mindmap: 'Mind Map',
    orgchart: 'Org Chart',
    sequence: 'Sequence Diagram',
    class: 'UML Class Diagram',
    er: 'ER Diagram',
    gantt: 'Gantt Chart',
    timeline: 'Timeline',
    tree: 'Tree Diagram',
    network: 'Network Topology',
    architecture: 'Architecture Diagram',
    dataflow: 'Data Flow Diagram',
    state: 'State Diagram',
    swimlane: 'Swim Lane',
    concept: 'Concept Map',
    fishbone: 'Fishbone Diagram',
    swot: 'SWOT Analysis',
    pyramid: 'Pyramid Chart',
    funnel: 'Funnel Chart',
    venn: 'Venn Diagram',
    matrix: 'Matrix Chart'
  };

  return typeNames[chartType] || 'Auto';
}
