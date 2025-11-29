import prisma from '../config/client.js';

// Get dashboard analytics
export const getDashboardAnalytics = async (req, res) => {
    try {
        // Calculate total revenue from completed payments
        const revenueData = await prisma.payment.aggregate({
            where: {
                status: 'completed'
            },
            _sum: {
                amount: true
            }
        });

        const totalRevenue = revenueData._sum.amount || 0;

        // Calculate occupancy rate
        const totalRooms = await prisma.room.count();
        const occupiedRooms = await prisma.room.count({
            where: {
                status: 'occupied'
            }
        });
        const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

        // Calculate average room rate from active bookings
        const avgRateData = await prisma.booking.aggregate({
            where: {
                status: {
                    in: ['confirmed', 'checked_in']
                }
            },
            _avg: {
                totalAmount: true
            }
        });

        const avgRate = Math.round(avgRateData._avg.totalAmount || 0);

        // Get revenue by day for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyRevenue = await prisma.payment.groupBy({
            by: ['createdAt'],
            where: {
                status: 'completed',
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            _sum: {
                amount: true
            }
        });

        // Format daily revenue for chart
        const revenueByDay = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayRevenue = dailyRevenue
                .filter(r => r.createdAt.toISOString().split('T')[0] === dateStr)
                .reduce((sum, r) => sum + (r._sum.amount || 0), 0);

            revenueByDay.push({
                date: dateStr,
                day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
                revenue: dayRevenue
            });
        }

        // Calculate productivity (percentage of clean rooms)
        // Based on room status: available/clean = clean
        const cleanRooms = await prisma.room.count({
            where: {
                status: {
                    in: ['available', 'clean']
                }
            }
        });
        const productivity = totalRooms > 0 ? Math.round((cleanRooms / totalRooms) * 100) : 0;

        res.json({
            success: true,
            data: {
                totalRevenue,
                occupancyRate,
                avgRate,
                productivity,
                revenueByDay
            }
        });
    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard analytics'
        });
    }
};
