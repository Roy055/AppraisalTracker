import { useState, useEffect } from 'react';
import { 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Typography, 
  Paper,
  Button,
  Tooltip
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const steps = [
  'Create Appraisal',
  'Self Review',
  'Manager Review',
  'HR Review',
  'Completed'
];

// Maps backend status to stepper active step
const statusToStepMap = {
  'pending': 0,       // Create Appraisal step
  'self-review': 1,   // Self Review step
  'pm-review': 2,     // Manager Review step
  'hr-review': 3,     // HR Review step
  'completed': 4      // Completed step
};

const AppraisalStepper = ({ appraisal, onStatusChange }) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (appraisal && appraisal.status) {
      setActiveStep(statusToStepMap[appraisal.status] || 0);
    }
  }, [appraisal]);

  // Get step description based on user role and status
  const getStepDescription = (stepIndex) => {
    if (!user) return '';
    
    switch (stepIndex) {
      case 0:
        return 'Appraisal created';
      case 1:
        return user._id === appraisal?.employee?.toString() 
          ? 'Submit your self-review' 
          : 'Waiting for employee self-review';
      case 2:
        return user.role === 'manager' 
          ? 'Provide manager feedback and rating' 
          : 'Waiting for manager review';
      case 3:
        return user.role === 'hr' 
          ? 'Finalize appraisal and assign training' 
          : 'Waiting for HR review';
      case 4:
        return 'Appraisal completed';
      default:
        return '';
    }
  };

  // Get the current action required for this step
  const getCurrentActionText = () => {
    if (!user || !appraisal) return '';
    
    const currentStatus = appraisal.status;
    
    switch (currentStatus) {
      case 'pending':
        return user._id === appraisal.employee?.toString() 
          ? 'Action: Complete your self-review' 
          : 'Waiting for employee action';
      
      case 'self-review':
        return user.role === 'manager'
          ? 'Action: Complete manager review' 
          : 'Waiting for manager action';
      
      case 'pm-review':
        return user.role === 'hr'
          ? 'Action: Complete HR review' 
          : 'Waiting for HR action';
      
      case 'hr-review':
        return user.role === 'hr'
          ? 'Action: Finalize appraisal' 
          : 'Waiting for HR to finalize';
      
      case 'completed':
        return 'Appraisal process completed';
      
      default:
        return '';
    }
  };

  if (!appraisal) return null;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Appraisal Progress
        </Typography>
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          {getCurrentActionText()}
        </Typography>
      </Box>
      
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={label} completed={activeStep > index}>
            <StepLabel>
              <Typography variant="body2">{label}</Typography>
              <Typography variant="caption" color="text.secondary">
                {getStepDescription(index)}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};

export default AppraisalStepper; 