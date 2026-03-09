import React from 'react';
import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';

const LoadingSpinner = () => {
    return (
        <div className="flex flex-col items-center justify-center p-12">
            <motion.div
                animate={{
                    rotate: 360,
                    y: [0, -20, 0]
                }}
                transition={{
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                }}
                className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center border-2 border-dashed border-blue-500/30"
            >
                <Plane className="w-10 h-10 text-blue-500" />
            </motion.div>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                className="mt-8 text-slate-400 font-medium tracking-widest uppercase text-[10px]"
            >
                Traveling across the globe...
            </motion.p>
        </div>
    );
};

export default LoadingSpinner;
