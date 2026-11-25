import express from "express";
import AuthRoutes from "../services/auth/auth.route";
import UserRoutes from "../services/user/user.route";
import CategoryRoutes from "../services/category/category.route";
import ProductRoutes from "../services/product/product?.route";
import OrderRoutes from "../services/order/order.route";
import InvoiceRoutes from "../services/invoice/invoice.route";
import WishlistRoutes from "../services/wishlist/wishlist.route";
import BannerRoutes from "../services/banner/banner.route";
import SettingsRoutes from "../services/settings/settings.route";
import AnalyticsRoutes from "../services/analytics/analytics.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/categories",
    route: CategoryRoutes,
  },
  {
    path: "/products",
    route: ProductRoutes,
  },
  {
    path: "/orders",
    route: OrderRoutes,
  },
  {
    path: "/invoices",
    route: InvoiceRoutes,
  },
  {
    path: "/wishlist",
    route: WishlistRoutes,
  },
  {
    path: "/banners",
    route: BannerRoutes,
  },
  {
    path: "/settings",
    route: SettingsRoutes,
  },
  {
    path: "/analytics",
    route: AnalyticsRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
