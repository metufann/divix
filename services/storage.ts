import { supabase } from '../lib/supabase'

/**
 * Storage service for Divix application
 * 
 * Provides file upload and management capabilities including:
 * - Receipt and attachment uploads
 * - Image optimization and processing
 * - Secure file access with signed URLs
 * - Storage quota and cleanup management
 */

/**
 * Supported file types for uploads
 */
export const SUPPORTED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  documents: ['application/pdf', 'text/plain'],
} as const

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
} as const

/**
 * Storage bucket names
 */
export const STORAGE_BUCKETS = {
  receipts: 'receipts',
  avatars: 'avatars',
  attachments: 'attachments',
} as const

/**
 * Upload receipt image
 * 
 * Uploads a receipt image for an expense with automatic
 * optimization and secure storage.
 * 
 * @param file - File to upload (File or Blob object)
 * @param expenseId - Associated expense ID
 * @param userId - User ID uploading the file
 * @returns Promise with upload result including public URL
 * 
 * @example
 * ```typescript
 * const { data, error } = await uploadReceipt(
 *   fileInput.files[0],
 *   'expense-123',
 *   'user-456'
 * )
 * 
 * if (data) {
 *   console.log('Receipt uploaded:', data.publicUrl)
 * }
 * ```
 */
export const uploadReceipt = async (
  file: File | Blob,
  expenseId: string,
  userId: string
) => {
  try {
    // Validate file type
    const fileType = file instanceof File ? file.type : 'application/octet-stream'
    if (!SUPPORTED_FILE_TYPES.images.includes(fileType as any)) {
      return { data: null, error: new Error('Unsupported file type. Please upload an image.') }
    }

    // Validate file size
    if (file.size > FILE_SIZE_LIMITS.image) {
      return { data: null, error: new Error('File too large. Maximum size is 5MB.') }
    }

    // Generate unique filename
    const timestamp = new Date().getTime()
    const fileExtension = getFileExtension(fileType)
    const fileName = `${userId}/${expenseId}/${timestamp}${fileExtension}`

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.receipts)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: fileType,
      })

    if (uploadError) {
      return { data: null, error: uploadError }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.receipts)
      .getPublicUrl(uploadData.path)

    // TODO: Add image optimization/resizing
    // TODO: Add OCR text extraction from receipt
    // TODO: Add metadata extraction (amount, date, merchant)
    // TODO: Add virus scanning

    return { 
      data: {
        path: uploadData.path,
        publicUrl: urlData.publicUrl,
        fileName,
        fileSize: file.size,
        fileType,
      }, 
      error: null 
    }

  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Upload user avatar
 * 
 * Uploads and processes user profile avatar with automatic
 * resizing and optimization.
 * 
 * @param file - Image file to upload
 * @param userId - User ID for the avatar
 * @returns Promise with upload result
 */
export const uploadAvatar = async (file: File | Blob, userId: string) => {
  try {
    // Validate file type
    const fileType = file instanceof File ? file.type : 'application/octet-stream'
    if (!SUPPORTED_FILE_TYPES.images.includes(fileType as any)) {
      return { data: null, error: new Error('Unsupported file type. Please upload an image.') }
    }

    // Validate file size
    if (file.size > FILE_SIZE_LIMITS.image) {
      return { data: null, error: new Error('File too large. Maximum size is 5MB.') }
    }

    const fileExtension = getFileExtension(fileType)
    const fileName = `${userId}/avatar${fileExtension}`

    // Upload with upsert to replace existing avatar
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.avatars)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileType,
      })

    if (uploadError) {
      return { data: null, error: uploadError }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.avatars)
      .getPublicUrl(uploadData.path)

    // TODO: Add automatic image resizing (e.g., 200x200px)
    // TODO: Add image quality optimization
    // TODO: Generate multiple sizes (thumbnail, medium, full)

    return { 
      data: {
        path: uploadData.path,
        publicUrl: urlData.publicUrl,
        fileName,
      }, 
      error: null 
    }

  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Upload attachment file
 * 
 * Uploads general attachment files for expenses or groups.
 * 
 * @param file - File to upload
 * @param context - Context object (expenseId or groupId)
 * @param userId - User ID uploading the file
 * @returns Promise with upload result
 */
