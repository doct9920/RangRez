/**
 * Database Homepage Settings Functions
 * 
 * This module provides database-backed homepage settings functions.
 */

import { prisma } from '@/lib/prisma';

export interface HomepageSettings {
  id: string;
  isPublic: boolean;
  heroBannerImage: string | null;
  heroSlides: string[];
  heroSlideLinks: Record<string, string>;
  // Keyed by category slug (see lib/categories.ts)
  collectionImages: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get homepage settings from database
 */
export async function getHomepageSettingsFromDB(): Promise<HomepageSettings | null> {
  try {
    // Check if the model exists in Prisma client
    if (!prisma.homepageSettings) {
      console.error('[homepage-settings-db.ts] HomepageSettings model not found in Prisma client. Please run: npx prisma generate');
      return null;
    }

    let settings = await prisma.homepageSettings.findUnique({
      where: { id: 'homepage' },
    });

    // If no settings exist, create default
    if (!settings) {
      settings = await prisma.homepageSettings.create({
        data: {
                    isPublic: true,
          heroBannerImage: null,
          heroSlides: [],
          heroSlideLinks: {},
          collectionImages: {},
        },
      });
    }

    return {
      id: settings.id,
      isPublic: settings.isPublic,
      heroBannerImage: settings.heroBannerImage,
      heroSlides: Array.isArray(settings.heroSlides) ? (settings.heroSlides as string[]) : [],
      heroSlideLinks: (
        settings.heroSlideLinks &&
        typeof settings.heroSlideLinks === 'object' &&
        !Array.isArray(settings.heroSlideLinks)
          ? settings.heroSlideLinks
          : {}
      ) as Record<string, string>,
      collectionImages: settings.collectionImages as HomepageSettings['collectionImages'],
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  } catch (error: any) {
    console.error('[homepage-settings-db.ts] Error fetching homepage settings:', error);
    if (error.message?.includes('homepageSettings')) {
      console.error('[homepage-settings-db.ts] Prisma client may need regeneration. Run: npx prisma generate');
    }
    return null;
  }
}

/**
 * Update homepage settings in database
 */
export async function updateHomepageSettingsInDB(
  data: Partial<Omit<HomepageSettings, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<HomepageSettings | null> {
  try {
    // Check if the model exists in Prisma client
    if (!prisma.homepageSettings) {
      console.error('[homepage-settings-db.ts] HomepageSettings model not found in Prisma client. Please run: npx prisma generate');
      throw new Error('HomepageSettings model not available. Please restart the server.');
    }

    // Check if record exists
    const existing = await prisma.homepageSettings.findUnique({
      where: { id: 'homepage' },
    });

    let settings;
    
    if (existing) {
      // Update existing record
      settings = await prisma.homepageSettings.update({
        where: { id: 'homepage' },
        data: {
          ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
          ...(data.heroBannerImage !== undefined && { heroBannerImage: data.heroBannerImage }),
          ...(data.heroSlides !== undefined && { heroSlides: data.heroSlides }),
          ...(data.heroSlideLinks !== undefined && { heroSlideLinks: data.heroSlideLinks }),
          ...(data.collectionImages && { collectionImages: data.collectionImages }),
        },
      });
    } else {
      // Create new record
      settings = await prisma.homepageSettings.create({
        data: {
                    isPublic: data.isPublic ?? true,
          heroBannerImage: data.heroBannerImage || null,
          heroSlides: data.heroSlides || [],
          heroSlideLinks: data.heroSlideLinks || {},
          collectionImages: data.collectionImages || {},
        },
      });
    }

    return {
      id: settings.id,
      isPublic: settings.isPublic,
      heroBannerImage: settings.heroBannerImage,
      heroSlides: Array.isArray(settings.heroSlides) ? (settings.heroSlides as string[]) : [],
      heroSlideLinks: (
        settings.heroSlideLinks &&
        typeof settings.heroSlideLinks === 'object' &&
        !Array.isArray(settings.heroSlideLinks)
          ? settings.heroSlideLinks
          : {}
      ) as Record<string, string>,
      collectionImages: settings.collectionImages as HomepageSettings['collectionImages'],
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  } catch (error: any) {
    console.error('[homepage-settings-db.ts] Error updating homepage settings:', error);
    console.error('[homepage-settings-db.ts] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    throw error; // Re-throw to see the actual error
  }
}

