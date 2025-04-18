const Department = require('../models/Department');
const User = require('../models/User');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate('departmentManager', 'name email');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private (Admin/HR)
exports.createDepartment = async (req, res) => {
  try {
    const { departmentName, departmentManager } = req.body;

    // Check if department exists
    let department = await Department.findOne({ departmentName });
    if (department) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    // Create department
    department = new Department({
      departmentName,
      departmentManager
    });

    await department.save();

    res.status(201).json({
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin/HR)
exports.updateDepartment = async (req, res) => {
  try {
    const { departmentName, departmentManager } = req.body;
    const departmentId = req.params.id;

    // Check if department exists
    let department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Update department
    department.departmentName = departmentName || department.departmentName;
    department.departmentManager = departmentManager || department.departmentManager;

    await department.save();

    res.json({
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if department has users
    const users = await User.find({ departmentId: department._id });
    if (users.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete department with assigned users' 
      });
    }

    await department.remove();
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 