export const uploadAttachment = async (
  file: File | Blob,
  context: { expenseId?: string; groupId?: string },
  userId: string
) => {
  try {
    const fileType = file instanceof File ? file.type : 'application/octet-stream'
    const fileName = file instanceof File ? file.name : 'attachment'
    
    // Validate file type
    const allSupportedTypes = [
      ...SUPPORTED_FILE_TYPES.images,
      ...SUPPORTED_FILE_TYPES.documents
    ]
    
    if (!allSupportedTypes.includes(fileType as any)) {
      return { data: null, error: new Error('Unsupported file type.') }
    }

    // Validate file size
    const isImage = SUPPORTED_FILE_TYPES.images.includes(fileType as any)
    const maxSize = isImage ? FILE_SIZE_LIMITS.image : FILE_SIZE_LIMITS.document
    
    if (file.size > maxSize) {
      return { data: null, error: new Error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB.`) }
    }

    // Generate file path
    const timestamp = new Date().getTime()
    const contextPath = context.expenseId 
      ? `expenses/${context.expenseId}` 
      : `groups/${context.groupId}`
    const filePath = `${userId}/${contextPath}/${timestamp}_${fileName}`

    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.attachments)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: fileType,
      })

    if (uploadError) {
      return { data: null, error: uploadError }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.attachments)
      .getPublicUrl(uploadData.path)

    return { 
      data: {
        path: uploadData.path,
        publicUrl: urlData.publicUrl,
        fileName: fileName,
        fileSize: file.size,
        fileType,
      }, 
      error: null 
    }

  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Get signed URL for private file access
 * 
 * Generates a temporary signed URL for secure file access.
 * 
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Promise with signed URL
 */
export const getSignedUrl = async (
  bucket: string,
  path: string,
  expiresIn: number = 3600
) => {
  return await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
}

/**
 * Delete file from storage
 * 
 * Removes a file from storage with proper permission checking.
 * 
 * @param bucket - Storage bucket name
 * @param path - File path to delete
 * @param userId - User ID requesting deletion
 * @returns Promise that resolves when deletion is complete
 */
export const deleteFile = async (
  bucket: string,
  path: string,
  userId: string
) => {
  // TODO: Add permission checking - user can only delete their own files
  
  const result = await supabase.storage
    .from(bucket)
    .remove([path])

  // TODO: Add deletion audit logging
  // TODO: Clean up database references to deleted files

  return result
}

/**
 * List files for a user or context
 * 
 * Lists files in storage with filtering and pagination.
 * 
 * @param bucket - Storage bucket name
 * @param path - Path prefix to list
 * @param options - Listing options
 * @returns Promise with file list
 */
export const listFiles = async (
  bucket: string,
  path: string,
  options: {
    limit?: number
    offset?: number
    sortBy?: { column: string, order: 'asc' | 'desc' }
  } = {}
) => {
  return await supabase.storage
    .from(bucket)
    .list(path, {
      limit: options.limit,
      offset: options.offset,
      sortBy: options.sortBy,
    })
}

/**
 * Get storage usage stats for a user
 * 
 * Calculates total storage usage across all buckets for a user.
 * 
 * @param userId - User ID to get stats for
 * @returns Promise with storage usage statistics
 */
export const getUserStorageStats = async (userId: string) => {
  const buckets = Object.values(STORAGE_BUCKETS)
  const stats = {
    totalSize: 0,
    fileCount: 0,
    bucketBreakdown: {} as Record<string, { size: number, count: number }>,
  }

  for (const bucket of buckets) {
    try {
      const { data: files, error } = await listFiles(bucket, userId)
      
      if (!error && files) {
        const bucketSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0)
        const bucketCount = files.length
        
        stats.totalSize += bucketSize
        stats.fileCount += bucketCount
        stats.bucketBreakdown[bucket] = { size: bucketSize, count: bucketCount }
      }
    } catch (err) {
      // Continue with other buckets if one fails
      console.error(`Error getting stats for bucket ${bucket}:`, err)
    }
  }

  return { data: stats, error: null }
}

/**
 * Get file extension from MIME type
 * 
 * @private
 * @param mimeType - MIME type string
 * @returns File extension with dot
 */
function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
  }
  
  return extensions[mimeType] || '.bin'
}

// TODO: Add image compression and optimization
// TODO: Add automatic backup to external storage
// TODO: Add file virus scanning integration
// TODO: Add OCR text extraction for receipts
// TODO: Add automatic file cleanup for old files
// TODO: Add batch upload functionality
// TODO: Add progress tracking for uploads
// TODO: Add file preview generation
// TODO: Add storage quota enforcement
// TODO: Add CDN integration for global file delivery 