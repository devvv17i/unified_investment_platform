import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import axios from 'axios';

const FinanceQuestionPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [responses, setResponses] = useState({});

  const questions = [
    "Do you consistently save at least 20% of your income?",
    "Have you set up an emergency fund with 3-6 months of expenses?",
    "Do you regularly check your credit score?",
    "Have you invested in the stock market?",
    "Do you follow a monthly budget?",
    "Have you started saving for retirement?",
    "Do you have any high-interest debt (above 8%)?",
    "Do you read financial news regularly?",
    "Have you made a will or estate plan?",
    "Do you use automatic payments for bills?",
    "Are you comfortable with your current financial situation?"
  ];

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedState = localStorage.getItem('financePopupState');
    if (savedState) {
      const {
        currentQuestionIndex: savedIndex,
        responses: savedResponses,
        lastShownTime,
        timeRemaining: savedTime,
        isVisible: wasVisible,
      } = JSON.parse(savedState);

      setCurrentQuestionIndex(savedIndex || 0);
      setResponses(savedResponses || {});

      const timeSinceLastShown = Date.now() - lastShownTime;

      if (timeSinceLastShown < 15000 && wasVisible) {
        const adjustedTime = Math.max(15 - Math.floor(timeSinceLastShown / 1000), 0);
        setTimeRemaining(adjustedTime);
        setIsVisible(true);
      } else {
        setTimeRemaining(15);
        setIsVisible(false);
      }
    } else {
      const timeout = setTimeout(() => {
        setIsVisible(true);
        setTimeRemaining(15);
      }, 1000);
      return () => clearTimeout(timeout);
    }

    const intervalId = setInterval(() => {
      setCurrentQuestionIndex((prevIndex) => (prevIndex + 1) % questions.length);
      setIsVisible(true);
      setTimeRemaining(15);
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stateToSave = {
      currentQuestionIndex,
      responses,
      lastShownTime: Date.now(),
      timeRemaining,
      isVisible,
    };
    localStorage.setItem('financePopupState', JSON.stringify(stateToSave));
  }, [currentQuestionIndex, responses, timeRemaining, isVisible]);

  // Timer countdown
  useEffect(() => {
    let timer;
    if (isVisible && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsVisible(false);
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isVisible, timeRemaining]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleAnswer = async (answer) => {
    const question = questions[currentQuestionIndex];
    const timestamp = new Date().toISOString();

    setResponses((prev) => ({
      ...prev,
      [question]: { answer, timestamp },
    }));

    await axios.post("http://127.0.0.1:5000/api/finance_question", {
      question,
      answer
    });

    setCurrentQuestionIndex((prev) => (prev + 1) % questions.length);
    setTimeRemaining(15);
    setIsVisible(true); 
    // Save the state after answering
    const stateToSave = {
      currentQuestionIndex: (currentQuestionIndex + 1) % questions.length,
      responses: {
        ...responses,
        [question]: {answer, timestamp},
      },
      lastShownTime: Date.now(),
      timeRemaining: 15,
      isVisible: true,
    };
    localStorage.setItem('financePopupState', JSON.stringify(stateToSave)
    )
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 bg-white rounded-lg p-6 max-w-sm z-40 shadow-lg"
          style={{
            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
            borderTop: '4px solid #3b82f6'
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <motion.h3
              className="text-lg font-semibold text-blue-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Finance Question
            </motion.h3>
            <motion.button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none rounded-full hover:bg-gray-100 p-1 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Close popup"
            >
              <X size={20} />
            </motion.button>
          </div>

          <motion.div
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-gray-700 font-medium">{questions[currentQuestionIndex]}</p>
          </motion.div>

          <motion.div
            className="flex justify-center space-x-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              onClick={() => handleAnswer('Yes')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Yes
            </motion.button>
            <motion.button
              onClick={() => handleAnswer('No')}
              className="bg-white border-2 border-blue-500 text-blue-500 hover:bg-blue-50 font-medium py-2 px-6 rounded-lg shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              No
            </motion.button>
          </motion.div>

          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-blue-500 h-2"
                initial={{ width: '100%' }}
                animate={{ width: `${(timeRemaining / 15) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>
            <p className="text-gray-500 text-xs mt-1 text-right">
              {timeRemaining} seconds remaining
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FinanceQuestionPopup;
