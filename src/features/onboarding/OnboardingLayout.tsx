import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { StepPayCycle } from './StepPayCycle';
import { StepInitialBills } from './StepInitialBills';

export const OnboardingLayout: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Simple progress indicator
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Let's get you set up
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Step {step} of 2
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className={`bg-blue-600 h-2.5 rounded-full`} style={{ width: step === 1 ? '50%' : '100%' }}></div>
                </div>

                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <Routes>
                        <Route index element={<Navigate to="step1" replace />} />
                        <Route path="step1" element={<StepPayCycle onNext={() => { setStep(2); navigate('step2'); }} />} />
                        <Route path="step2" element={<StepInitialBills onFinish={() => { navigate('/'); }} onBack={() => { setStep(1); navigate('step1'); }} />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};
