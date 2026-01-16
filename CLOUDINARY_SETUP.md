# Cloudinary Setup Guide

## Why Cloudinary?

Cloudinary offers a generous free tier that includes:
- 25 GB storage
- 25 GB bandwidth per month
- Image transformations and optimization
- No credit card required

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a free account
3. Verify your email

### 2. Get Your Credentials

After logging in to your Cloudinary dashboard:

1. You'll see your **Cloud Name** on the dashboard (e.g., `dxxxxx`)
2. Note this down - you'll need it

### 3. Create an Upload Preset

1. Go to **Settings** (gear icon) → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Configure the preset:
   - **Preset name**: Choose a name (e.g., `bssb_events`)
   - **Signing Mode**: Select **Unsigned** (important for client-side uploads)
   - **Folder**: Leave empty (we'll specify folders in code)
   - **Access Mode**: Public
5. Click **Save**
6. Note down the **preset name**

### 4. Update Your Code

Open `utils/imageService.ts` and replace:

```typescript
const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME' // Replace with your cloud name
const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET' // Replace with your preset name
```

With your actual values:

```typescript
const CLOUDINARY_CLOUD_NAME = 'dxxxxx' // Your cloud name from dashboard
const CLOUDINARY_UPLOAD_PRESET = 'bssb_events' // Your upload preset name
```

### 5. Optional: Add to .env (Recommended)

For better security, add these to your `.env` file:

```
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

Then update `utils/imageService.ts`:

```typescript
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
```

## How It Works

### Event Images
1. User selects image from device
2. Image is uploaded directly to Cloudinary
3. Cloudinary returns a public URL
4. URL is saved in Firestore with the event

### Comment Images
1. User attaches image to comment
2. Image is uploaded to Cloudinary
3. URL is saved with the comment in Firestore

## Folder Structure

Images are organized in Cloudinary:
- `/events/` - Event images
- `/comments/` - Comment images

## Free Tier Limits

- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- **Images**: Unlimited

This should be more than enough for your app!

## Testing

1. Create a new event with an image
2. Check your Cloudinary dashboard - you should see the image in the `/events/` folder
3. Add a comment with an image
4. Check the `/comments/` folder in Cloudinary

## Troubleshooting

### Upload fails with "Invalid upload preset"
- Make sure the upload preset is set to **Unsigned**
- Double-check the preset name matches exactly

### Upload fails with "Invalid cloud name"
- Verify your cloud name from the Cloudinary dashboard
- Make sure there are no typos

### Images not showing
- Check the browser console for errors
- Verify the URL returned from Cloudinary is accessible
- Make sure your Cloudinary account is active

## Benefits Over Firebase Storage

1. **Free tier** - No billing upgrade required
2. **Image optimization** - Automatic format conversion and compression
3. **Transformations** - Resize, crop, and optimize images on-the-fly
4. **CDN** - Fast global delivery
5. **Easy to use** - Simple REST API
