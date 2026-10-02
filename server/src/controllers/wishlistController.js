import User from '../models/User.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  res.json((user?.wishlist || []).filter(Boolean));
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { wishlist: product._id } },
    { new: true }
  ).select('wishlist');
  res.status(201).json({ wishlist: (updated.wishlist || []).map((id) => id.toString()) });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { wishlist: productId } },
    { new: true }
  ).select('wishlist');

  res.json({ wishlist: (user.wishlist || []).map((id) => id.toString()) });
});
