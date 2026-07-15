import React, { createContext, useContext, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion } from 'motion/react';

const PopupContext = createContext(null);

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};

export const PopupProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popupData, setPopupData] = useState({
    title: '',
    message: '',
    type: 'info' // 'success', 'error', 'info'
  });

  const showPopup = useCallback(({ title, message, type = 'info' }) => {
    setPopupData({ title, message, type });
    setIsOpen(true);
  }, []);

  const closePopup = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <PopupContext.Provider value={{ showPopup, closePopup }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] text-center flex flex-col items-center p-6">
          <DialogHeader className="flex flex-col items-center text-center">
            {popupData.type === 'success' && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.4 }}>
                <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              </motion.div>
            )}
            {popupData.type === 'error' && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.4 }}>
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              </motion.div>
            )}
            {popupData.type === 'info' && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4, duration: 0.4 }}>
                <Info className="w-12 h-12 text-blue-500 mb-4" />
              </motion.div>
            )}
            <DialogTitle className="text-xl">{popupData.title}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-base text-center mt-2 mb-4 w-full">
            {popupData.message?.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < popupData.message.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </DialogDescription>
          <DialogFooter className="sm:justify-center w-full mt-4">
            <Button onClick={closePopup} className="w-full sm:w-auto min-w-[120px]">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PopupContext.Provider>
  );
};
