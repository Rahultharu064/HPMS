import prisma from "../config/client.js";

// Get all service categories
const getServiceCategories = async (req, res) => {
    try {
        const categories = await prisma.serviceCategory.findMany({
            where: { active: true },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { extraServices: true }
                }
            }
        });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching service categories:', error);
        res.status(500).json({ error: 'Failed to fetch service categories' });
    }
};

// Create a new service category
const createServiceCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        // Check if there's an inactive (soft-deleted) category with the same name
        const existingInactiveCategory = await prisma.serviceCategory.findFirst({
            where: {
                name: name,
                active: false
            }
        });

        if (existingInactiveCategory) {
            // Reactivate the existing inactive category
            const category = await prisma.serviceCategory.update({
                where: { id: existingInactiveCategory.id },
                data: {
                    active: true
                }
            });
            return res.status(201).json(category);
        }

        // Check if active category exists
        const existingActiveCategory = await prisma.serviceCategory.findUnique({
            where: { name: name }
        });

        if (existingActiveCategory) {
            return res.status(400).json({ error: 'Category name already exists' });
        }

        // Create a new category
        const category = await prisma.serviceCategory.create({
            data: {
                name
            }
        });
        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating service category:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Category name already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create service category' });
        }
    }
};

// Update a service category
const updateServiceCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, active } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        // Check if another active category already has this name (excluding current category)
        const existingCategory = await prisma.serviceCategory.findFirst({
            where: {
                name: name,
                id: { not: parseInt(id) }
            }
        });

        if (existingCategory) {
            return res.status(400).json({ error: 'Category name already exists' });
        }

        const category = await prisma.serviceCategory.update({
            where: { id: parseInt(id) },
            data: {
                name,
                active: active !== undefined ? active : undefined
            }
        });

        res.json(category);
    } catch (error) {
        console.error('Error updating service category:', error);
        res.status(500).json({ error: 'Failed to update service category' });
    }
};

// Delete a service category (Soft delete)
const deleteServiceCategory = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.serviceCategory.update({
            where: { id: parseInt(id) },
            data: { active: false }
        });

        res.json({ message: 'Service category deactivated' });
    } catch (error) {
        console.error('Error deleting service category:', error);
        res.status(500).json({ error: 'Failed to delete service category' });
    }
};

export default {
    getServiceCategories,
    createServiceCategory,
    updateServiceCategory,
    deleteServiceCategory
};
