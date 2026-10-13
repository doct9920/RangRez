/**
 * Database Order Functions
 * 
 * This module provides database-backed order functions.
 * Replaces in-memory order store with PostgreSQL queries.
 */

import { prisma } from '@/lib/prisma';
import { Order, OrderItem, OrderStatus } from '@/lib/orders';
import { Prisma } from '@prisma/client';

/**
 * Convert Prisma Order to Order interface
 */
function prismaToOrder(prismaOrder: any): Order {
  return {
    id: prismaOrder.id,
    orderId: prismaOrder.orderId,
    userId: prismaOrder.userId || '',
    userEmail: prismaOrder.userEmail,
    status: prismaOrder.status as OrderStatus,
    paymentMethod: prismaOrder.paymentMethod as 'razorpay' | 'cod',
    paymentStatus: prismaOrder.paymentStatus as 'pending' | 'paid' | 'failed',
    items: prismaOrder.items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      price: Number(item.price),
      compareAtPrice: item.compareAtPrice ? Number(item.compareAtPrice) : undefined,
      size: item.size,
      quantity: item.quantity,
      image: item.image,
    })),
    subtotal: Number(prismaOrder.subtotal),
    shipping: Number(prismaOrder.shipping),
    total: Number(prismaOrder.total),
    shippingAddress: prismaOrder.shippingAddress as Order['shippingAddress'],
    createdAt: prismaOrder.createdAt,
    updatedAt: prismaOrder.updatedAt,
  };
}

/**
 * Get all orders from database
 */
export async function getAllOrdersFromDB(): Promise<Order[]> {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map(prismaToOrder);
  } catch (error) {
    console.error('[orders-db.ts] Error fetching all orders:', error);
    throw error;
  }
}

/**
 * Get order by ID from database
 */
export async function getOrderByIdFromDB(id: string): Promise<Order | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    return order ? prismaToOrder(order) : null;
  } catch (error) {
    console.error(`[orders-db.ts] Error fetching order ${id}:`, error);
    return null;
  }
}

/**
 * Get order by orderId (display ID) from database
 */
export async function getOrderByOrderIdFromDB(orderId: string): Promise<Order | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        items: true,
      },
    });

    return order ? prismaToOrder(order) : null;
  } catch (error) {
    console.error(`[orders-db.ts] Error fetching order by orderId ${orderId}:`, error);
    return null;
  }
}

/**
 * Get orders by user ID from database
 */
export async function getOrdersByUserIdFromDB(userId: string): Promise<Order[]> {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map(prismaToOrder);
  } catch (error) {
    console.error(`[orders-db.ts] Error fetching orders for user ${userId}:`, error);
    return [];
  }
}

/**
 * Get orders by user email from database
 */
export async function getOrdersByUserEmailFromDB(userEmail: string): Promise<Order[]> {
  try {
    const orders = await prisma.order.findMany({
      where: { userEmail: userEmail.toLowerCase() },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map(prismaToOrder);
  } catch (error) {
    console.error(`[orders-db.ts] Error fetching orders for email ${userEmail}:`, error);
    return [];
  }
}

/**
 * Create order in database
 */
export async function createOrderInDB(data: {
  orderId: string;
  userId: string;
  userEmail: string;
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: Order['shippingAddress'];
}): Promise<Order> {
  try {
    const normalizedEmail = data.userEmail.toLowerCase();
    
    // Create order with items in a transaction
    const order = await prisma.order.create({
      data: {
        orderId: data.orderId,
        userId: data.userId || null,
        userEmail: normalizedEmail,
        status: data.paymentMethod === 'cod' ? 'pending' : 'confirmed',
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        subtotal: new Prisma.Decimal(data.subtotal),
        shipping: new Prisma.Decimal(data.shipping),
        total: new Prisma.Decimal(data.total),
        shippingAddress: data.shippingAddress as Prisma.JsonObject,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: new Prisma.Decimal(item.price),
            compareAtPrice: item.compareAtPrice ? new Prisma.Decimal(item.compareAtPrice) : null,
            size: item.size,
            quantity: item.quantity,
            image: item.image,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    console.log(`[orders-db.ts] Order created: ${order.orderId} for user: ${normalizedEmail} (ID: ${data.userId})`);
    
    return prismaToOrder(order);
  } catch (error) {
    console.error('[orders-db.ts] Error creating order:', error);
    throw error;
  }
}

/**
 * Update order status in database
 */
export async function updateOrderStatusInDB(id: string, status: OrderStatus): Promise<Order | null> {
  try {
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        items: true,
      },
    });

    return prismaToOrder(updatedOrder);
  } catch (error) {
    console.error(`[orders-db.ts] Error updating order status for ${id}:`, error);
    return null;
  }
}

