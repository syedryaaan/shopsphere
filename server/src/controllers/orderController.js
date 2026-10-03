import Order from '../models/Order.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/orders
export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Order must contain at least one item');
  }

  const validatedItems = [];
  let totalAmount = 0;

  // Verify each product exists, has sufficient stock, and fetch DB pricing
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.product}`);
    }

    const qty = Number(item.quantity);
    if (isNaN(qty) || qty < 1) {
      res.status(400);
      throw new Error(`Invalid quantity for ${product.name}`);
    }

    if (product.stock < qty) {
      res.status(400);
      throw new Error(`Not enough stock for ${product.name} (available: ${product.stock})`);
    }

    validatedItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: qty,
    });

    totalAmount += product.price * qty;

    // Decrement stock
    product.stock -= qty;
    await product.save();
  }

  const order = await Order.create({
    user: req.user._id,
    items: validatedItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'COD',
    totalAmount,
    status: 'pending',
  });

  res.status(201).json(order);
});

// GET /api/orders/mine
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders/:id
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const isOwner = order.user._id.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not allowed to view this order');
  }
  res.json(order);
});

// PATCH /api/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const isOwner = order.user.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  if (order.status !== 'pending') {
    res.status(400);
    throw new Error(`Cannot cancel order that is already ${order.status}`);
  }

  // Restore product stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }

  order.status = 'cancelled';
  await order.save();

  res.json(order);
});

// GET /api/orders (admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
  res.json(orders);
});

// PATCH /api/orders/:id/status (admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const previousStatus = order.status;
  const newStatus = req.body.status;

  // If changing status to cancelled, restore stock if it wasn't cancelled before
  if (newStatus === 'cancelled' && previousStatus !== 'cancelled') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }
  }

  order.status = newStatus;
  await order.save();
  res.json(order);
});
