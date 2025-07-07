// controllers/serviceController.js
import Service from '../models/Service.js';

const getAllServices = async (req, res) => {
  console.log('📡 GET /api/services hit');
  try {
    const services = await Service.find({});
    console.log('✅ Services found:', services);
    res.status(200).json(services);
  } catch (error) {
    console.error('❌ Error fetching services:', error.message);
    res.status(500).json({ message: 'Server error while fetching services' });
  }
};

// @desc Add a new service
const addService = async (req, res) => {
  try {
    const newService = new Service(req.body);
    const savedService = await newService.save();
    res.status(201).json(savedService);
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(400).json({ message: 'Error adding service' });
  }
};

export { getAllServices, addService };
