import express from 'express';
import Service from '../models/Service.js';
import { adminAuth, checkPermission } from '../middleware/adminAuth.js';

const router = express.Router();

// Get all services with filtering and pagination
router.get('/', adminAuth, checkPermission('services:read'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      category = 'all',
      status = 'all',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter query
    let filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category !== 'all') {
      filter.category = category;
    }
    
    if (status !== 'all') {
      filter.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const services = await Service.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalServices = await Service.countDocuments(filter);
    const totalPages = Math.ceil(totalServices / parseInt(limit));

    res.json({
      success: true,
      services: services.map(service => ({
        id: service._id,
        name: service.name,
        category: service.category,
        description: service.description,
        unitPrice: service.unitPrice,
        currency: service.currency,
        requiredFields: service.requiredFields,
        status: service.status || 'active',
        createdAt: service.createdAt,
        updatedAt: service.updatedAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalServices,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Admin get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services'
    });
  }
});

// Get single service details
router.get('/:serviceId', adminAuth, checkPermission('services:read'), async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      service: {
        id: service._id,
        name: service.name,
        category: service.category,
        description: service.description,
        unitPrice: service.unitPrice,
        currency: service.currency,
        requiredFields: service.requiredFields,
        status: service.status || 'active',
        createdAt: service.createdAt,
        updatedAt: service.updatedAt
      }
    });

  } catch (error) {
    console.error('Admin get service details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service details'
    });
  }
});

// Create new service
router.post('/', adminAuth, checkPermission('services:write'), async (req, res) => {
  try {
    const { 
      name, 
      category, 
      description, 
      unitPrice, 
      currency = 'SAR',
      requiredFields = [],
      status = 'active'
    } = req.body;

    // Validation
    if (!name || !category || !description || unitPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, description, and unit price are required'
      });
    }

    if (unitPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Unit price must be non-negative'
      });
    }

    // Check if service with same name already exists
    const existingService = await Service.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Service with this name already exists'
      });
    }

    const service = new Service({
      name,
      category,
      description,
      unitPrice: parseFloat(unitPrice),
      currency,
      requiredFields: Array.isArray(requiredFields) ? requiredFields : [],
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service: {
        id: service._id,
        name: service.name,
        category: service.category,
        description: service.description,
        unitPrice: service.unitPrice,
        currency: service.currency,
        requiredFields: service.requiredFields,
        status: service.status
      }
    });

  } catch (error) {
    console.error('Admin create service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service'
    });
  }
});

// Update service
router.put('/:serviceId', adminAuth, checkPermission('services:write'), async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { 
      name, 
      category, 
      description, 
      unitPrice, 
      currency,
      requiredFields,
      status
    } = req.body;

    // Validation
    if (unitPrice !== undefined && unitPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Unit price must be non-negative'
      });
    }

    // Check if another service with same name exists
    if (name) {
      const existingService = await Service.findOne({ 
        name: { $regex: `^${name}$`, $options: 'i' },
        _id: { $ne: serviceId }
      });
      if (existingService) {
        return res.status(400).json({
          success: false,
          message: 'Another service with this name already exists'
        });
      }
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (unitPrice !== undefined) updateData.unitPrice = parseFloat(unitPrice);
    if (currency) updateData.currency = currency;
    if (requiredFields) updateData.requiredFields = Array.isArray(requiredFields) ? requiredFields : [];
    if (status) updateData.status = status;

    const service = await Service.findByIdAndUpdate(
      serviceId,
      updateData,
      { new: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service updated successfully',
      service: {
        id: service._id,
        name: service.name,
        category: service.category,
        description: service.description,
        unitPrice: service.unitPrice,
        currency: service.currency,
        requiredFields: service.requiredFields,
        status: service.status,
        updatedAt: service.updatedAt
      }
    });

  } catch (error) {
    console.error('Admin update service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service'
    });
  }
});

// Delete service
router.delete('/:serviceId', adminAuth, checkPermission('services:write'), async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { permanent = false } = req.query;

    if (permanent === 'true') {
      // Permanent deletion
      const service = await Service.findByIdAndDelete(serviceId);
      
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      res.json({
        success: true,
        message: 'Service permanently deleted'
      });
    } else {
      // Soft delete - just update status
      const service = await Service.findByIdAndUpdate(
        serviceId,
        { 
          status: 'deleted',
          deletedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      res.json({
        success: true,
        message: 'Service deleted (can be restored)',
        service: {
          id: service._id,
          name: service.name,
          status: service.status
        }
      });
    }

  } catch (error) {
    console.error('Admin delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service'
    });
  }
});

// Toggle service status
router.patch('/:serviceId/status', adminAuth, checkPermission('services:write'), async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active or inactive'
      });
    }

    const service = await Service.findByIdAndUpdate(
      serviceId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: `Service status updated to ${status}`,
      service: {
        id: service._id,
        name: service.name,
        status: service.status
      }
    });

  } catch (error) {
    console.error('Admin update service status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service status'
    });
  }
});

// Get service categories
router.get('/meta/categories', adminAuth, checkPermission('services:read'), async (req, res) => {
  try {
    const categories = await Service.distinct('category');
    
    res.json({
      success: true,
      categories: categories.filter(cat => cat) // Remove null/undefined values
    });

  } catch (error) {
    console.error('Admin get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

export default router;
