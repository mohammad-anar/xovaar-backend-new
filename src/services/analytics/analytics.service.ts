import prisma from "../../config/prisma";
import { OrderStatus } from "@prisma/client";

const getDashboardOverview = async () => {
  const [totalOrders, pendingOrders, nonCanceledOrders, lowStockProducts, recentOrders] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.order.findMany({
        where: {
          status: {
            notIn: [OrderStatus.CANCELED, OrderStatus.RETURNED],
          },
        },
        select: { total: true },
      }),
      prisma.product?.count({
        where: {
          isDeleted: false,
          OR: [{ inStock: false }, { stockQuantity: { lt: 5 } }],
        },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          items: true,
          invoice: true,
        },
      }),
    ]);

  const totalRevenue = nonCanceledOrders.reduce((sum, order) => sum + order.total, 0);

  return {
    totalRevenue,
    totalOrders,
    pendingOrders,
    lowStockCount: lowStockProducts,
    recentOrders,
  };
};

const getSalesAnalytics = async () => {
  const [allOrders, categories, products] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        total: true,
        status: true,
        deliveryType: true,
        createdAt: true,
      },
    }),
    prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    }),
    prisma.product?.findMany({
      where: { isDeleted: false },
      select: { subCategory: true },
    }),
  ]);

  // Monthly revenue map
  const monthlyRevenueMap: Record<string, { revenue: number; orders: number }> = {
    Jan: { revenue: 0, orders: 0 },
    Feb: { revenue: 0, orders: 0 },
    Mar: { revenue: 0, orders: 0 },
    Apr: { revenue: 0, orders: 0 },
    May: { revenue: 0, orders: 0 },
    Jun: { revenue: 0, orders: 0 },
    Jul: { revenue: 0, orders: 0 },
    Aug: { revenue: 0, orders: 0 },
    Sep: { revenue: 0, orders: 0 },
    Oct: { revenue: 0, orders: 0 },
    Nov: { revenue: 0, orders: 0 },
    Dec: { revenue: 0, orders: 0 },
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Order status counts
  const statusCounts: Record<string, number> = {};
  let insideDhakaCount = 0;
  let outsideDhakaCount = 0;

  for (const order of allOrders) {
    const month = monthNames[new Date(order.createdAt).getMonth()];
    if (order.status !== OrderStatus.CANCELED && order.status !== OrderStatus.RETURNED) {
      if (monthlyRevenueMap[month]) {
        monthlyRevenueMap[month].revenue += order.total;
        monthlyRevenueMap[month].orders += 1;
      }
    }
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    if (order.deliveryType === "inside") insideDhakaCount++;
    else outsideDhakaCount++;
  }

  const revenueChartData = Object.entries(monthlyRevenueMap).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    orders: data.orders,
  }));

  const categoryDistribution = categories.map((cat) => ({
    name: cat.name,
    productCount: cat._count.products,
  }));

  // Subcategory breakdown
  const subCategoryCounts: Record<string, number> = {};
  for (const p of products) {
    subCategoryCounts[p.subCategory] = (subCategoryCounts[p.subCategory] || 0) + 1;
  }
  const subCategoryDistribution = Object.entries(subCategoryCounts).map(([name, count]) => ({
    name,
    count,
  }));

  return {
    revenueChartData,
    statusCounts,
    deliveryBreakdown: {
      insideDhaka: insideDhakaCount,
      outsideDhaka: outsideDhakaCount,
    },
    categoryDistribution,
    subCategoryDistribution,
  };
};

export const AnalyticsService = {
  getDashboardOverview,
  getSalesAnalytics,
};
