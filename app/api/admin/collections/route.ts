import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ collections });
  } catch (error: any) {
    console.error('[Admin Collections GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();

    if (!name) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    if (!slug) {
      return NextResponse.json(
        { error: 'Invalid collection name' },
        { status: 400 }
      );
    }

    const existing = await prisma.collection.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Collection already exists' },
        { status: 409 }
      );
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        slug,
      },
    });

    return NextResponse.json(
      { success: true, collection },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Admin Collections POST]', error);

    return NextResponse.json(
      { error: error.message || 'Failed to create collection' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const name = String(body.name || '').trim();

    if (!name) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    if (!slug) {
      return NextResponse.json(
        { error: 'Invalid collection name' },
        { status: 400 }
      );
    }

    const existing = await prisma.collection.findFirst({
      where: {
        OR: [{ name }, { slug }],
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Another collection with this name already exists' },
        { status: 409 }
      );
    }

    const current = await prisma.collection.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        name,
        slug,
      },
    });

    await prisma.product.updateMany({
      where: {
        collection: current.name,
      },
      data: {
        collection: name,
      },
    });

    return NextResponse.json({
      success: true,
      collection,
    });
  } catch (error: any) {
    console.error('[Admin Collections PUT]', error);

    return NextResponse.json(
      { error: error.message || 'Failed to update collection' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    const collection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const linkedProducts = await prisma.productCollection.count({
      where: { collectionId: id },
    });

    const legacyProducts = await prisma.product.count({
      where: { collection: collection.name },
    });

    if (linkedProducts > 0 || legacyProducts > 0) {
      return NextResponse.json(
        {
          error:
            `Cannot delete "${collection.name}" because it is being used by ${Math.max(
              linkedProducts,
              legacyProducts
            )} product(s). Remove the collection from those products first.`,
        },
        { status: 409 }
      );
    }

    await prisma.collection.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `"${collection.name}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('[Admin Collections DELETE]', error);

    return NextResponse.json(
      { error: error.message || 'Failed to delete collection' },
      { status: 500 }
    );
  }
}
