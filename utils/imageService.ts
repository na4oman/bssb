import { Alert, Platform } from 'react-native'

// Cloudinary configuration - direct values for production reliability
const CLOUDINARY_CLOUD_NAME = 'dp1wjkhmr'
const CLOUDINARY_UPLOAD_PRESET = 'bssb-safc'

console.log('Cloudinary Config loaded successfully')

/**
 * Upload an image to Cloudinary
 * @param uri - Local URI / data URL / Blob of the image
 * @param folder - Folder path in Cloudinary (e.g., 'events', 'comments')
 * @returns Download URL of the uploaded image
 */
export const uploadImage = async (
  uri: string,
  folder: string
): Promise<string> => {
  try {
    console.log('Starting image upload...')
    console.log('Cloud Name:', CLOUDINARY_CLOUD_NAME)
    console.log('Upload Preset:', CLOUDINARY_UPLOAD_PRESET)
    console.log('Folder:', folder)
    console.log('Image URI prefix:', String(uri).slice(0, 50))

    // Create form data
    const formData = new FormData()

    if (Platform.OS === 'web') {
      // On web, expo-image-picker returns a `data:` URL. Convert it to a Blob
      // so Cloudinary can accept it. Omit the Content-Type header — the
      // browser sets the correct multipart boundary automatically.
      let blob: Blob
      const uriValue = uri as any
      if (typeof uri === 'string' && uri.startsWith('data:')) {
        const res = await fetch(uri)
        blob = await res.blob()
      } else if (
        uriValue instanceof Blob ||
        (typeof File !== 'undefined' && uriValue instanceof File)
      ) {
        blob = uriValue as Blob
      } else {
        blob = new Blob([uri], { type: 'image/jpeg' })
      }
      formData.append('file', blob, `${folder}_${Date.now()}.jpg`)
    } else {
      // Native: append the local file object
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: `${folder}_${Date.now()}.jpg`,
      } as any)
    }

    // Add upload preset
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

    // Add folder
    formData.append('folder', folder)

    console.log('Uploading to Cloudinary...')

    // Upload to Cloudinary
    const headers: Record<string, string> = Platform.OS === 'web'
      ? {}
      : { 'Content-Type': 'multipart/form-data' }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers,
      }
    )

    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Response data:', data)

    if (!response.ok) {
      throw new Error(data.error?.message || `Upload failed with status ${response.status}`)
    }

    // Return the secure URL
    console.log('Upload successful, returning URL:', data.secure_url)
    return data.secure_url
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error)
    throw error
  }
}

/**
 * Delete an image from Cloudinary
 * Note: Deletion requires authentication, so this is typically done server-side
 * For now, we'll just skip deletion on the client side
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  // Cloudinary deletion requires authentication
  // This should be done server-side or images will remain in Cloudinary
  console.log('Image deletion should be handled server-side:', imageUrl)
}

