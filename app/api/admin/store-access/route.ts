import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/jwt';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(getTokenFromRequest(request));

    const settings = await prisma.homepageSettings.findUnique({
      where: { id: 'homepage' },
      select: { isPublic: true },
    });

    return NextResponse.json({ isPublic: settings?.isPublic ?? true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Could not read store access' },
      { status: error?.message?.includes('Forbidden') ? 403 : 401 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    requireAdmin(getTokenFromRequest(request));

    const body = await request.json();
    if (typeof body?.isPublic !== 'boolean') {
      return NextResponse.json({ error: 'isPublic must be true or false' }, { status: 400 });
    }

    const settings = await prisma.homepageSettings.upsert({
      where: { id: 'homepage' },
      create: {
        id: 'homepage',
        isPublic: body.isPublic,
        heroBannerImage: null,
        heroSlides: [],
        collectionImages: {},
      },
      update: { isPublic: body.isPublic },
      select: { isPublic: true },
    });

    return NextResponse.json({
      isPublic: settings.isPublic,
      message: settings.isPublic ? 'Store is now public' : 'Store is now closed to customers',
    });
  } catch (error: any) {
    console.error('[admin/store-access] Could not update store access:', error);
    return NextResponse.json(
      { error: error?.message || 'Could not update store access' },
      {
        status: error?.message?.includes('Forbidden')
          ? 403
          : error?.message?.includes('Unauthorized')
            ? 401
            : 500,
      }
    );
  }
}
